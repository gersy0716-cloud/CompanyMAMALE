/**
 * 公告系统模块
 */
const Announcements = {
    announcements: [],

    async load() {
        try {
            // 使用数据库模式
            const allRecords = await DB.queryAll(Config.TABLES.ANNOUNCEMENTS);

            this.announcements = allRecords || [];

            // 确保用户信息已加载
            if (!Auth.allUsers || Auth.allUsers.length === 0) {
                await Auth.loadAllUsers();
            }
            this._sort();
            this.render();
        } catch (err) {
            Toast.show('加载公告失败', 'error');
        }
    },

    _sort() {
        this.announcements.sort((a, b) => {
            const aPinned = String(a.is_pinned) === '1';
            const bPinned = String(b.is_pinned) === '1';
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });
    },

    render() {
        const c = document.getElementById('announcement-list');
        if (this.announcements.length === 0) {
            c.innerHTML = '<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg><p>暂无公告</p><span>点击「发布公告」发布第一条公告</span></div>';
            return;
        }
        c.innerHTML = this.announcements.map(a => this._card(a)).join('');
    },

    _card(ann) {
        const isPinned = String(ann.is_pinned) === '1';
        const pinClass = isPinned ? 'pinned' : '';
        const badge = isPinned ? '<span class="pin-badge">置顶公告</span>' : '';
        const isAuthor = Auth.currentUser && String(Auth.currentUser.name) === String(ann.user_id);

        // 获取作者信息
        let authorName = '管理员';
        let authorColor = 'var(--primary)';

        if (ann.user_id) {
            const author = Auth.getUser(ann.user_id);
            if (author) {
                authorName = author.display_name;
                authorColor = author.avatar_color || 'var(--primary)';
                authorInitial = author.avatar_initial;
            }
        }

        return `
            <div class="announcement-card ${pinClass}">
                <div class="announcement-card-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <div class="announcement-title" style="margin-bottom:0; flex:1;">
                        ${badge}
                        ${Utils.escapeHTML(ann.name)}
                    </div>
                    <div class="announcement-actions">
                        <button class="btn-text" onclick="Announcements.togglePin(${ann.id})" title="${ann.is_pinned ? '取消置顶' : '置顶'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${ann.is_pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5"><path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14 2 9.5h7.5z"/></svg>
                        </button>
                        ${isAuthor ? `
                        <button class="btn-text btn-delete" onclick="Announcements.deleteAnnouncement(${ann.id})" title="只有发布者可删除">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
                <div class="announcement-content">
                    ${Utils.escapeHTML(ann.content)}
                </div>
                <div class="announcement-attachments" style="padding:0 16px 16px 16px;">
                    ${FileUploadHelper.renderAttachments(ann.files)}
                </div>
                <div class="announcement-footer">
                    <div class="announcement-author">
                        <div class="user-avatar announcement-author-avatar" style="background:${authorColor}; width:28px; height:28px; font-size:12px;">
                            ${authorInitial}
                        </div>
                        <span style="font-weight:600; color:var(--text-2);">${Utils.escapeHTML(authorName)}</span>
                    </div>
                    <span class="announcement-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px; margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${Utils.formatDate(ann.created_at)}
                    </span>
                </div>
            </div>
        `;
    },

    showCreateModal() {
        Modal.open('发布公告', `
            <div class="form-group">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">公告标题 *</label>
                <input type="text" id="ann-title" placeholder="输入简洁明了的标题..." style="height:44px; font-size:15px; border-radius:10px;">
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">详细内容 *</label>
                <textarea id="ann-content" placeholder="在此输入公告正文内容..." style="min-height:120px; border-radius:10px; padding:12px; font-size:14px;"></textarea>
            </div>
            <label class="checkbox-wrapper" style="margin-top:16px; display:flex; align-items:center; cursor:pointer;">
                <input type="checkbox" id="ann-pinned" style="width:16px; height:16px; margin-right:8px;">
                <span class="checkbox-label" style="font-weight:600; color:#64748b; font-size:13px;">置顶此公告</span>
            </label>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">附件上传 (选填)</label>
                <div class="file-upload-zone" id="ann-file-zone" onclick="document.getElementById('ann-file-input').click()" style="border:2px dashed #e2e8f0; border-radius:12px; padding:20px; text-align:center; cursor:pointer; transition:all 0.2s;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" style="margin-bottom:8px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p style="font-size:13px; color:#64748b; margin:0;">点击或拖拽上传文件 (支持图片、文档等)</p>
                </div>
                <input type="file" id="ann-file-input" style="display:none" multiple onchange="FileUploadHelper.handleFileUpload(event, 'ann-file-list')">
                <div id="ann-file-list" style="margin-top:12px;"></div>
            </div>
        `, `
            <button class="btn btn-primary" style="height:40px; border-radius:10px; padding:0 30px; font-weight:700;" onclick="Announcements.create()">立即发布</button>
        `);
    },

    async create() {
        const title = document.getElementById('ann-title').value.trim();
        const content = document.getElementById('ann-content').value.trim();
        const pinned = document.getElementById('ann-pinned').checked;
        if (!title || !content) { Toast.show('请填写标题和内容', 'warning'); return; }

        let files = [];
        try {
            files = await FileUploadHelper.processFilesBeforeStorage('ann-file-list');
        } catch (err) {
            Toast.show(err.message, 'error');
            return;
        }

        const d = {
            name: title,
            content,
            is_pinned: pinned ? '1' : '0',
            user_id: Auth.currentUser ? Auth.currentUser.name : ''
        };
        if (files.length > 0) d.files = JSON.stringify(files);
        try {
            // 使用数据库模式
            const n = await DB.create(Config.TABLES.ANNOUNCEMENTS, d);
            this.announcements.push(n);
            Modal.close(); this._sort(); this.render();
            Toast.show('公告发布成功', 'success');

            // 发送消息通知给所有人（排除自己）
            if (typeof Messages !== 'undefined') {
                const sender = Auth.currentUser;
                Messages.sendToAll({
                    type: 'announcement',
                    content: `新公告: ${title}`,
                    senderId: sender?.id,
                    senderName: sender?.real_name || sender?.name,
                    refType: 'announcement',
                    refId: n.id
                });
            }
        } catch (e) { Toast.show('发布失败', 'error'); }
    },

    async togglePin(id) {
        const ann = this.announcements.find(a => a.id === id);
        if (!ann) return;
        const np = !ann.is_pinned;
        try {
            // 使用数据库模式
            await DB.update(Config.TABLES.ANNOUNCEMENTS, id, { is_pinned: np });
            ann.is_pinned = np;
            this._sort(); this.render();
            Toast.show(np ? '已置顶' : '已取消置顶', 'info');
        } catch (e) { Toast.show('操作失败', 'error'); }
    },

    async deleteAnnouncement(id) {
        const ann = this.announcements.find(a => a.id === id);
        if (!ann) return;

        // 权限校验：仅发布者可删除
        if (String(ann.user_id) !== String(Auth.currentUser?.name)) {
            Toast.show('只有发布人本人可以删除公告', 'error');
            return;
        }

        try {
            // 使用数据库模式
            await DB.remove(Config.TABLES.ANNOUNCEMENTS, id);
            this.announcements = this.announcements.filter(a => a.id !== id);
            this.render(); Toast.show('公告已删除', 'info');
        } catch (e) { Toast.show('删除失败', 'error'); }
    },
};
