/**
 * 消息模块
 * 站内消息通知：已读/未读、批量已读、跳转、桌面弹窗、TTS 语音播报
 */
const Messages = {
    messages: [],
    unreadCount: 0,
    currentFilter: 'all', // all / unread / read

    /**
     * 加载当前用户的消息
     */
    async load() {
        if (!Auth.currentUser) return;
        try {
            // 分别按登录名和真实姓名查询，合并结果以确保兼容性
            const queryName = DB.query(Config.TABLES.MESSAGES, {
                filters: [['where', ['recipient_id', '=', String(Auth.currentUser.name)]]],
                pageLimit: 1000
            });
            const queryReal = DB.query(Config.TABLES.MESSAGES, {
                filters: [['where', ['recipient_id', '=', String(Auth.currentUser.real_name)]]],
                pageLimit: 1000
            });
            const queryId = DB.query(Config.TABLES.MESSAGES, {
                filters: [['where', ['recipient_id', '=', String(Auth.currentUser.id)]]],
                pageLimit: 1000
            });

            const [resName, resReal, resId] = await Promise.all([queryName, queryReal, queryId]);

            // 合并并去重
            const allMsgs = [...(resName.data || []), ...(resReal.data || []), ...(resId.data || [])];
            const uniqueMsgs = [];
            const ids = new Set();
            for (const m of allMsgs) {
                if (!ids.has(m.id)) {
                    ids.add(m.id);
                    uniqueMsgs.push(m);
                }
            }

            this.messages = uniqueMsgs
                .filter(m => {
                    // 过滤掉自己发的消息
                    const creator = String(m.created_by || '');
                    const myIds = [String(Auth.currentUser.id), String(Auth.currentUser.name), String(Auth.currentUser.real_name)];
                    return !myIds.includes(creator);
                })
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            this.unreadCount = this.messages.filter(m => String(m.is_read) === '0').length;
            console.log('[消息] 加载完成，未读数量:', this.unreadCount, '总消息数:', this.messages.length);
            this.updateBadge();
            this.render();
        } catch (err) {
            console.error('[消息] 加载失败:', err);
            Toast.show('消息加载失败', 'error');
        }
    },

    /**
     * 渲染消息列表页面
     */
    render() {
        const container = document.getElementById('messages-list');
        if (!container) return;

        let filtered = this.messages;
        if (this.currentFilter === 'unread') {
            filtered = filtered.filter(m => String(m.is_read) === '0');
        } else if (this.currentFilter === 'read') {
            filtered = filtered.filter(m => String(m.is_read) === '1');
        }

        // 更新筛选栏高亮
        document.querySelectorAll('#page-messages .filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === this.currentFilter);
        });

        // 更新未读计数显示
        const countEl = document.getElementById('msg-unread-count');
        if (countEl) countEl.textContent = this.unreadCount > 0 ? `(${this.unreadCount}条未读)` : '';

        if (filtered.length === 0) {
            const emptyText = this.currentFilter === 'unread' ? '没有未读消息' : (this.currentFilter === 'read' ? '没有已读消息' : '暂无消息');
            container.innerHTML = `
                <div class="empty-state" style="padding:60px 0; text-align:center; color:#94a3b8;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="margin-bottom:16px; opacity:0.5;">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <p style="font-size:16px; font-weight:600; color:#64748b; margin-bottom:4px;">${emptyText}</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(msg => {
            const isUnread = String(msg.is_read) === '0';
            const icon = this._getTypeIcon(msg.msg_type);
            const typeLabel = this._getTypeLabel(msg.msg_type);
            return `
                <div class="msg-card ${isUnread ? 'msg-unread' : ''}" onclick="Messages.onClickMessage('${msg.id}')">
                    <div class="msg-icon">${icon}</div>
                    <div class="msg-body">
                        <div class="msg-header">
                            <span class="msg-type-tag msg-type-${msg.msg_type || 'default'}">${typeLabel}</span>
                            <span class="msg-time">${Utils.formatDate(msg.created_at)}</span>
                        </div>
                        <div class="msg-content">${Utils.escapeHTML(msg.content || '')}</div>
                    </div>
                    ${isUnread ? '<div class="msg-dot"></div>' : ''}
                </div>`;
        }).join('');
    },

    /**
     * 筛选消息
     */
    filterBy(type) {
        this.currentFilter = type;
        this.render();
    },

    /**
     * 点击消息：标记已读 + 跳转
     */
    async onClickMessage(id) {
        const msg = this.messages.find(m => String(m.id) === String(id));
        if (!msg) return;
        if (String(msg.is_read) === '0') {
            await this.markAsRead(id);
        }
        this.navigateTo(msg);
    },

    /**
     * 单条标记已读
     */
    async markAsRead(id) {
        try {
            await DB.update(Config.TABLES.MESSAGES, id, { is_read: '1' });
            const msg = this.messages.find(m => String(m.id) === String(id));
            if (msg) msg.is_read = '1';
            this.unreadCount = this.messages.filter(m => String(m.is_read) === '0').length;
            this.updateBadge();
            this.render();
        } catch (err) {
            console.error('[消息] 标记已读失败:', err);
        }
    },

    /**
     * 批量全部已读
     */
    async markAllAsRead() {
        const unread = this.messages.filter(m => m.is_read === '0');
        if (unread.length === 0) { Toast.show('没有未读消息', 'info'); return; }
        try {
            for (const msg of unread) {
                await DB.update(Config.TABLES.MESSAGES, msg.id, { is_read: '1' });
                msg.is_read = '1';
            }
            this.unreadCount = 0;
            this.updateBadge();
            this.render();
            Toast.show('已全部标记为已读', 'success');
        } catch (err) {
            console.error('[消息] 批量已读失败:', err);
            Toast.show('操作失败', 'error');
        }
    },

    /**
     * 根据 ref_type + ref_id 跳转到对应页面
     */
    navigateTo(msg) {
        switch (msg.ref_type) {
            case 'task':
                App.navigate('tasks-global');
                break;
            case 'discussion':
                App.navigate('discussions');
                setTimeout(() => {
                    if (typeof Discussions !== 'undefined') Discussions.showDetail(msg.ref_id);
                }, 300);
                break;
            case 'announcement':
                App.navigate('announcements');
                break;
            case 'skill':
                App.navigate('skills');
                break;
            case 'github':
                App.navigate('github-projects');
                break;
            default:
                break;
        }
    },

    /**
     * 更新侧边栏未读数角标
     */
    updateBadge() {
        const badge = document.getElementById('msg-badge');
        if (!badge) return;
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }

        // 更新托盘图标提示
        if (window.electron && window.electron.updateBadge) {
            window.electron.updateBadge(this.unreadCount);
        }
    },

    /**
     * 静态方法：发送消息（供其他模块调用）
     */
    async send({ type, content, recipientId, senderId, senderName, refType, refId }) {
        console.log('[消息] send 开始:', { type, recipientId });
        const targetUser = Auth.getUser(recipientId);
        let targetName = (targetUser && !targetUser.is_mock) ? targetUser.name : String(recipientId);

        if (!targetName || String(targetName) === String(Auth.currentUser?.name)) return;

        try {
            await DB.create(Config.TABLES.MESSAGES, {
                msg_type: type || 'default',
                content: content || '',
                recipient_id: String(targetName),
                is_read: '0',
                ref_type: refType || '',
                ref_id: refId ? String(refId) : ''
            });
        } catch (err) { console.error('[消息] 发送失败:', err); }
    },

    /**
     * 发给除发送者外的所有人
     */
    async sendToAll({ type, content, senderId, senderName, refType, refId }) {
        const users = Auth.allUsers || [];
        for (const user of users) {
            if (String(user.id) === String(senderId)) continue;
            await this.send({
                type, content,
                recipientId: user.name, // 关键：使用登录名确保唯一匹配
                senderId,
                refType, refId
            });
        }
    },

    // ========== 内部工具方法 ==========

    /**
     * 静默加载（仅更新角标，不渲染页面，不弹错误提示）
     */
    async _silentLoad() {
        if (!Auth.currentUser) return;
        try {
            const result = await DB.query(Config.TABLES.MESSAGES, {
                filters: [
                    ['where', ['recipient_id', '=', String(Auth.currentUser.name)]]
                ],
                pageLimit: 1000
            });
            const newMessages = (result.data || [])
                .filter(m => {
                    const creator = String(m.created_by || '');
                    const myIds = [String(Auth.currentUser.id), String(Auth.currentUser.name), String(Auth.currentUser.real_name)];
                    return !myIds.includes(creator);
                })
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // 检测新消息
            const newUnreadMessages = newMessages.filter(msg => {
                const isUnread = msg.is_read === '0';
                const isNew = !this.messages.find(old => old.id === msg.id);
                return isUnread && isNew;
            });

            this.messages = newMessages;
            this.unreadCount = this.messages.filter(m => String(m.is_read) === '0').length;
            this.updateBadge();

            // 如果有新消息，显示桌面通知
            if (newUnreadMessages.length > 0) {
                this._showDesktopNotification(newUnreadMessages[0]);
            }
        } catch (err) {
            console.warn('[消息] 静默加载失败:', err);
        }
    },

    /**
     * 显示桌面通知
     */
    _showDesktopNotification(msg) {
        if (!msg) return;

        const sender = Auth.getUser(msg.created_by);
        const senderName = sender.real_name || sender.name || '系统';

        const typeLabel = this._getTypeLabel(msg.msg_type);
        const title = `码码乐 - ${typeLabel}`;
        const body = `${senderName}: ${msg.content || '您有一条新消息'}`;

        // 使用 Electron 通知
        if (window.electron && window.electron.showNotification) {
            window.electron.showNotification(title, body);
        }
    },

    _getTypeIcon(type) {
        const icons = {
            task_assigned: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4080FF" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
            discussion_reply: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14C9C9" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
            announcement: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF7D00" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
            skill_shared: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9281FF" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
            github_shared: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00B42A" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>'
        };
        return icons[type] || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    },

    _getTypeLabel(type) {
        const labels = {
            task_assigned: '任务安排',
            discussion_reply: '讨论回复',
            announcement: '新公告',
            skill_shared: 'Skill分享',
            github_shared: 'GitHub分享'
        };
        return labels[type] || '系统消息';
    }
};
