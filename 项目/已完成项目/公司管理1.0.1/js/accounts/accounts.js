/**
 * 账号管理模块 — 分类卡片流
 * 字段: 名称 / 网址 / 账号 / 密码 / 备注
 */
const Accounts = {
    accounts: [],
    filteredAccounts: [],
    categories: [],
    currentCategory: null,
    categorySortBy: 'name',
    categorySortAsc: true,
    categorySearchKeyword: '',

    async init() {
        await this.load();
        await this.loadCategories();
        this.render();
    },

    async load() {
        try {
            this.accounts = await DB.queryAll(Config.TABLES.ACCOUNTS);
            this.filteredAccounts = [...this.accounts];
        } catch (err) {
            Toast.show('加载账号失败', 'error');
        }
    },

    async loadCategories() {
        try {
            const accounts = await DB.queryAll(Config.TABLES.ACCOUNTS);
            const cats = new Set();
            accounts.forEach(a => { if (a.category) cats.add(a.category); });
            ["Gemini", "码码乐平台"].forEach(c => cats.add(c));
            this.categories = Array.from(cats).sort();
        } catch (err) {
            this.categories = ["Gemini", "码码乐平台"];
        }
    },

    search(keyword) {
        const kw = (keyword || '').toLowerCase().trim();
        if (!kw) {
            this.filteredAccounts = [...this.accounts];
        } else {
            this.filteredAccounts = this.accounts.filter(a =>
                (a.name || '').toLowerCase().includes(kw) ||
                (a.url || '').toLowerCase().includes(kw) ||
                (a.username || '').toLowerCase().includes(kw) ||
                (a.notes || '').toLowerCase().includes(kw) ||
                (a.category || '').toLowerCase().includes(kw)
            );
        }
        this.render();
    },

    render() {
        const container = document.getElementById('account-table-wrap');
        if (!container) return;

        if (this.filteredAccounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p style="padding:40px; color:var(--text-4);">
                        ${this.accounts.length === 0 ? '暂无账号，点击「添加账号」开始' : '没有匹配的账号'}
                    </p>
                </div>
            `;
            return;
        }

        const groups = {};
        this.filteredAccounts.forEach(acc => {
            const cat = acc.category || '未分类';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(acc);
        });

        if (this.currentCategory && groups[this.currentCategory]) {
            this._renderAccountList(container, this.currentCategory, groups[this.currentCategory]);
            return;
        }

        const sortedCats = Object.keys(groups).sort((a, b) => {
            if (a === '未分类') return 1;
            if (b === '未分类') return -1;
            return a.localeCompare(b);
        });

        const catColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#84cc16'];

        container.innerHTML = `
            <div class="acc-cat-grid">
                ${sortedCats.map((cat, i) => {
            const color = catColors[i % catColors.length];
            const count = groups[cat].length;
            // 选一个跟分类相关的图标，暂时用基础图标
            return `
                        <div class="acc-cat-card" onclick="Accounts.openCategory('${Utils.escapeHTML(cat)}')" style="--cat-color: ${color}">
                            <div class="acc-cat-icon">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                            </div>
                            <div class="acc-cat-info">
                                <div class="acc-cat-name">${Utils.escapeHTML(cat)}</div>
                                <div class="acc-cat-count">${count} 个账号</div>
                            </div>
                            <svg class="acc-cat-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    openCategory(cat) {
        this.currentCategory = cat;
        this.render();
    },

    backToCategories() {
        this.currentCategory = null;
        this.render();
    },

    _renderAccountList(container, catName, accounts) {
        const copyIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;

        container.innerHTML = `
                <div class="acc-list-breadcrumb">
                    <button class="acc-back-btn" onclick="Accounts.backToCategories()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                        返回分类
                    </button>
                    <span class="acc-breadcrumb-title">${Utils.escapeHTML(catName)}</span>
                    <span class="acc-breadcrumb-count">${accounts.length} 个账号</span>
                </div>
                <div class="acc-card-grid">
                    ${accounts.map(acc => `
                        <div class="acc-card" style="cursor:default;">
                            <div class="acc-card-header">
                                <div class="acc-card-name">${Utils.escapeHTML(acc.name || acc.username || '未命名')}</div>
                                <button class="acc-card-edit" onclick="event.stopPropagation(); Accounts.showEditModal(${acc.id})" title="更新信息">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121(0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                            </div>
                            <div class="acc-card-fields">
                                <div class="acc-field-row">
                                    <span class="acc-field-label">账号</span>
                                    <span class="acc-field-value" style="font-family:'JetBrains Mono',monospace; font-size:13px;">${Utils.escapeHTML(acc.username || '—')}</span>
                                    ${acc.username ? `<button class="acc-inline-copy" onclick="event.stopPropagation(); Accounts.copy('${Utils.escapeHTML(acc.username)}')" title="复制账号">${copyIcon}</button>` : ''}
                                </div>
                                <div class="acc-field-row">
                                    <span class="acc-field-label">密码</span>
                                    <span class="acc-field-value" style="font-family:'JetBrains Mono',monospace; font-size:13px;">${Utils.escapeHTML(acc.password || '—')}</span>
                                    ${acc.password ? `<button class="acc-inline-copy" onclick="event.stopPropagation(); Accounts.copy('${Utils.escapeHTML(acc.password)}')" title="复制密码">${copyIcon}</button>` : ''}
                                </div>
                                ${acc.url ? `
                                <div class="acc-field-row">
                                    <span class="acc-field-label">地址</span>
                                    <span class="acc-field-value" style="font-size:12px; color:var(--primary);">${Utils.escapeHTML(acc.url)}</span>
                                    <button class="acc-inline-copy" onclick="event.stopPropagation(); Accounts.copy('${Utils.escapeHTML(acc.url)}')" title="复制地址">${copyIcon}</button>
                                </div>` : ''}
                                ${acc.notes ? `
                                <div class="acc-field-row" style="border-top:1px dashed #e2e8f0; padding-top:8px; margin-top:4px;">
                                    <span class="acc-field-label">备注</span>
                                    <span class="acc-field-value" style="font-size:12px; color:#64748b;">${Utils.escapeHTML(acc.notes)}</span>
                                </div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    showAccountView(id) {
        const acc = this.accounts.find(a => a.id === id);
        if (!acc) return;

        const pwdId = `pwd-${Date.now()}`;

        // 使用 XHS 风格的 Header
        const headerHTML = `
            <div class="xhs-modal-header-custom">
                <div class="xhs-header-name" style="font-size:18px; margin-left:8px;">账号详情</div>
            </div>
        `;

        const bodyHtml = `
            <div class="acc-view-wrapper" style="padding: 12px 20px 24px;">
                <div style="background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius:14px; padding:24px; border:1px solid #e2e8f0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="font-size:20px; font-weight:800; color:#1e293b; margin-bottom:24px; display:flex; align-items:center; gap:12px;">
                        <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg, #4080ff 0%, #8b5cf6 100%); display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(64,128,255,0.2);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        </div>
                        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${Utils.escapeHTML(acc.name || '未命名账号')}</div>
                    </div>
                    
                    ${acc.url ? `
                    <div class="acc-view-field" style="margin-bottom:20px;">
                        <div style="font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">访问网址</div>
                        <div style="display:flex; align-items:center; gap:12px; background:white; padding:10px 14px; border-radius:10px; border:1px solid #edf2f7;">
                            <a href="javascript:void(0)" onclick="window.electron.openExternal('${acc.url}')" style="flex:1; font-size:14px; color:#4080ff; text-decoration:none; word-break:break-all; font-weight:500;">${Utils.escapeHTML(acc.url)}</a>
                            <button class="acc-copy-btn" onclick="Accounts.copy('${Utils.escapeHTML(acc.url)}')" title="复制网址">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                            </button>
                        </div>
                    </div>` : ''}

                    <div class="acc-view-field" style="margin-bottom:20px;">
                        <div style="font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">登录账号</div>
                        <div style="display:flex; align-items:center; gap:12px; background:white; padding:10px 14px; border-radius:10px; border:1px solid #edf2f7;">
                            <span style="flex:1; font-size:15px; font-weight:700; color:#334155; font-family:'JetBrains Mono', monospace;">${Utils.escapeHTML(acc.username || '—')}</span>
                            <button class="acc-copy-btn" onclick="Accounts.copy('${Utils.escapeHTML(acc.username || '')}')" title="复制账号">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                            </button>
                        </div>
                    </div>

                    <div class="acc-view-field" style="margin-bottom:20px;">
                        <div style="font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">登录密码</div>
                        <div style="display:flex; align-items:center; gap:12px; background:white; padding:10px 14px; border-radius:10px; border:1px solid #edf2f7;">
                            <span id="${pwdId}" style="flex:1; font-size:15px; font-weight:700; color:#334155; font-family:'JetBrains Mono', monospace; letter-spacing:2px;">••••••••</span>
                            <button class="acc-toggle-btn" onclick="Accounts.togglePwd('${pwdId}', '${Utils.escapeHTML(acc.password || '')}')" title="显示/隐藏密码" style="margin-right: -4px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button class="acc-copy-btn" onclick="Accounts.copy('${Utils.escapeHTML(acc.password || '')}')" title="复制密码">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                            </button>
                        </div>
                    </div>

                    ${acc.notes ? `
                    <div class="acc-view-field" style="margin-top:24px; padding-top:20px; border-top:1px dashed #e2e8f0;">
                        <div style="font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:10px; text-transform:uppercase; letter-spacing:1px;">备注信息</div>
                        <div style="font-size:13px; color:#64748b; line-height:1.7; background:white; padding:14px; border-radius:12px; border:1px solid #f1f5f9; min-height:60px;">${Utils.escapeHTML(acc.notes).replace(/\n/g, '<br>')}</div>
                    </div>` : ''}
                </div>
            </div>
        `;

        Modal.open(headerHTML, bodyHtml, `
            <div style="display:flex; gap:12px; width:100%; justify-content:flex-end; padding: 0 8px;">
                <button class="btn btn-secondary" onclick="Modal.close()" style="height:40px; border-radius:10px; padding:0 24px;">关闭</button>
                <button class="btn btn-primary" onclick="Accounts.showEditModal(${id})" style="height:40px; border-radius:10px; padding:0 30px; font-weight:700;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px;"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    更新账号信息
                </button>
            </div>
        `);
    },

    togglePwd(elId, realPwd) {
        const el = document.getElementById(elId);
        if (!el) return;
        if (el.classList.contains('account-pwd-masked')) {
            el.textContent = realPwd;
            el.classList.remove('account-pwd-masked');
            el.classList.add('account-pwd-visible');
        } else {
            el.textContent = '••••••';
            el.classList.remove('account-pwd-visible');
            el.classList.add('account-pwd-masked');
        }
    },

    copy(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.show('已复制', 'success');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            Toast.show('已复制', 'success');
        });
    },

    showManageCategories() {
        const filtered = this._getFilteredCategories();
        const listHTML = filtered.map(cat => {
            const count = this.accounts.filter(a => (a.category || '未分类') === cat).length;
            return `
                <div class="category-item-edit">
                    <div class="cat-item-info">
                        <span class="cat-item-name">${Utils.escapeHTML(cat)}</span>
                        <span class="cat-item-count">${count} 个账号</span>
                    </div>
                    <button class="btn-icon" onclick="Accounts.deleteCategory('${Utils.escapeHTML(cat)}')" title="删除分类">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div>
            `;
        }).join('') || '<div class="empty-text" style="padding:40px; text-align:center; color:#94a3b8;">暂无匹配的分类</div>';

        const sortIcon = this.categorySortAsc
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5h10M11 9h7M11 13h4M3 7l3-3 3 3M6 6v14"/></svg>';

        // 使用 XHS 风格的 Header
        const headerHTML = `
            <div class="xhs-modal-header-custom">
                <div class="xhs-header-name" style="font-size:18px; margin-left:8px;">分类管理</div>
            </div>
        `;

        Modal.open(headerHTML, `
            <div class="category-manager">
                <div class="category-add-row" style="margin-top:20px;">
                    <input type="text" id="new-category-name" placeholder="输入新分类名称..." style="height:42px; border-radius:12px;">
                    <button class="btn btn-primary" onclick="Accounts.addCategory()" style="height:42px; border-radius:12px; padding: 0 20px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        添加
                    </button>
                </div>

                <div class="category-list-scroll">
                    ${listHTML}
                </div>
                <div style="padding: 0 24px 20px; font-size: 11px; color:#94a3b8; text-align:center;">
                    注：删除分类不会删除账号，账号将变为“未分类”
                </div>
            </div>
        `, '');
    },

    _getFilteredCategories() {
        let cats = [...this.categories];
        const kw = this.categorySearchKeyword.toLowerCase().trim();
        if (kw) {
            cats = cats.filter(c => c.toLowerCase().includes(kw));
        }
        cats.sort((a, b) => {
            if (this.categorySortBy === 'count') {
                const countA = this.accounts.filter(acc => (acc.category || '未分类') === a).length;
                const countB = this.accounts.filter(acc => (acc.category || '未分类') === b).length;
                return this.categorySortAsc ? countA - countB : countB - countA;
            } else {
                return this.categorySortAsc ? a.localeCompare(b) : b.localeCompare(a);
            }
        });
        return cats;
    },

    searchCategories(keyword) {
        this.categorySearchKeyword = keyword;
        this.showManageCategories();
    },

    sortCategories(sortBy) {
        if (this.categorySortBy === sortBy) {
            this.categorySortAsc = !this.categorySortAsc;
        } else {
            this.categorySortBy = sortBy;
            this.categorySortAsc = true;
        }
        this.showManageCategories();
    },

    addCategory() {
        const name = document.getElementById('new-category-name').value.trim();
        if (!name) return;
        if (this.categories.includes(name)) {
            Toast.show('分类已存在', 'warning');
            return;
        }
        this.categories.push(name);
        this.showManageCategories();
        this.render();
        Toast.show('已添加分类', 'success');
    },

    deleteCategory(name) {
        if (!confirm(`确定删除分类 "${name}"？\n删除分类不会删除其中的账号，账号将变为“未分类”。`)) return;
        this.categories = this.categories.filter(c => c !== name);
        this.showManageCategories();
        this.render();
        Toast.show('已删除分类', 'info');
    },

    showAddModal() {
        const catOptions = this.categories.map(c => `<option value="${Utils.escapeHTML(c)}">${Utils.escapeHTML(c)}</option>`).join('');

        Modal.open('添加账号', `
            <div style="padding: 8px 4px 0;">
                <div class="form-row">
                    <div class="form-group" style="flex:1">
                        <label style="font-weight:700; color:#475569;">分类 (板块)</label>
                        <select id="acc-category" style="height:44px; border-radius:10px;">
                            <option value="">— 选择分类 —</option>
                            ${catOptions}
                        </select>
                    </div>
                    <div class="form-group" style="flex:2">
                        <label style="font-weight:700; color:#475569;">名称 (账号别名) *</label>
                        <input type="text" id="acc-name" placeholder="例如：AI总平台、业务数据库" style="height:44px; border-radius:10px;">
                    </div>
                </div>
                <div class="form-group" style="margin-top:4px;">
                    <label style="font-weight:700; color:#475569;">网址</label>
                    <input type="text" id="acc-url" placeholder="例如：https://www.520ai.cc" style="height:44px; border-radius:10px;">
                </div>
                <div class="form-row" style="margin-top:4px;">
                    <div class="form-group" style="flex:1">
                        <label style="font-weight:700; color:#475569;">登录账号</label>
                        <input type="text" id="acc-username" placeholder="账号 / 邮箱" style="height:44px; border-radius:10px;">
                    </div>
                    <div class="form-group" style="flex:1">
                        <label style="font-weight:700; color:#475569;">登录密码 / API Key</label>
                        <input type="text" id="acc-password" placeholder="请输入密码" style="height:44px; border-radius:10px;">
                    </div>
                </div>
                <div class="form-group" style="margin-top:4px;">
                    <label style="font-weight:700; color:#475569;">备注信息</label>
                    <textarea id="acc-notes" placeholder="可选备注信息（支持多行）" rows="3" style="border-radius:10px; padding:12px;"></textarea>
                </div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="Modal.close()" style="height:40px; border-radius:10px; padding:0 24px;">取消</button>
            <button class="btn btn-primary" onclick="Accounts.addAccount()" style="height:40px; border-radius:10px; padding:0 30px; font-weight:700;">立即添加</button>
        `);
    },

    async addAccount() {
        const data = {
            category: document.getElementById('acc-category').value.trim(),
            name: document.getElementById('acc-name').value.trim(),
            url: document.getElementById('acc-url').value.trim(),
            username: document.getElementById('acc-username').value.trim(),
            password: document.getElementById('acc-password').value.trim(),
            notes: document.getElementById('acc-notes').value.trim()
        };

        if (!data.name) {
            Toast.show('请填写名称', 'warning');
            return;
        }

        try {
            const newAcc = await DB.create(Config.TABLES.ACCOUNTS, data);
            this.accounts.push(newAcc);

            Modal.close();
            this.filteredAccounts = [...this.accounts];
            this.render();
            Toast.show('账号添加成功', 'success');
        } catch (err) {
            Toast.show('添加失败', 'error');
        }
    },

    showEditModal(id) {
        const acc = this.accounts.find(a => a.id === id);
        if (!acc) return;

        const catOptions = this.categories.map(c => `
            <option value="${Utils.escapeHTML(c)}" ${acc.category === c ? 'selected' : ''}>${Utils.escapeHTML(c)}</option>
        `).join('');

        Modal.open('更新信息', `
            <div style="padding: 8px 4px 0;">
                <div class="form-row">
                    <div class="form-group" style="flex:1">
                        <label style="font-weight:700; color:#475569;">分类 (板块)</label>
                        <select id="edit-acc-category" style="height:44px; border-radius:10px;">
                            <option value="">— 选择分类 —</option>
                            ${catOptions}
                        </select>
                    </div>
                    <div class="form-group" style="flex:2">
                        <label style="font-weight:700; color:#475569;">名称 *</label>
                        <input type="text" id="edit-acc-name" value="${Utils.escapeHTML(acc.name || '')}" style="height:44px; border-radius:10px;">
                    </div>
                </div>
                <div class="form-group" style="margin-top:4px;">
                    <label style="font-weight:700; color:#475569;">网址</label>
                    <input type="text" id="edit-acc-url" value="${Utils.escapeHTML(acc.url || '')}" style="height:44px; border-radius:10px;">
                </div>
                <div class="form-row" style="margin-top:4px;">
                    <div class="form-group" style="flex:1">
                        <label style="font-weight:700; color:#475569;">账号</label>
                        <input type="text" id="edit-acc-username" value="${Utils.escapeHTML(acc.username || '')}" style="height:44px; border-radius:10px;">
                    </div>
                    <div class="form-group" style="flex:1">
                        <label style="font-weight:700; color:#475569;">密码</label>
                        <input type="text" id="edit-acc-password" value="${Utils.escapeHTML(acc.password || '')}" style="height:44px; border-radius:10px;">
                    </div>
                </div>
                <div class="form-group" style="margin-top:4px;">
                    <label style="font-weight:700; color:#475569;">备注</label>
                    <textarea id="edit-acc-notes" rows="3" style="border-radius:10px; padding:12px;">${Utils.escapeHTML(acc.notes || '')}</textarea>
                </div>
            </div>
        `, `
            <button class="btn btn-danger" onclick="Accounts.deleteAccount(${id})" title="删除此账号" style="height:40px; border-radius:10px; padding:0 20px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                删除
            </button>
            <div style="flex:1"></div>
            <button class="btn btn-secondary" onclick="Modal.close()" style="height:40px; border-radius:10px; padding:0 24px;">取消</button>
            <button class="btn btn-primary" onclick="Accounts.saveEdit(${id})" style="height:40px; border-radius:10px; padding:0 30px; font-weight:700;">保存修改</button>
        `);
    },

    async saveEdit(id) {
        const data = {
            category: document.getElementById('edit-acc-category').value.trim(),
            name: document.getElementById('edit-acc-name').value.trim(),
            url: document.getElementById('edit-acc-url').value.trim(),
            username: document.getElementById('edit-acc-username').value.trim(),
            password: document.getElementById('edit-acc-password').value.trim(),
            notes: document.getElementById('edit-acc-notes').value.trim()
        };

        try {
            await DB.update(Config.TABLES.ACCOUNTS, id, data);
            const idx = this.accounts.findIndex(a => a.id === id);
            if (idx !== -1) this.accounts[idx] = { ...this.accounts[idx], ...data };

            Modal.close();
            this.filteredAccounts = [...this.accounts];
            this.render();
            Toast.show('已保存', 'success');
        } catch (err) {
            Toast.show('保存失败', 'error');
        }
    },

    async deleteAccount(id) {
        if (!confirm('确定彻底删除此账号记录吗？此操作不可恢复。')) return;
        try {
            await DB.remove(Config.TABLES.ACCOUNTS, id);
            this.accounts = this.accounts.filter(a => a.id !== id);

            this.filteredAccounts = [...this.accounts];
            this.render();
            Toast.show('账号已删除', 'info');
        } catch (err) {
            Toast.show('删除失败', 'error');
        }
    }
};
