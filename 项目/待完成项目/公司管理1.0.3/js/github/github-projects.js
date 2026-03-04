/**
 * GitHub项目分享模块
 * 浏览、分享、查看 GitHub 项目
 */
const GitHubProjects = {
    projects: [],
    filtered: [],

    async load() {
        try {
            // 使用统一的查询格式
            const result = await DB.query(Config.TABLES.GITHUB_PROJECTS, {
                pageLimit: 1000
            });
            this.projects = (result.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            this.filtered = [...this.projects];
            console.log('[GitHub] 加载完成，项目数量:', this.projects.length);
            this.render();
        } catch (err) {
            console.error('[GitHub] 加载失败:', err);
            Toast.show('加载 GitHub 项目失败', 'error');
        }
    },

    search(query) {
        query = query.toLowerCase().trim();
        this._applyFilters(query);
    },

    _applyFilters(query) {
        this.filtered = this.projects.filter(p => {
            const matchesQuery = !query ||
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.share_reason && p.share_reason.toLowerCase().includes(query)) ||
                (p.repo_url && p.repo_url.toLowerCase().includes(query));
            return matchesQuery;
        });
        this.render();
    },

    render() {
        const container = document.getElementById('github-projects-list');
        if (!container) return;

        if (this.filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:400px; width:100%; grid-column: 1 / -1;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="1.5">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                    <p style="margin-top:16px; font-size:16px; font-weight:600; color:#94a3b8;">暂无符合条件的项目</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filtered.map(project => {
            const repoName = project.repo_url ? project.repo_url.split('/').pop() : '未知项目';
            const reasonPreview = project.share_reason ?
                (project.share_reason.length > 100 ? project.share_reason.substring(0, 100) + '...' : project.share_reason)
                : '暂无分享理由';

            const user = Auth.getUser(project.user_id);
            const displayName = user.display_name;
            const avatarColor = user.avatar_color;
            const initial = user.avatar_initial;

            return `
                <div class="skill-card" onclick="GitHubProjects.showDetail(${project.id})">
                    <h3 class="skill-card-name">${Utils.escapeHTML(repoName)}</h3>
                    <p class="skill-card-desc">${Utils.escapeHTML(reasonPreview)}</p>
                    <div class="skill-card-footer">
                        <div class="skill-card-uploader">
                            <div class="user-avatar" style="background: ${avatarColor}; width:24px; height:24px; font-size:11px;">
                                ${initial}
                            </div>
                            <span class="uploader-name" style="font-size:13px; font-weight:600;">${Utils.escapeHTML(displayName)}</span>
                        </div>
                        <span class="skill-card-date" style="font-size:12px; color:var(--text-4);">${Utils.formatDate(project.created_at)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    showDetail(id) {
        const project = this.projects.find(p => p.id === id);
        if (!project) return;

        let files = [];
        try {
            files = typeof project.files === 'string' ? JSON.parse(project.files || '[]') : (project.files || []);
        } catch (e) {
            files = [];
        }

        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name));
        const otherFiles = files.filter(f => !/\.(jpg|jpeg|png|gif|webp)$/i.test(f.name));

        const bodyHtml = `
            <div class="xhs-detail-container">
                <!-- 顶部大图展示区 -->
                ${imageFiles.length > 0 ? `
                    <div class="xhs-media-grid">
                        ${imageFiles.map(img => `
                            <div class="xhs-media-item" onclick="ImageLightbox.open('${img.url}', '${Utils.escapeHTML(img.name)}')">
                                <img src="${img.url}" alt="${img.name}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- 内容区 -->
                <div class="xhs-content-section">
                    <div style="background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius:12px; padding:20px; border:1px solid #e2e8f0; margin-bottom: 24px;">
                        <div style="font-size:13px; color:#64748b; margin-bottom: 8px;">GitHub 仓库</div>
                        <a href="javascript:void(0)" onclick="window.electron.openExternal('${project.repo_url}')" style="font-size:16px; font-weight:700; color:#3b82f6; text-decoration:none; word-break:break-all;">
                            ${Utils.escapeHTML(project.repo_url || '')}
                        </a>
                    </div>
                    
                    <h2 class="xhs-title" style="font-size:18px;">分享理由</h2>
                    <div class="xhs-body-text" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:24px;">
                        ${Utils.escapeHTML(project.share_reason || '').replace(/\n/g, '<br>')}
                    </div>
                    
                    ${project.usage_guide ? `
                    <h2 class="xhs-title" style="font-size:18px;">推荐使用说明</h2>
                    <div class="xhs-body-text" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:24px;">
                        ${Utils.escapeHTML(project.usage_guide).replace(/\n/g, '<br>')}
                    </div>
                    ` : ''}

                    ${otherFiles.length > 0 ? `
                    <div style="margin-top:24px;">
                        <div style="font-weight:700; color:#475569; font-size:14px; margin-bottom:12px;">相关附件</div>
                        ${FileUploadHelper.renderAttachments(otherFiles)}
                    </div>
                    ` : ''}

                    <div class="xhs-divider" style="margin: 32px 0 16px 0;"></div>
                    <div class="xhs-post-time-aligned">${Utils.formatDate(project.created_at)}</div>
                </div>
            </div>
        `;

        const user = Auth.getUser(project.user_id);
        const displayName = user.display_name;
        const avatarColor = user.avatar_color;
        const initial = user.avatar_initial;

        const isAuthor = Auth.currentUser && (
            String(Auth.currentUser.name) === String(project.user_id) ||
            Auth.currentUser.role === 'admin'
        );

        // 使用 XHS 风格的自定义 Header，包含“更多”操作
        const headerHTML = `
            <div class="xhs-modal-header-custom">
                <div class="user-avatar xhs-header-avatar" style="background:${avatarColor}">
                    ${initial}
                </div>
                <span class="xhs-header-name">${Utils.escapeHTML(displayName)}</span>
                <div class="xhs-header-more">
                    ${isAuthor || (Auth.currentUser && Auth.currentUser.role === 'admin') ? `
                        <button class="xhs-more-btn" onclick="GitHubProjects.toggleMoreActions(event)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        </button>
                    ` : ''}
                    <div id="github-more-menu" class="xhs-more-menu">
                        <div class="xhs-menu-item" onclick="GitHubProjects.showEditModal(${project.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            <span>更新信息</span>
                        </div>
                        <div class="xhs-menu-item danger" onclick="GitHubProjects.deleteProject(${project.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            <span>删除项目</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        Modal.open(headerHTML, bodyHtml, '');

        // 点击外部关闭菜单
        const closeMenu = (e) => {
            const menu = document.getElementById('github-more-menu');
            if (menu && menu.classList.contains('active') && !e.target.closest('.xhs-header-more')) {
                menu.classList.remove('active');
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    },

    /**
     * 切换更多操作菜单
     */
    toggleMoreActions(event) {
        event.stopPropagation();
        const menu = document.getElementById('github-more-menu');
        if (menu) {
            menu.classList.toggle('active');
        }
    },

    showUploadModal() {
        Modal.open('分享GitHub项目', `
            <div class="form-group">
                <label>GitHub仓库地址 *</label>
                <input type="text" id="github-repo-url" placeholder="例如：https://github.com/username/repository">
            </div>
            <div class="form-group">
                <label>分享理由 *</label>
                <textarea id="github-share-reason" placeholder="请说明你为什么要分享这个项目..." style="min-height:100px;"></textarea>
            </div>
            <div class="form-group">
                <label>推荐使用说明（选填）</label>
                <textarea id="github-usage-guide" placeholder="请说明如何使用这个项目，或推荐的使用场景..." style="min-height:80px;"></textarea>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">附件上传 (选填，如截图等)</label>
                <div class="file-upload-zone" id="github-file-zone" onclick="document.getElementById('github-file-input').click()" style="border:2px dashed #e2e8f0; border-radius:12px; padding:24px; text-align:center; cursor:pointer; transition:all 0.2s;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <p style="margin-top:12px; font-size:14px; font-weight:600; color:#64748b;">点击或拖拽上传文件</p>
                    <input type="file" id="github-file-input" style="display:none" multiple onchange="FileUploadHelper.handleFileUpload(event, 'github-file-list')">
                </div>
                <div id="github-file-list" class="file-list" style="margin-top:12px;"></div>
            </div>
        `, `
            <button class="btn btn-primary" style="height:42px; border-radius:12px; padding:0 30px; font-weight:700;" onclick="GitHubProjects.upload()">分享项目</button>
        `);
        FileUploadHelper.initDropZone('github-file-zone', 'github-file-list');
    },

    /**
     * 显示编辑模态框
     */
    showEditModal(id) {
        const project = this.projects.find(p => p.id === id);
        if (!project) return;

        this._editingId = id;
        this._removedFiles = [];

        let existingFiles = [];
        try {
            existingFiles = typeof project.files === 'string' ? JSON.parse(project.files || '[]') : (project.files || []);
        } catch (e) {
            existingFiles = [];
        }

        Modal.open('更新 GitHub 项目信息', `
            <div class="form-group">
                <label>GitHub仓库地址 *</label>
                <input type="text" id="github-edit-repo-url" value="${Utils.escapeHTML(project.repo_url || '')}" placeholder="例如：https://github.com/username/repository">
            </div>
            <div class="form-group">
                <label>分享理由 *</label>
                <textarea id="github-edit-share-reason" placeholder="请说明你为什么要分享这个项目..." style="min-height:100px;">${Utils.escapeHTML(project.share_reason || '')}</textarea>
            </div>
            <div class="form-group">
                <label>推荐使用说明（选填）</label>
                <textarea id="github-edit-usage-guide" placeholder="请说明如何使用这个项目..." style="min-height:80px;">${Utils.escapeHTML(project.usage_guide || '')}</textarea>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">当前附件</label>
                <div id="github-edit-existing-files" class="xhs-other-files" style="margin-bottom:12px;">
                    ${FileUploadHelper.renderEditableAttachments(project.files, 'GitHubProjects')}
                </div>
                <div class="form-group" style="margin-top:20px;">
                    <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">添加新附件</label>
                    <div id="github-edit-file-zone" class="file-upload-zone" onclick="document.getElementById('github-edit-file-input').click()" style="border:2px dashed #e2e8f0; border-radius:12px; padding:24px; text-align:center; cursor:pointer;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p style="margin-top:8px; font-size:13px; color:#64748b; font-weight:600;">点击上传新文件</p>
                        <input type="file" id="github-edit-file-input" style="display:none" multiple onchange="FileUploadHelper.handleFileUpload(event, 'github-edit-file-list')">
                    </div>
                    <div id="github-edit-file-list" class="file-list" style="margin-top:12px;"></div>
                </div>
            </div>
        `, `
            <button class="btn btn-primary" style="height:42px; border-radius:12px; padding:0 30px; font-weight:700;" onclick="GitHubProjects.update()">保存更新</button>
        `);

        FileUploadHelper.initDropZone('github-edit-file-zone', 'github-edit-file-list');
    },

    /**
     * 删除已有的附件（标记为删除）
     */
    removeExistingFile(index, elementId) {
        FileUploadHelper.handleExistingFileRemoval(index, elementId, this._removedFiles);
    },

    async upload() {
        const repoUrl = document.getElementById('github-repo-url').value.trim();
        const shareReason = document.getElementById('github-share-reason').value.trim();
        const usageGuide = document.getElementById('github-usage-guide').value.trim();

        if (!repoUrl || !shareReason) {
            Toast.show('请填写 GitHub 仓库地址和分享理由', 'warning');
            return;
        }

        let files = [];
        try {
            files = await FileUploadHelper.processFilesBeforeStorage('github-file-list');
        } catch (err) {
            Toast.show(err.message, 'error');
            return;
        }

        const repoName = repoUrl.split('/').pop() || 'GitHub 项目';

        const data = {
            name: repoName,
            repo_url: repoUrl,
            share_reason: shareReason,
            usage_guide: usageGuide || '',
            user_id: Auth.currentUser ? Auth.currentUser.name : ''
        };

        if (files && files.length > 0) {
            data.files = JSON.stringify(files);
        }

        try {
            const newProject = await DB.create(Config.TABLES.GITHUB_PROJECTS, data);
            Modal.close();
            Toast.show('项目分享成功', 'success');
            await this.load();

            if (typeof Messages !== 'undefined') {
                const sender = Auth.currentUser;
                Messages.sendToAll({
                    type: 'github_shared',
                    content: `新 GitHub 项目分享: ${repoName}`,
                    senderId: sender?.id,
                    refType: 'github',
                    refId: newProject.id
                });
            }
        } catch (err) {
            console.error('[GitHub] 分享失败:', err);
            Toast.show('分享失败: ' + err.message, 'error');
        }
    },

    async update() {
        const id = this._editingId;
        if (!id) return;

        const repoUrl = document.getElementById('github-edit-repo-url').value.trim();
        const shareReason = document.getElementById('github-edit-share-reason').value.trim();
        const usageGuide = document.getElementById('github-edit-usage-guide').value.trim();

        if (!repoUrl || !shareReason) {
            Toast.show('请填写仓库地址和分享理由', 'warning');
            return;
        }

        let newFiles = [];
        try {
            newFiles = await FileUploadHelper.processFilesBeforeStorage('github-edit-file-list');
        } catch (err) {
            Toast.show(err.message, 'error');
            return;
        }

        const project = this.projects.find(p => p.id === id);
        let existingFiles = project ? (typeof project.files === 'string' ? JSON.parse(project.files || '[]') : (project.files || [])) : [];

        // 过滤掉被标记删除的文件
        if (this._removedFiles && this._removedFiles.length > 0) {
            existingFiles = existingFiles.filter((_, idx) => !this._removedFiles.includes(idx));
        }

        const allFiles = [...existingFiles, ...newFiles];

        const repoName = repoUrl.split('/').pop() || 'GitHub 项目';
        const data = {
            name: repoName,
            repo_url: repoUrl,
            share_reason: shareReason,
            usage_guide: usageGuide || '',
            files: JSON.stringify(allFiles)
        };

        try {
            await DB.update(Config.TABLES.GITHUB_PROJECTS, id, data);
            Modal.close();
            Toast.show('项目修改成功', 'success');
            await this.load();
            this.showDetail(id); // 刷新详情页
        } catch (err) {
            console.error('[GitHub] 修改失败:', err);
            Toast.show('修改失败: ' + err.message, 'error');
        }
    },

    async deleteProject(id) {
        if (!confirm('确定删除此项目？')) return;
        try {
            await DB.remove(Config.TABLES.GITHUB_PROJECTS, id);
            this.projects = this.projects.filter(p => p.id !== id);
            Modal.close();
            this.render();
            Toast.show('项目已删除', 'info');
        } catch (err) {
            Toast.show('删除失败', 'error');
        }
    },

    showGuide() {
        const overlay = document.createElement('div');
        overlay.className = 'skill-guide-overlay';
        overlay.onclick = () => overlay.remove();
        overlay.innerHTML = `
            <div class="skill-guide-panel" onclick="event.stopPropagation()">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-4px;margin-right:8px;">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                    GitHub项目使用指南
                </h2>
                <div class="skill-guide-step">
                    <div class="skill-guide-num">1</div>
                    <div class="skill-guide-content">
                        <h3>浏览项目</h3>
                        <p>在GitHub项目列表中浏览所有已分享的项目，了解团队推荐的优质资源。</p>
                    </div>
                </div>
                <div class="skill-guide-step">
                    <div class="skill-guide-num">2</div>
                    <div class="skill-guide-content">
                        <h3>查看详情</h3>
                        <p>点击任意项目卡片查看详细信息，包括GitHub仓库地址、分享理由和使用说明。</p>
                    </div>
                </div>
                <div class="skill-guide-step">
                    <div class="skill-guide-num">3</div>
                    <div class="skill-guide-content">
                        <h3>分享项目</h3>
                        <p>点击「分享项目」按钮，填写GitHub仓库地址、分享理由和使用说明，分享优质项目给团队。</p>
                    </div>
                </div>
                <div style="text-align:right;margin-top:16px;">
                    <button class="btn-primary" onclick="this.closest('.skill-guide-overlay').remove()">我知道了</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },
};
