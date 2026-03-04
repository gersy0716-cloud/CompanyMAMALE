/**
 * Claude Code 账号管理
 * 移植自桌面版 claudecode配置工具
 * 
 * 功能：
 * - 账号列表展示（卡片视图）
 * - 日用量进度条
 * - 签到功能（当前登录用户签到使用）
 * - 一键切换当前使用账号
 * - 管理模式（新增/编辑/删除/启禁用）
 */
const ClaudeCode = {
    accounts: [],
    usageCache: {},
    isAdminMode: false,
    currentAccountId: null,

    /**
     * 初始化
     */
    async init() {
        // 读取本地配置以识别当前账号
        if (window.electron && window.electron.readClaudeSettings) {
            try {
                const config = await window.electron.readClaudeSettings();
                if (config && config.env) {
                    this._syncCurrentByConfig(config.env);
                }
            } catch (e) {
                console.error('[Claude] 初始识别失败:', e);
            }
        }
        this.loadAccounts();
    },

    /**
     * 根据本地配置尝试匹配当前账号 ID
     */
    _syncCurrentByConfig(env) {
        if (!env || !env.ANTHROPIC_AUTH_TOKEN) return;

        // 寻找匹配的账号
        const matched = this.accounts.find(a =>
            a.auth_token === env.ANTHROPIC_AUTH_TOKEN &&
            (a.base_url || '').replace(/\/+$/, '') === (env.ANTHROPIC_BASE_URL || '').replace(/\/+$/, '')
        );

        if (matched) {
            this.currentAccountId = matched.id;
        }
    },

    _apiUrl(recordId) {
        const baseUrl = Config.DB_API_URL;
        const baseId = Config.DB_BASE_ID;
        const tableId = Config.TABLES.CLAUDES;
        let url = `${baseUrl}/api/bases/${baseId}/tables/${tableId}/records`;
        if (recordId) url += `/${recordId}`;
        return url;
    },

    _headers() {
        return {
            'x-bm-token': Config.DB_TOKEN,
            'Content-Type': 'application/json'
        };
    },

    /**
     * 加载所有账号
     */
    async loadAccounts(refreshUsage = true) {
        const container = document.getElementById('cc-account-list');
        const statusEl = document.getElementById('cc-status');

        if (!container) return;
        // 只有在没数据且需要刷新时才显示Loading
        if (this.accounts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';
        }

        try {
            const resp = await fetch(this._apiUrl(), { headers: this._headers() });
            const result = await resp.json();
            if (result.error) throw new Error(result.error);

            this.accounts = (result.data || result.list || []).map(row => ({
                id: row.Id || row.id,
                name: row.name || '',
                base_url: row.base_url || '',
                auth_token: row.auth_token || '',
                query_url: row.query_url || '',
                channel_type: row.channel_type || '老甘AI通道',
                // 兼容多种字段名
                remark: row.remark || row.Remark || row.notes || row.Notes || row.desc || row.description || '',
                is_active: row.is_active ?? 'true'
            }));

            // 如果启动时没匹配到，或者强制刷新后，再次尝试根据配置文件同步当前账号
            if (!this.currentAccountId && window.electron && window.electron.readClaudeSettings) {
                const config = await window.electron.readClaudeSettings();
                if (config && config.env) {
                    this._syncCurrentByConfig(config.env);
                }
            }

            const active = this.accounts.filter(a => this._isActive(a));
            const disabled = this.accounts.filter(a => !this._isActive(a));

            if (statusEl) statusEl.innerHTML = '';

            this._renderAccounts(active, disabled);

            // 仅在需要刷新时加载日用量
            if (refreshUsage) {
                active.forEach(acc => {
                    if (acc.query_url && acc.auth_token) {
                        this._loadUsage(acc);
                    }
                });
            }

        } catch (err) {
            container.innerHTML = `<div class="empty-state"><p>加载失败: ${err.message}</p></div>`;
            if (statusEl) statusEl.innerHTML = '';
        }
    },

    _isActive(account) {
        return ['true', '1', true, 1].includes(account.is_active);
    },

    /**
     * 渲染账号卡片
     */
    _renderAccounts(active, disabled) {
        const container = document.getElementById('cc-account-list');
        if (!container) return;

        const isCurrent = id => String(id) === String(this.currentAccountId);
        const today = new Date().toISOString().slice(0, 10);

        const renderCard = (acc) => {
            const isDisabled = !this._isActive(acc);
            const current = isCurrent(acc.id);

            // 正在使用状态
            const statusHTML = `
                <div class="cc-user-status empty">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span class="cc-status-text">${this._isActive(acc) ? ('使用中：' + (acc.remark || '暂无')) : '已禁用'}</span>
                </div>
            `;

            // 用户操作按钮
            const user = Auth.currentUser;
            const userName = user ? (user.real_name || user.name || '未知用户') : '';
            const isCheckedIn = acc.remark === userName;
            const checkInText = isCheckedIn ? '签退' : '签到';
            const checkInClass = isCheckedIn ? 'btn btn-danger btn-sm' : 'btn btn-secondary btn-sm'; // 签退使用红色样式，签到使用蓝色样式

            const userActions = !isDisabled ? `
                <div class="cc-btn-group">
                    ${!current ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); ClaudeCode.switchTo('${acc.id}')">切换账号</button>` : ''}
                    <button class="${checkInClass}" onclick="event.stopPropagation(); ClaudeCode.checkIn('${acc.id}')">${checkInText}</button>
                </div>
            ` : '';

            // 管理模式操作
            const adminActions = this.isAdminMode ? `
                <div class="cc-admin-actions">
                    <button class="cc-icon-btn" onclick="event.stopPropagation(); ClaudeCode.showEditModal('${acc.id}')" title="更新信息">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="cc-icon-btn ${isDisabled ? 'enable' : 'disable'}" onclick="event.stopPropagation(); ClaudeCode.toggleActive('${acc.id}')" title="${isDisabled ? '启用' : '禁用'}">
                        ${isDisabled ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'}
                    </button>
                    <button class="cc-icon-btn delete" onclick="event.stopPropagation(); ClaudeCode.deleteAccount('${acc.id}')" title="删除">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            ` : '';

            // 优先使用缓存
            let usageHTML = '';
            if (this.usageCache[acc.id]) {
                const { dailyCost, dailyLimit, weeklyCost, weeklyLimit } = this.usageCache[acc.id];
                const dailyPct = Math.min(100, (dailyCost / dailyLimit * 100)).toFixed(1);
                const dailyColor = dailyPct > 80 ? 'var(--error)' : dailyPct > 50 ? 'var(--warning)' : 'var(--primary)';
                const weeklyPct = Math.min(100, ((weeklyCost || 0) / (weeklyLimit || 1) * 100)).toFixed(1);
                const weeklyColor = weeklyPct > 80 ? 'var(--error)' : weeklyPct > 50 ? 'var(--warning)' : 'var(--primary)';
                usageHTML = `
                    <div class="cc-usage-item">
                        <div class="cc-usage-header">
                            <span>日用量统计</span>
                            <span>$${dailyCost.toFixed(2)} / $${dailyLimit.toFixed(2)}</span>
                        </div>
                        <div class="cc-progress">
                            <div class="cc-progress-bar" style="width:${dailyPct}%; background:${dailyColor};"></div>
                        </div>
                    </div>
                    <div class="cc-usage-item" style="margin-top:8px;">
                        <div class="cc-usage-header">
                            <span>周用量统计</span>
                            <span>$${(weeklyCost || 0).toFixed(2)} / $${(weeklyLimit || 0).toFixed(2)}</span>
                        </div>
                        <div class="cc-progress">
                            <div class="cc-progress-bar" style="width:${weeklyPct}%; background:${weeklyColor};"></div>
                        </div>
                    </div>
                `;
            } else {
                usageHTML = acc.query_url ? '<div class="cc-usage-loading">数据查询中...</div>' : '<div class="cc-usage-na">未配置用量查询</div>';
            }

            return `
                <div class="cc-card ${current ? 'cc-card-current' : ''} ${isDisabled ? 'cc-card-disabled' : ''}" data-id="${acc.id}">
                    <div class="cc-card-header">
                        <div class="cc-card-name">
                            <span class="cc-name-dot"></span>
                            ${Utils.escapeHTML(acc.name)}
                            ${current ? '<span class="cc-active-tag">当前会话</span>' : ''}
                            <span class="cc-channel-tag">${Utils.escapeHTML(acc.channel_type || '老甘AI通道')}</span>
                        </div>
                        ${adminActions}
                    </div>
                    <div class="cc-card-body">
                        ${statusHTML}
                        <div class="cc-usage-area" id="cc-usage-${acc.id}">
                            ${usageHTML}
                        </div>
                    </div>
                    <div class="cc-card-footer">
                        ${userActions}
                    </div>
                </div>
            `;
        };

        let html = '';
        if (active.length > 0) {
            html += `<div class="cc-grid">${active.map(renderCard).join('')}</div>`;
        }
        if (disabled.length > 0 && this.isAdminMode) {
            html += `<div class="cc-grid" style="margin-top:24px;">${disabled.map(renderCard).join('')}</div>`;
        }
        if (active.length === 0 && (disabled.length === 0 || !this.isAdminMode)) {
            html = '<div class="empty-state"><p>暂无可用账号</p></div>';
        }

        container.innerHTML = html;
    },

    /**
     * 加载日用量
     */
    async _loadUsage(acc) {
        const el = document.getElementById(`cc-usage-${acc.id}`);
        if (!el) return;

        try {
            const baseUrl = (acc.query_url || '').replace(/\/+$/, '');
            if (!baseUrl || !acc.auth_token) {
                el.innerHTML = '<div class="cc-usage-na">未配置查询信息</div>';
                return;
            }

            // 云译通道：直接用 GET /user/api/v1/me
            if ((acc.channel_type || '') === '云译通道') {
                const resp = await fetch(`${baseUrl}/user/api/v1/me`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${acc.auth_token}` }
                });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                const quota = data.quota || {};

                const dailyRemaining = quota.daily_remaining || 0;
                const dailyQuota = quota.daily_quota || 1;
                const dailySpent = quota.daily_spent || 0;
                // 单位是积分，除以1000转为$（原始值/100再/10）
                const remainingDollar = (dailyRemaining / 1000).toFixed(2);
                const quotaDollar = (dailyQuota / 1000).toFixed(2);
                const spentDollar = (dailySpent / 1000).toFixed(2);
                const dailyPct = Math.min(100, (dailySpent / dailyQuota * 100)).toFixed(1);
                const dailyColor = dailyPct > 80 ? 'var(--error)' : dailyPct > 50 ? 'var(--warning)' : 'var(--primary)';

                el.innerHTML = `
                    <div class="cc-usage-item">
                        <div class="cc-usage-header">
                            <span>日用量统计</span>
                            <span>$${spentDollar} / $${quotaDollar}</span>
                        </div>
                        <div class="cc-progress">
                            <div class="cc-progress-bar" style="width:${dailyPct}%; background:${dailyColor};"></div>
                        </div>
                    </div>
                    <div class="cc-usage-item" style="margin-top:8px;">
                        <div class="cc-usage-header">
                            <span>今日剩余</span>
                            <span>$${remainingDollar}</span>
                        </div>
                    </div>
                `;
                this.usageCache[acc.id] = { dailyCost: dailySpent / 1000, dailyLimit: dailyQuota / 1000 };
                return;
            }

            // 老甘AI通道：原有逻辑
            const keyResp = await fetch(`${baseUrl}/apiStats/api/get-key-id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: acc.auth_token })
            });

            if (!keyResp.ok) throw new Error(`HTTP ${keyResp.status}`);
            const keyResult = await keyResp.json();

            if (!keyResult.success || !keyResult.data?.id) {
                el.innerHTML = `<div class="cc-usage-na" title="${keyResult.message || ''}">无效 Key</div>`;
                return;
            }

            const statsResp = await fetch(`${baseUrl}/apiStats/api/user-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiId: keyResult.data.id })
            });

            if (!statsResp.ok) throw new Error(`HTTP ${statsResp.status}`);
            const statsResult = await statsResp.json();
            const limits = statsResult.data?.limits || {};

            const dailyCost = limits.currentDailyCost || 0;
            const dailyLimit = limits.dailyCostLimit || 1;
            const dailyPct = Math.min(100, (dailyCost / dailyLimit * 100)).toFixed(1);
            const dailyColor = dailyPct > 80 ? 'var(--error)' : dailyPct > 50 ? 'var(--warning)' : 'var(--primary)';

            const weeklyCost = limits.currentWeeklyCost || 0;
            const weeklyLimit = limits.weeklyCostLimit || 1;
            const weeklyPct = Math.min(100, (weeklyCost / weeklyLimit * 100)).toFixed(1);
            const weeklyColor = weeklyPct > 80 ? 'var(--error)' : weeklyPct > 50 ? 'var(--warning)' : 'var(--primary)';

            el.innerHTML = `
                <div class="cc-usage-item">
                    <div class="cc-usage-header">
                        <span>日用量统计</span>
                        <span>$${dailyCost.toFixed(2)} / $${dailyLimit.toFixed(2)}</span>
                    </div>
                    <div class="cc-progress">
                        <div class="cc-progress-bar" style="width:${dailyPct}%; background:${dailyColor};"></div>
                    </div>
                </div>
                <div class="cc-usage-item" style="margin-top:8px;">
                    <div class="cc-usage-header">
                        <span>周用量统计</span>
                        <span>$${weeklyCost.toFixed(2)} / $${weeklyLimit.toFixed(2)}</span>
                    </div>
                    <div class="cc-progress">
                        <div class="cc-progress-bar" style="width:${weeklyPct}%; background:${weeklyColor};"></div>
                    </div>
                </div>
            `;
            this.usageCache[acc.id] = { dailyCost, dailyLimit, weeklyCost, weeklyLimit };

        } catch (err) {
            console.error(`Usage query failed for ${acc.name}:`, err);
            el.innerHTML = `<div class="cc-usage-na" title="${err.message}">查询失败</div>`;
        }
    },

    /**
     * 切换当前账号 (自动登记使用人 + 物理更新配置文件)
     */
    async switchTo(accountId) {
        this.currentAccountId = accountId;
        const acc = this.accounts.find(a => String(a.id) === String(accountId));
        if (!acc) return;

        // 1. 物理更新本地配置文件 (~/.claude/settings.json)
        if (window.electron && window.electron.writeClaudeSettings) {
            try {
                const config = {
                    env: {
                        ANTHROPIC_AUTH_TOKEN: acc.auth_token,
                        ANTHROPIC_BASE_URL: acc.base_url
                    },
                    includeCoAuthoredBy: false
                };
                const res = await window.electron.writeClaudeSettings(config);
                if (!res.success) throw new Error(res.error);
                console.log('[Claude] 本地配置文件同步成功');
            } catch (e) {
                console.error('[Claude] 本地同步失败:', e);
                Toast.show('本地配置文件更新失败', 'error');
                // 即使本地失败，业务逻辑继续（可能是在非桌面环境）
            }
        }

        // 2. 自动登记当前使用人 (服务器端记录)
        const user = Auth.currentUser;
        if (user) {
            const userName = user.real_name || user.name || '未知用户';
            try {
                // 互斥逻辑：清除该用户在其他账号的签到
                const otherActiveAccs = this.accounts.filter(a =>
                    String(a.id) !== String(accountId) &&
                    (a.remark === userName)
                );

                for (const oldAcc of otherActiveAccs) {
                    oldAcc.remark = '';
                    fetch(this._apiUrl(oldAcc.id), {
                        method: 'PATCH',
                        headers: this._headers(),
                        body: JSON.stringify({ remark: '' })
                    }).catch(e => console.error('自动签退失败:', e));
                }

                // 登记当前账号
                acc.remark = userName;

                // 提交到服务器
                await fetch(this._apiUrl(accountId), {
                    method: 'PATCH',
                    headers: this._headers(),
                    body: JSON.stringify({ remark: userName })
                });

                Toast.show(`已切换并自动签到: ${acc.name}`, 'success');
            } catch (err) {
                console.error('自动登记失败:', err);
            }
        } else {
            Toast.show(`已切换到: ${acc.name}`, 'success');
        }

        // 切换后必须强制刷新，确保 UI 高亮和日用量实时同步
        this.loadAccounts(true);
    },

    /**
     * 签到 / 签退
     */
    async checkIn(accountId) {
        const user = Auth.currentUser;
        if (!user) {
            Toast.show('请先登录后签到', 'warning');
            return;
        }

        const acc = this.accounts.find(a => String(a.id) === String(accountId));
        if (!acc) return;

        const userName = user.real_name || user.name || '未知用户';

        // 检查是否已签到
        if (acc.remark === userName) {
            // 签退
            try {
                acc.remark = '';
                // 立即渲染（乐观更新）
                this._renderAccounts(
                    this.accounts.filter(a => this._isActive(a)),
                    this.accounts.filter(a => !this._isActive(a))
                );

                // 提交到服务器
                await fetch(this._apiUrl(accountId), {
                    method: 'PATCH',
                    headers: this._headers(),
                    body: JSON.stringify({ remark: '' })
                });

                Toast.show(`已签退账号: ${acc.name}`, 'success');
                // 签退后刷新，确保同步
                this.loadAccounts(true);
            } catch (err) {
                console.error('签退失败:', err);
                Toast.show('签退失败', 'error');
            }
        } else {
            // 签到 -> 触发切换逻辑（含物理更新）
            await this.switchTo(accountId);
        }
    },

    // ========== 管理模式 ==========

    toggleAdminMode() {
        Modal.open('管理员认证', `
            <div style="padding: 10px 0;">
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-weight:600; color:#475569; margin-bottom:8px; display:block;">请输入管理密码</label>
                    <input type="password" id="cc-admin-pwd-input" placeholder="输入密码以进入管理模式..." 
                           style="height:46px; border-radius:12px; font-size:15px; border:2px solid #e2e8f0; width:100%; box-sizing:border-box; padding:0 16px;"
                           onkeyup="if(event.key==='Enter') ClaudeCode._confirmAdminMode()">
                </div>
                <p style="font-size:12px; color:#94a3b8; margin-top:12px;">提示：进入管理模式后可以新增、修改、启禁用或删除账号。</p>
            </div>
        `, `
            <button class="btn btn-primary" style="height:42px; padding:0 30px; border-radius:10px; font-weight:700;" onclick="ClaudeCode._confirmAdminMode()">确认进入</button>
        `);

        // 自动聚焦
        setTimeout(() => {
            const input = document.getElementById('cc-admin-pwd-input');
            if (input) input.focus();
        }, 300);
    },

    _confirmAdminMode() {
        const input = document.getElementById('cc-admin-pwd-input');
        const password = input ? input.value : '';

        if (password === '123654') {
            this.isAdminMode = true;
            Modal.close();
            const tb = document.getElementById('cc-admin-toolbar');
            if (tb) tb.style.display = 'block';
            Toast.show('已进入管理模式', 'success');
            this.loadAccounts();
        } else {
            Toast.show('密码错误', 'error');
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    },

    exitAdminMode() {
        this.isAdminMode = false;
        const tb = document.getElementById('cc-admin-toolbar');
        if (tb) tb.style.display = 'none';
        this.loadAccounts();
    },

    showAddAccountModal() {
        Modal.open('新增账号', `
            <div class="form-group">
                <label>账号名称 *</label>
                <input type="text" id="cc-name" placeholder="例如: 主账号">
            </div>
            <div class="form-group">
                <label>种类 *</label>
                <select id="cc-channel-type">
                    <option value="老甘AI通道" selected>老甘AI通道</option>
                    <option value="云译通道">云译通道</option>
                </select>
            </div>
            <div class="form-group">
                <label>Base URL *</label>
                <input type="text" id="cc-baseurl" placeholder="https://api.anthropic.com">
            </div>
            <div class="form-group">
                <label>Auth Token *</label>
                <input type="text" id="cc-token" placeholder="sk-ant-...">
            </div>
            <div class="form-group">
                <label>查询网址（选填）</label>
                <input type="text" id="cc-queryurl" placeholder="https://xxx.com">
            </div>
        `, `
            <button class="btn btn-primary" style="height:40px; padding:0 30px; font-weight:700;" onclick="ClaudeCode.createAccount()">确认创建</button>
        `);
    },

    async createAccount() {
        const name = document.getElementById('cc-name').value.trim();
        const channel_type = document.getElementById('cc-channel-type').value;
        const base_url = document.getElementById('cc-baseurl').value.trim();
        const auth_token = document.getElementById('cc-token').value.trim();
        const query_url = document.getElementById('cc-queryurl').value.trim();

        if (!name || !base_url || !auth_token) {
            Toast.show('请填写必填字段', 'warning');
            return;
        }

        try {
            const resp = await fetch(this._apiUrl(), {
                method: 'POST',
                headers: this._headers(),
                body: JSON.stringify({ name, channel_type, base_url, auth_token, query_url, is_active: 'true' })
            });
            const result = await resp.json();
            if (result.error) throw new Error(result.error);

            Modal.close();
            Toast.show('账号创建成功', 'success');
            this.loadAccounts();
        } catch (err) {
            Toast.show('创建失败: ' + err.message, 'error');
        }
    },

    showEditModal(accountId) {
        const acc = this.accounts.find(a => String(a.id) === String(accountId));
        if (!acc) return;

        const channelType = acc.channel_type || '老甘AI通道';
        Modal.open('更新信息', `
            <div class="form-group">
                <label>账号名称 *</label>
                <input type="text" id="cc-edit-name" value="${Utils.escapeHTML(acc.name)}">
            </div>
            <div class="form-group">
                <label>种类 *</label>
                <select id="cc-edit-channel-type">
                    <option value="老甘AI通道" ${channelType === '老甘AI通道' ? 'selected' : ''}>老甘AI通道</option>
                    <option value="云译通道" ${channelType === '云译通道' ? 'selected' : ''}>云译通道</option>
                </select>
            </div>
            <div class="form-group">
                <label>Base URL *</label>
                <input type="text" id="cc-edit-baseurl" value="${Utils.escapeHTML(acc.base_url)}">
            </div>
            <div class="form-group">
                <label>Auth Token *</label>
                <input type="text" id="cc-edit-token" value="${Utils.escapeHTML(acc.auth_token)}">
            </div>
            <div class="form-group">
                <label>查询网址</label>
                <input type="text" id="cc-edit-queryurl" value="${Utils.escapeHTML(acc.query_url)}">
            </div>
        `, `
            <button class="btn btn-primary" style="height:40px; padding:0 30px; font-weight:700;" onclick="ClaudeCode.updateAccount('${accountId}')">保存修改</button>
        `);
    },

    async updateAccount(accountId) {
        const data = {
            name: document.getElementById('cc-edit-name').value.trim(),
            channel_type: document.getElementById('cc-edit-channel-type').value,
            base_url: document.getElementById('cc-edit-baseurl').value.trim(),
            auth_token: document.getElementById('cc-edit-token').value.trim(),
            query_url: document.getElementById('cc-edit-queryurl').value.trim()
        };

        if (!data.name || !data.base_url || !data.auth_token) {
            Toast.show('请填写必填字段', 'warning');
            return;
        }

        try {
            const resp = await fetch(this._apiUrl(accountId), {
                method: 'PATCH',
                headers: this._headers(),
                body: JSON.stringify(data)
            });
            const result = await resp.json();
            if (result.error) throw new Error(result.error);

            Modal.close();
            Toast.show('保存成功', 'success');
            this.loadAccounts();
        } catch (err) {
            Toast.show('保存失败: ' + err.message, 'error');
        }
    },

    async toggleActive(accountId) {
        const acc = this.accounts.find(a => String(a.id) === String(accountId));
        if (!acc) return;

        const newState = this._isActive(acc) ? 'false' : 'true';
        const action = newState === 'true' ? '启用' : '禁用';

        try {
            const resp = await fetch(this._apiUrl(accountId), {
                method: 'PATCH',
                headers: this._headers(),
                body: JSON.stringify({ is_active: newState })
            });
            const result = await resp.json();
            if (result.error) throw new Error(result.error);

            Toast.show(`已${action}`, 'success');
            this.loadAccounts();
        } catch (err) {
            Toast.show(`${action} 失败`, 'error');
        }
    },

    async deleteAccount(accountId) {
        if (!confirm('确定彻底删除此 Claude 账号配置吗？')) return;
        const acc = this.accounts.find(a => String(a.id) === String(accountId));

        try {
            const resp = await fetch(this._apiUrl(accountId), {
                method: 'DELETE',
                headers: this._headers()
            });
            const result = await resp.json();
            if (result.error) throw new Error(result.error);

            Toast.show('已删除', 'success');
            this.loadAccounts();
        } catch (err) {
            Toast.show('删除失败: ' + err.message, 'error');
        }
    }
};
