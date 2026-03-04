/**
 * Skill 商店模块
 * 处理 Skill 的加载、渲染、搜索、上传和详情展示
 */
const Skills = {
    skills: [],
    filtered: [],
    selectedTag: null,
    _pendingTags: [],

    /**
     * 加载数据
     */
    async load() {
        try {
            const data = await DB.queryAll(Config.TABLES.SKILLS);
            // 诊断日志：查看数据库返回的字段
            if (data.length > 0) {
                console.log('[Skills] 第一条记录的全部字段:', JSON.stringify(data[0], null, 2));
                console.log('[Skills] user_id 字段值:', data[0].user_id, '| 类型:', typeof data[0].user_id);
            }
            this.skills = data.map(s => {
                if (s.tags && typeof s.tags === 'string') try { s.tags = JSON.parse(s.tags); } catch (e) { s.tags = []; }
                if (!Array.isArray(s.tags)) s.tags = [];
                if (s.files && typeof s.files === 'string') try { s.files = JSON.parse(s.files); } catch (e) { s.files = []; }
                return s;
            });
            this._extractAllTags();
            this.filtered = [...this.skills];
            this.render();
            this.renderTagFilter();
        } catch (err) {
            console.error('[Skills] 加载失败:', err);
            Toast.show('加载 Skill 列表失败', 'error');
        }
    },

    /**
     * 渲染列表
     */
    render() {
        const container = document.getElementById('skill-list');
        if (!container) return;

        if (this.filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3; margin-bottom:16px;">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                    <p>暂无符合条件的 Skill</p>
                    <span>点击「上传 Skill」分享你的第一个 Skill</span>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filtered.map(skill => `
            <div class="skill-card" onclick="Skills.showDetail(${skill.id})">
                <h3 class="skill-card-name">${Utils.escapeHTML(skill.name)}</h3>
                <p class="skill-card-desc">${Utils.escapeHTML(skill.summary)}</p>
                <div class="skill-tags">
                    ${(skill.tags || []).map(tag => `<span class="tag tag-blue" style="font-size:10px; padding:1px 8px; height:20px;">${Utils.escapeHTML(tag)}</span>`).join('')}
                </div>
                <div class="skill-card-footer">
                    <div class="skill-card-uploader">
                        ${(() => {
                const user = Auth.getUser(skill.user_id);
                const color = user.avatar_color;
                const initial = user.avatar_initial;
                const displayName = user.display_name;
                return `
                                <div class="user-avatar" style="background: ${color}; width:24px; height:24px; font-size:11px;">
                                    ${initial}
                                </div>
                                <span class="uploader-name" style="font-size:13px; font-weight:600;">${Utils.escapeHTML(displayName)}</span>
                            `;
            })()}
                    </div>
                    <span class="skill-card-date" style="font-size:12px; color:var(--text-4);">${Utils.formatDate(skill.created_at)}</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * 搜索
     */
    search(query) {
        query = query.toLowerCase().trim();
        this._applyFilters(query, this.selectedTag);
    },

    /**
     * 标签过滤
     */
    filterByTag(tag) {
        this.selectedTag = (this.selectedTag === tag) ? null : tag;
        const query = document.getElementById('skill-search-input').value.toLowerCase().trim();
        this._applyFilters(query, this.selectedTag);
        this.renderTagFilter();
    },

    _applyFilters(query, tag) {
        this.filtered = this.skills.filter(s => {
            const matchesQuery = !query ||
                s.name.toLowerCase().includes(query) ||
                s.summary.toLowerCase().includes(query);
            const matchesTag = !tag || (s.tags && s.tags.includes(tag));
            return matchesQuery && matchesTag;
        });
        this.render();
    },

    /**
     * 渲染标签过滤栏
     */
    renderTagFilter() {
        const container = document.getElementById('skill-tag-filter');
        if (!container) return;

        const allTags = this._extractAllTags();
        if (allTags.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = allTags.map(tag => `
            <button class="filter-tab ${this.selectedTag === tag ? 'active' : ''}" 
                    onclick="Skills.filterByTag('${Utils.escapeHTML(tag)}')">
                ${Utils.escapeHTML(tag)}
            </button>
        `).join('');
    },

    _extractAllTags() {
        const tags = new Set();
        this.skills.forEach(s => {
            if (s.tags && Array.isArray(s.tags)) {
                s.tags.forEach(t => tags.add(t));
            }
        });
        return Array.from(tags).sort();
    },

    /**
     * 显示详情
     */
    async showDetail(id) {
        const skill = this.skills.find(s => s.id === id);
        if (!skill) return;

        const user = Auth.getUser(skill.user_id);
        const name = user.display_name;
        const color = user.avatar_color;
        const initial = user.avatar_initial;

        const bodyHTML = `
            <div class="skill-detail">
                <div class="skill-detail-header" style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="user-avatar" style="background:${color}; width:32px; height:32px; font-size: 14px;">${initial}</div>
                            <div>
                                <div style="font-size:15px; font-weight:700; color:#1e293b;">${Utils.escapeHTML(name)}</div>
                                <div style="font-size:12px; color:#94a3b8; font-weight:400; margin-top:2px;">分享于 ${Utils.formatDate(skill.created_at)}</div>
                            </div>
                        </div>
                        <div style="position:relative;">
                            <button onclick="this.nextElementSibling.classList.toggle('active')" style="background:none; border:none; color:#64748b; cursor:pointer; padding:8px; display:flex;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                            </button>
                            <div id="xhs-more-menu" class="xhs-more-menu" style="right:0; top:40px;">
                                ${isAuthor ? `
                                    <div class="xhs-menu-item" onclick="Skills.showEditModal(${id})">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        <span>更新信息</span>
                                    </div>
                                    <div class="xhs-menu-item danger" onclick="Skills.deleteSkill(${id})">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                                        <span>删除 Skill</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <h2 style="font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">${Utils.escapeHTML(skill.name)}</h2>
                    <div style="display: flex; gap: 8px;">
                        ${(skill.tags || []).map(tag => `<span class="skill-tag">${Utils.escapeHTML(tag)}</span>`).join('')}
                    </div>
                </div>
                <div class="skill-detail-section">
                    <h4 style="font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 8px;">简介</h4>
                    <p style="color: #334155; line-height: 1.6; font-size: 14px;">${Utils.escapeHTML(skill.summary)}</p>
                </div>
                ${skill.detail ? `
                <div class="skill-detail-section" style="margin-top: 24px;">
                    <h4 style="font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 8px;">详细说明</h4>
                    <div class="markdown-body" style="font-size: 14px; color: #334155; line-height: 1.7;">
                        ${Utils.escapeHTML(skill.detail).replace(/\n/g, '<br>')}
                    </div>
                </div>
                ` : ''}
                <div id="skill-attachments" style="margin-top: 24px;">
                    ${FileUploadHelper.renderAttachments(skill.files)}
                </div>
            </div>
        `;

        Modal.open('Skill 详情', bodyHTML, '');
    },

    /**
     * 显示上传模态框
     */
    showUploadModal() {
        this._pendingTags = [];
        const bodyHTML = `
            <div class="skill-upload-form">
                <div class="form-group">
                    <label>Skill 名称 <span style="color:red">*</span></label>
                    <input type="text" id="skill-name" placeholder="简短清晰的名称" class="form-control">
                </div>
                <div class="form-group">
                    <label>简要描述 <span style="color:red">*</span></label>
                    <textarea id="skill-summary" placeholder="一句话说明这个 Skill 的核心用途" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label>标签</label>
                    <div class="tag-input-wrapper">
                        <div id="skill-pending-tags" class="tag-container"></div>
                        <input type="text" id="skill-tag-input" placeholder="输入标签按回车">
                    </div>
                </div>
                <div class="form-group">
                    <label>详细说明</label>
                    <textarea id="skill-detail" placeholder="支持 Markdown 格式，详细描述使用方法..." class="form-control" rows="6"></textarea>
                </div>
                
                <div class="form-group" style="margin-top:20px;">
                    <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">附件上传</label>
                    <div id="skill-drop-zone" class="file-upload-zone" onclick="document.getElementById('file-input').click()" style="border:2px dashed #e2e8f0; border-radius:12px; padding:24px; text-align:center; cursor:pointer; transition:all 0.2s;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <p style="margin-top:12px; font-size:14px; font-weight:600; color:#64748b;">点击或拖拽文件到此处上传</p>
                        <span style="font-size:12px; color:#94a3b8; margin-top:4px; display:block;">支持图片、文档等文件格式，单个文件不超过20MB</span>
                        <input type="file" id="file-input" multiple style="display:none" onchange="FileUploadHelper.handleFileUpload(event, 'skill-file-list')">
                    </div>
                    <div id="skill-file-list" class="file-list" style="margin-top:12px;"></div>
                </div>
            </div>
        `;

        const footerHTML = [
            { text: '发布 Skill', class: 'btn btn-primary', style: 'height:40px; border-radius:10px; padding:0 25px; font-weight:700;', onclick: 'Skills.upload()' }
        ];

        Modal.open('分享新 Skill', bodyHTML, footerHTML);

        // 初始化标签输入
        const tagInput = document.getElementById('skill-tag-input');
        if (tagInput) {
            tagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this._addPendingTag(tagInput.value);
                    tagInput.value = '';
                }
            });
        }

        // 初始化拖拽上传
        FileUploadHelper.initDropZone('skill-drop-zone', 'skill-file-list');
    },

    _addPendingTag(tag) {
        const trimmedTag = tag.trim();
        if (trimmedTag && !this._pendingTags.includes(trimmedTag)) {
            this._pendingTags.push(trimmedTag);
            this._renderPendingTags();
        }
    },

    _renderPendingTags() {
        const container = document.getElementById('skill-pending-tags');
        if (!container) return;
        container.innerHTML = this._pendingTags.map((tag, index) => `
            <span class="skill-tag" style="padding-right: 24px; position: relative;">
                ${Utils.escapeHTML(tag)}
                <span onclick="Skills._removePendingTag(${index})" style="position: absolute; right: 4px; cursor: pointer;">&times;</span>
            </span>
        `).join('');
    },

    _removePendingTag(index) {
        this._pendingTags.splice(index, 1);
        this._renderPendingTags();
    },

    handleFileDrop(event) {
        event.preventDefault();
        const zone = document.getElementById('skill-drop-zone');
        if (zone) zone.classList.remove('dragover');
        FileUploadHelper.handleFileUpload(event, 'skill-file-list');
    },

    /**
     * 执行上传
     */
    async upload() {
        const name = document.getElementById('skill-name').value.trim();
        const summary = document.getElementById('skill-summary').value.trim();
        const detail = document.getElementById('skill-detail').value.trim();
        const tags = this._pendingTags;

        if (!name || !summary) {
            Toast.show('请填写名称和简要描述', 'warning');
            return;
        }

        let files = [];
        try {
            files = await FileUploadHelper.processFilesBeforeStorage('skill-file-list');
        } catch (err) {
            Toast.show(err.message, 'error');
            return;
        }

        const d = {
            name,
            summary,
            user_id: Auth.currentUser ? Auth.currentUser.name : ''
        };

        if (tags && tags.length > 0) d.tags = JSON.stringify(tags);
        if (files && files.length > 0) d.files = JSON.stringify(files);
        if (detail) d.detail = detail;

        try {
            const n = await DB.create(Config.TABLES.SKILLS, d);
            // 处理后端返回的 JSON 字符串
            if (n.tags && typeof n.tags === 'string') n.tags = JSON.parse(n.tags);

            this.skills.unshift(n);
            this.filtered = [...this.skills];
            this.render();
            this.renderTagFilter();
            Modal.close();
            Toast.show('Skill 分享成功', 'success');

            // 发送消息通知给所有人（排除自己）
            if (typeof Messages !== 'undefined') {
                const sender = Auth.currentUser;
                Messages.sendToAll({
                    type: 'skill_shared',
                    content: `新 Skill 分享: ${name}`,
                    recipientId: null, // sendToAll 会处理
                    senderId: sender?.id,
                    refType: 'skill',
                    refId: n.id
                });
            }
        } catch (e) {
            console.error('[Skills] 上传失败:', e);
            Toast.show('上传失败: ' + (e.message || '未知错误'), 'error');
        }
    },

    /**
     * 显示编辑模态框
     */
    showEditModal(id) {
        const skill = this.skills.find(s => s.id === id);
        if (!skill) return;

        this._pendingTags = Array.isArray(skill.tags) ? [...skill.tags] : [];
        this._editingId = id;
        this._removedFiles = [];

        const bodyHTML = `
            <div class="skill-upload-form">
                <div class="form-group">
                    <label>Skill 名称 <span style="color:red">*</span></label>
                    <input type="text" id="skill-edit-name" value="${Utils.escapeHTML(skill.name || '')}" placeholder="简短清晰的名称" class="form-control">
                </div>
                <div class="form-group">
                    <label>简要描述 <span style="color:red">*</span></label>
                    <textarea id="skill-edit-summary" placeholder="一句话说明这个 Skill 的核心用途" class="form-control" rows="2">${Utils.escapeHTML(skill.summary || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>标签</label>
                    <div class="tag-input-wrapper">
                        <div id="skill-pending-tags" class="tag-container"></div>
                        <input type="text" id="skill-tag-input" placeholder="输入标签按回车">
                    </div>
                </div>
                <div class="form-group">
                    <label>详细说明</label>
                    <textarea id="skill-edit-detail" placeholder="支持 Markdown 格式，详细描述使用方法..." class="form-control" rows="6">${Utils.escapeHTML(skill.detail || '')}</textarea>
                </div>
                <div class="form-group" style="margin-top:20px;">
                    <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">添加新附件</label>
                    <div id="skill-drop-zone" class="file-upload-zone" onclick="document.getElementById('edit-file-input').click()" style="border:2px dashed #e2e8f0; border-radius:12px; padding:24px; text-align:center; cursor:pointer;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p style="margin-top:8px; font-size:13px; color:#64748b; font-weight:600;">点击上传新文件</p>
                        <input type="file" id="edit-file-input" multiple style="display:none" onchange="FileUploadHelper.handleFileUpload(event, 'skill-edit-file-list')">
                    </div>
                    <div id="skill-edit-file-list" class="file-list" style="margin-top:12px;"></div>
                </div>
                <div id="skill-existing-files" style="margin-top: 16px;">
                    <label style="font-size:13px; font-weight:600; color:#64748b; margin-bottom:8px; display:block;">当前附件</label>
                    ${FileUploadHelper.renderEditableAttachments(skill.files, 'Skills')}
                </div>
            </div>
        `;

        const footerHTML = [
            { text: '保存更新', class: 'btn btn-primary', style: 'height:40px; border-radius:10px; padding:0 25px; font-weight:700;', onclick: 'Skills.updateSkill()' }
        ];

        Modal.open('更新 Skill 信息', bodyHTML, footerHTML);

        // 渲染已有标签
        this._renderPendingTags();


        // 初始化标签输入
        const tagInput = document.getElementById('skill-tag-input');
        if (tagInput) {
            tagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this._addPendingTag(tagInput.value);
                    tagInput.value = '';
                }
            });
        }

        // 初始化拖拽上传 (关键修复：编辑模式也要初始化)
        FileUploadHelper.initDropZone('skill-drop-zone', 'skill-edit-file-list');
    },

    /**
     * 删除已有的附件（标记为删除）
     */
    removeExistingFile(index, elementId) {
        FileUploadHelper.handleExistingFileRemoval(index, elementId, this._removedFiles);
    },

    /**
     * 保存编辑
     */
    async updateSkill() {
        const id = this._editingId;
        if (!id) return;

        const name = document.getElementById('skill-edit-name').value.trim();
        const summary = document.getElementById('skill-edit-summary').value.trim();
        const detail = document.getElementById('skill-edit-detail').value.trim();
        const tags = this._pendingTags;

        if (!name || !summary) {
            Toast.show('请填写名称和简要描述', 'warning');
            return;
        }

        // 处理新上传的附件
        let newFiles = [];
        try {
            newFiles = await FileUploadHelper.processFilesBeforeStorage('skill-edit-file-list');
        } catch (err) {
            Toast.show(err.message, 'error');
            return;
        }

        const skill = this.skills.find(s => s.id === id);
        let existingFiles = skill ? (typeof skill.files === 'string' ? JSON.parse(skill.files || '[]') : (skill.files || [])) : [];

        // 过滤掉被标记删除的文件
        if (this._removedFiles && this._removedFiles.length > 0) {
            existingFiles = existingFiles.filter((_, idx) => !this._removedFiles.includes(idx));
        }

        const allFiles = [...existingFiles, ...newFiles];

        const d = { name, summary };
        d.tags = tags.length > 0 ? JSON.stringify(tags) : '[]';
        d.detail = detail || '';
        if (allFiles.length > 0) d.files = JSON.stringify(allFiles);

        try {
            await DB.update(Config.TABLES.SKILLS, id, d);

            // 更新本地数据
            if (skill) {
                skill.name = name;
                skill.summary = summary;
                skill.detail = detail;
                skill.tags = tags;
                if (allFiles.length > 0) skill.files = allFiles;
            }

            this.filtered = [...this.skills];
            this.render();
            this.renderTagFilter();
            Modal.close();
            Toast.show('Skill 更新成功', 'success');
        } catch (e) {
            console.error('[Skills] 更新失败:', e);
            Toast.show('更新失败: ' + (e.message || '未知错误'), 'error');
        }
    },

    /**
     * 删除 Skill
     */
    async deleteSkill(id) {
        if (!confirm('确定删除此 Skill？')) return;
        try {
            await DB.remove(Config.TABLES.SKILLS, id);
            this.skills = this.skills.filter(s => s.id !== id);
            this.filtered = this.filtered.filter(s => s.id !== id);
            this.render();
            this.renderTagFilter();
            Modal.close();
            Toast.show('Skill 已删除', 'info');
        } catch (e) {
            console.error('[Skills] 删除失败:', e);
            Toast.show('删除失败', 'error');
        }
    },

    /**
     * 使用指南
     */
    showGuide() {
        if (typeof SkillGuide !== 'undefined' && SkillGuide.show) {
            SkillGuide.show();
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'skill-guide-overlay';
        overlay.onclick = () => overlay.remove();
        overlay.innerHTML = `
            <div class="skill-guide-panel" onclick="event.stopPropagation()">
                <h2><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-4px;margin-right:8px;"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>Skill 使用指南</h2>
                <div class="skill-guide-step">
                    <div class="skill-guide-num">1</div>
                    <div class="skill-guide-content">
                        <h3>搜索与筛选</h3>
                        <p>通过搜索框或顶部标签快速发现有用的提示词和开发经验。</p>
                    </div>
                </div>
                <div class="skill-guide-step">
                    <div class="skill-guide-num">2</div>
                    <div class="skill-guide-content">
                        <h3>查看详情</h3>
                        <p>点击卡片查看详细的 Markdown 说明和附件文件。</p>
                    </div>
                </div>
                <div class="skill-guide-step">
                    <div class="skill-guide-num">3</div>
                    <div class="skill-guide-content">
                        <h3>上传分享</h3>
                        <p>点击「上传 Skill」贡献你的知识，支持多标签和附件附件。</p>
                    </div>
                </div>
                <div style="text-align:right;margin-top:16px;">
                    <button class="btn btn-primary" onclick="this.closest('.skill-guide-overlay').remove()">我知道了</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
};
