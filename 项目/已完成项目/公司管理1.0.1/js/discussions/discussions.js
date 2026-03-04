/**
 * 项目讨论模块
 * 功能：讨论列表、创建、回复、删除
 * 使用 announcements 表存储
 */
const Discussions = {
    discussions: [],
    usersCache: {},

    /**
     * 加载讨论列表
     */
    async load() {
        try {
            // 使用数据库模式
            const allRecords = await DB.queryAll(Config.TABLES.DISCUSSIONS);

            this.discussions = allRecords || [];

            await this._loadUsersInfo();
            this._sort();
            this.render();
        } catch (err) {
            console.error('加载讨论失败:', err);
            Toast.show('加载讨论失败', 'error');
        }
    },

    /**
     * 加载用户信息缓存
     */
    async _loadUsersInfo() {
        // 不再需要私有缓存，直接使用 Auth.allUsers
        if (!Auth.allUsers || Auth.allUsers.length === 0) {
            await Auth.loadAllUsers();
        }
    },

    /**
     * 获取用户信息
     */
    _getUserInfo(authorId) {
        return Auth.getUser(authorId);
    },

    /**
     * 排序讨论（按最新回复时间或创建时间）
     */
    _sort() {
        this.discussions.sort((a, b) => {
            const aPinned = a.is_pinned === true || a.is_pinned === 1 || String(a.is_pinned) === '1';
            const bPinned = b.is_pinned === true || b.is_pinned === 1 || String(b.is_pinned) === '1';

            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;

            const aTime = a.last_reply_at || a.created_at;
            const bTime = b.last_reply_at || b.created_at;
            return new Date(bTime) - new Date(aTime);
        });
    },

    /**
     * 渲染讨论列表
     */
    render() {
        const container = document.getElementById('discussion-list');
        if (!container) return;

        if (this.discussions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 60px 0; text-align: center; color: #94a3b8; grid-column: 1 / -1;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="1.2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <p style="font-size: 16px; font-weight: 600; color: #64748b; margin-bottom: 4px;">暂无讨论</p>
                    <span style="font-size: 13px; opacity: 0.8;">点击「发起讨论」发布第一个话题</span>
                </div>
            `;
            return;
        }

        container.innerHTML = this.discussions.map(d => this._renderDiscussion(d)).join('');
    },

    /**
     * 渲染单张卡片（统一使用 skill-card 样式）
     */
    _renderDiscussion(d) {
        let replies = [];
        try {
            replies = typeof d.replies === 'string' ? JSON.parse(d.replies || '[]') : (d.replies || []);
        } catch (e) {
            replies = [];
        }

        const replyCount = replies.length;
        const isPinned = d.is_pinned === true || d.is_pinned === 1 || String(d.is_pinned) === '1';
        const userInfo = this._getUserInfo(d.user_id);
        const title = d.name || d.title || '';
        const contentPreview = d.content ? (d.content.length > 80 ? d.content.substring(0, 80) + '...' : d.content) : '暂无内容详情';

        return `
            <div class="skill-card ${isPinned ? 'pinned' : ''}" onclick="Discussions.showDetail(${d.id})">
                <h3 class="skill-card-name">
                    ${isPinned ? '<span style="color:#ff2442; margin-right:4px;">[置顶]</span>' : ''}
                    ${Utils.escapeHTML(title)}
                </h3>
                <p class="skill-card-desc">${Utils.escapeHTML(contentPreview)}</p>
                <div class="skill-tags">
                   <span class="tag tag-blue" style="font-size:10px; padding:1px 8px; height:20px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px; vertical-align:middle;">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        ${replyCount} 评论
                   </span>
                </div>
                <div class="skill-card-footer">
                    <div class="skill-card-uploader">
                        <div class="user-avatar" style="background:${userInfo.avatar_color}; width:24px; height:24px; font-size:11px;">
                            ${userInfo.avatar_initial}
                        </div>
                        <span class="uploader-name" style="font-size:13px; font-weight:600;">${Utils.escapeHTML(userInfo.display_name)}</span>
                    </div>
                    <span class="skill-card-date" style="font-size:12px; color:var(--text-4);">${Utils.formatDate(d.created_at)}</span>
                </div>
            </div>
        `;
    },

    /**
     * 显示讨论详情
     */
    showDetail(id) {
        const discussion = this.discussions.find(d => d.id === id);
        if (!discussion) return;

        let replies = [];
        try {
            replies = typeof discussion.replies === 'string' ? JSON.parse(discussion.replies || '[]') : (discussion.replies || []);
        } catch (e) {
            console.error('解析回复数据失败:', e);
            replies = [];
        }

        let files = null;
        if (discussion.files) {
            try {
                files = typeof discussion.files === 'string' ? JSON.parse(discussion.files) : discussion.files;
            } catch (e) {
                console.error('解析文件数据失败:', e);
                files = null;
            }
        }

        const authorId = discussion.user_id;

        // 统一权限判断：本人或管理员
        const isAuthor = Auth.currentUser && (
            String(Auth.currentUser.name) === String(authorId) ||
            Auth.currentUser.role === 'admin' ||
            (Auth.currentUser.id && String(Auth.currentUser.id) === String(typeof authorId === 'object' ? authorId.id : authorId))
        );
        const userInfo = this._getUserInfo(authorId);
        const title = discussion.name || discussion.title || '';
        const authorInitial = userInfo.avatar_initial;
        const authorName = userInfo.display_name;

        // 提取图片文件作为小红书风格的 Hero Section
        const imageFiles = files ? files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)) : [];
        const otherFiles = files ? files.filter(f => !/\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)) : [];

        const replyHTML = replies.length > 0 ? replies.map((r, index) => {
            const replyUserInfo = this._getUserInfo(r.user_id);
            const isReplyAuthor = Auth.currentUser && (
                String(Auth.currentUser.name) === String(r.user_id) ||
                Auth.currentUser.role === 'admin'
            );

            return `
                <div class="discussion-reply" data-reply-index="${index}">
                    <div class="discussion-reply-header">
                        <div class="discussion-reply-author">
                            <div class="user-avatar discussion-reply-avatar" style="background:${replyUserInfo.avatar_color}">
                                ${replyUserInfo.avatar_initial}
                            </div>
                            <span>${Utils.escapeHTML(replyUserInfo.display_name)}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="discussion-reply-time">${Utils.formatDate(r.created_at)}</span>
                            ${isReplyAuthor ? `
                                <button class="btn-delete-reply" onclick="Discussions.deleteReply(${id}, ${index})" title="删除回复" style="background:none; border:none; cursor:pointer; padding:4px; border-radius:4px; color:#94a3b8; transition:all 0.2s;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="discussion-reply-content">${Utils.escapeHTML(r.content)}</div>
                    <div class="discussion-reply-attachments" style="margin-top: 10px;">
                        ${FileUploadHelper.renderAttachments(r.files)}
                    </div>
                </div>
            `;
        }).join('') : '<div class="discussion-no-replies">暂无回复，快来发表你的看法吧！</div>';

        const filesHTML = `
            <div class="discussion-detail-attachments" style="margin-top: 20px;">
                <h4 style="margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #475569;">附件资料</h4>
                ${FileUploadHelper.renderAttachments(discussion.files)}
            </div>
        `;

        const currentUserInfo = Auth.currentUser ? {
            name: Auth.currentUser.real_name || Auth.currentUser.name || '?',
            avatar_color: Auth.currentUser.avatar_color || 'var(--primary)'
        } : { name: '?', avatar_color: 'var(--primary)' };

        // 构造小红书风格详情 HTML
        const bodyHTML = `
            <div class="xhs-detail-container">
                <!-- 1. 顶部已精简 (元数据下移) -->

                <!-- 2. 媒体展示区 (Hero Image) -->
                ${imageFiles.length > 0 ? `
                    <div class="xhs-media-grid">
                        ${imageFiles.map(img => `
                            <div class="xhs-media-item" onclick="ImageLightbox.open('${img.url}', '${Utils.escapeHTML(img.name)}')">
                                <img src="${img.url}" alt="${img.name}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- 3. 内容区 -->
                <div class="xhs-content-section">
                    <h1 class="xhs-title">${Utils.escapeHTML(title)}</h1>
                    <div class="xhs-body-text">${Utils.escapeHTML(discussion.content || '').replace(/\n/g, '<br>')}</div>
                    
                    ${otherFiles.length > 0 ? `
                        <div class="xhs-other-files">
                            ${FileUploadHelper.renderAttachments(otherFiles)}
                        </div>
                    ` : ''}

                    <div class="xhs-divider"></div>
                    <div class="xhs-post-time-aligned">${Utils.formatDate(discussion.created_at)}</div>
                </div>

                <!-- 4. 评论区 -->
                <div class="xhs-comments-section">
                    <div class="xhs-comments-count">共 ${replies.length} 条评论</div>
                    ${replyHTML}
                </div>

                <!-- 底部留白 -->
                <div style="height: 40px;"></div>
            </div>
        `;

        // 构造三期：极简集成底部回复条
        const footerHTML = `
            <div class="xhs-footer-compact-bar">
                <button class="xhs-compact-action" title="上传附件" onclick="document.getElementById('discussion-reply-file-input').click()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>
                <input type="file" id="discussion-reply-file-input" multiple style="display:none;" onchange="Discussions.handleFileUpload(event)">
                <div class="xhs-compact-input-wrapper">
                    <textarea id="discussion-reply-content" placeholder="发表公开评论..." class="xhs-textarea-compact-v2"></textarea>
                </div>
                <button class="xhs-publish-btn-compact" onclick="Discussions.reply(${id})">发布</button>
                <div id="discussion-reply-file-list" class="xhs-reply-files-overlay"></div>
            </div>
        `;

        // 构造自定义 Header HTML (头像 + 姓名 + ...)
        const headerHTML = `
            <div class="xhs-modal-header-custom">
                <div class="user-avatar xhs-header-avatar" style="background:${userInfo.avatar_color}">
                    ${userInfo.avatar_initial}
                </div>
                <span class="xhs-header-name">${Utils.escapeHTML(userInfo.display_name)}</span>
                <div class="xhs-header-more">
                    ${isAuthor || Auth.currentUser?.role === 'admin' ? `
                        <button class="xhs-more-btn" onclick="Discussions.toggleMoreActions(event)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        </button>
                    ` : ''}
                    <div id="xhs-more-menu" class="xhs-more-menu">
                        ${isAuthor || Auth.currentUser?.role === 'admin' ? `
                            <div class="xhs-menu-item" onclick="Discussions.editDiscussion(${id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                <span>更新信息</span>
                            </div>
                            <div class="xhs-menu-item danger" onclick="Discussions.deleteDiscussion(${id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                <span>删除讨论</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        Modal.open(headerHTML, bodyHTML, footerHTML);
        FileUploadHelper.initDropZone('discussion-reply-file-zone', 'discussion-reply-file-list');

        // 点击外部关闭菜单
        const closeMenu = (e) => {
            const menu = document.getElementById('xhs-more-menu');
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
        const menu = document.getElementById('xhs-more-menu');
        if (menu) {
            menu.classList.toggle('active');
        }
    },

    /**
     * 显示创建讨论模态框
     */
    showCreateModal() {
        Modal.open('发起讨论', `
            <div class="form-group">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">讨论主题 *</label>
                <input type="text" id="discussion-title-input" placeholder="输入讨论主题..." style="height:44px; font-size:15px; border-radius:10px;">
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">详细内容 *</label>
                <textarea id="discussion-content-input" rows="6" placeholder="详细描述你想讨论的内容..." style="border-radius:10px; padding:12px; font-size:14px;"></textarea>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">附件上传</label>
                <div class="file-upload-zone" id="discussion-file-zone" onclick="document.getElementById('discussion-file-input').click()">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <p style="margin-top:12px; font-size:14px; font-weight:600; color:#64748b;">点击或拖拽文件到此处上传</p>
                    <span style="margin-top:4px; font-size:12px; color:#94a3b8;">支持图片、文档等文件格式，单个文件不超过20MB</span>
                    <input type="file" id="discussion-file-input" multiple style="display:none;" onchange="Discussions.handleFileUpload(event)">
                </div>
                <div id="discussion-file-list" class="file-list" style="margin-top:12px;"></div>
            </div>
        `, `
            <button class="btn btn-primary" style="height:40px; border-radius:10px; padding:0 30px; font-weight:700;" onclick="Discussions.create()">发布讨论</button>
        `);
        FileUploadHelper.initDropZone('discussion-file-zone', 'discussion-file-list');
    },

    // 已移除本地 _initFileDropZone，改用 FileUploadHelper.initDropZone

    /**
     * 处理文件上传
     */
    handleFileUpload(event) {
        const files = event.target.files || event.dataTransfer.files;
        if (!files || files.length === 0) return;

        let fileListId = 'discussion-file-list';
        if (event.target.id === 'discussion-reply-file-input') {
            fileListId = 'discussion-reply-file-list';
        } else if (event.target.id === 'edit-discussion-file-input') {
            fileListId = 'edit-discussion-file-list';
        }

        const fileList = document.getElementById(fileListId);
        if (!fileList) return;

        Array.from(files).forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                Toast.show(`${file.name} 文件大小超过20MB，无法上传`, 'error');
                return;
            }

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 8px;
                transition: all 0.2s;
            `;

            const fileIcon = document.createElement('div');
            fileIcon.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 6px;
                background: #eff6ff;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            `;

            const isImage = file.type.startsWith('image/');
            if (isImage) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.cssText = `
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    object-fit: cover;
                `;
                fileIcon.appendChild(img);
            } else {
                fileIcon.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                `;
            }

            const fileInfo = document.createElement('div');
            fileInfo.style.cssText = `
                flex: 1;
                min-width: 0;
            `;

            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            fileName.style.cssText = `
                font-size: 14px;
                font-weight: 500;
                color: #334155;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;

            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = this._formatFileSize(file.size);
            fileSize.style.cssText = `
                font-size: 12px;
                color: #94a3b8;
                margin-top: 2px;
            `;

            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);

            // 关键修复：将文件对象保存到 DOM 元素中，以便 FileUploadHelper.processFilesBeforeStorage 能够读取并上传
            fileItem.fileObject = file;
            fileItem.dataset.fileName = file.name;
            fileItem.dataset.fileSize = this._formatFileSize(file.size);

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            `;
            removeBtn.style.cssText = `
                width: 24px;
                height: 24px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            `;
            removeBtn.onmouseover = function () {
                this.style.background = '#fee2e2';
                this.querySelector('svg').style.stroke = '#ef4444';
            };
            removeBtn.onmouseout = function () {
                this.style.background = 'none';
                this.querySelector('svg').style.stroke = '#94a3b8';
            };
            removeBtn.onclick = function () {
                fileItem.remove();
            };

            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        });

        // 清除 input 值，允许选择同一个文件
        if (event.target.type === 'file') {
            event.target.value = '';
        }
    },

    /**
     * 格式化文件大小
     */
    _formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 创建讨论
     */
    async create() {
        const title = document.getElementById('discussion-title-input').value.trim();
        const content = document.getElementById('discussion-content-input').value.trim();

        if (!title || !content) {
            Toast.show('请填写主题和内容', 'warning');
            return;
        }

        let files = [];
        try {
            files = await FileUploadHelper.processFilesBeforeStorage('discussion-file-list');
        } catch (err) {
            Toast.show(err.message, 'error');
            return;
        }

        try {
            const user = Auth.currentUser;
            const authorId = user?.id;
            const discussion = {
                name: title,
                content,
                user_id: user ? user.name : '',
                is_pinned: 0,
                replies: '[]',
                last_reply_at: Utils.toDBDate()
            };

            // 只有当存在文件时才包含 files 字段，防止数据库因缺少该列而报错
            if (files.length > 0) {
                discussion.files = JSON.stringify(files);
            }

            const newDiscussion = await DB.create(Config.TABLES.DISCUSSIONS, discussion);
            this.discussions.push(newDiscussion);

            this._sort();
            this.render();

            Modal.close();
            Toast.show('讨论发布成功', 'success');

            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.sendTeamNotification('discussion', { name: title });
            }
        } catch (err) {
            console.error('发布讨论失败:', err);
            Toast.show('发布失败', 'error');
        }
    },

    /**
     * 回复讨论
     */
    async reply(discussionId) {
        const content = document.getElementById('discussion-reply-content').value.trim();
        if (!content) {
            Toast.show('请输入回复内容', 'warning');
            return;
        }

        let files = [];
        try {
            files = await FileUploadHelper.processFilesBeforeStorage('discussion-reply-file-list');
        } catch (err) {
            Toast.show(err.message, 'error');
            return;
        }

        try {
            const user = Auth.currentUser;
            const discussion = this.discussions.find(d => d.id === discussionId);
            if (!discussion) return;

            const reply = {
                id: Date.now(),
                content,
                files: files.length > 0 ? files : null,
                user_id: user ? user.name : '',
                created_at: Utils.toDBDate()
            };

            let replies = [];
            try {
                replies = typeof discussion.replies === 'string' ? JSON.parse(discussion.replies || '[]') : (discussion.replies || []);
            } catch (e) {
                replies = [];
            }

            replies.unshift(reply); // 最新回复排在最前面
            const updatedReplies = JSON.stringify(replies);
            const updatedLastReplyAt = Utils.toDBDate();

            const updateData = {
                replies: updatedReplies,
                last_reply_at: updatedLastReplyAt
            };

            await DB.update(Config.TABLES.DISCUSSIONS, discussionId, updateData);
            discussion.replies = replies;
            discussion.last_reply_at = updatedLastReplyAt;

            this._sort();
            this.render();
            this.showDetail(discussionId); // 回复成功后立即刷新详情模态框

            // 清空回复表单
            const textarea = document.getElementById('discussion-reply-content');
            if (textarea) textarea.value = '';
            const fileList = document.getElementById('discussion-reply-file-list');
            if (fileList) fileList.innerHTML = '';

            Toast.show('回复成功', 'success');

            // 发送消息通知给讨论发起人（排除自己）
            if (typeof Messages !== 'undefined' && discussion.user_id) {
                const sender = Auth.currentUser;
                Messages.send({
                    type: 'discussion_reply',
                    content: `${sender?.real_name || sender?.name || '有人'}回复了你的讨论: ${discussion.name}`,
                    recipientId: discussion.user_id,
                    senderId: sender?.id,
                    refType: 'discussion',
                    refId: discussionId
                });
            }
        } catch (err) {
            console.error('回复讨论失败:', err);
            Toast.show('回复失败', 'error');
        }
    },

    /**
     * 切换置顶状态
     */
    async togglePin(discussionId) {
        const discussion = this.discussions.find(d => d.id === discussionId);
        if (!discussion) return;

        try {
            const newPinStatus = !discussion.is_pinned;

            // 使用数据库模式
            try {
                await DB.update(Config.TABLES.DISCUSSIONS, discussionId, { is_pinned: newPinStatus });
                discussion.is_pinned = newPinStatus;
            } catch (dbError) {
                console.error('数据库更新置顶状态失败:', dbError);
                throw dbError;
            }

            this._sort();
            this.render();

            Toast.show(newPinStatus ? '讨论已置顶' : '已取消置顶', 'info');
        } catch (err) {
            console.error('操作失败:', err);
            Toast.show('操作失败', 'error');
        }
    },

    /**
     * 删除讨论
     */
    async deleteDiscussion(discussionId) {
        try {
            // 使用数据库模式
            try {
                await DB.remove(Config.TABLES.DISCUSSIONS, discussionId);
                this.discussions = this.discussions.filter(d => d.id !== discussionId);
            } catch (dbError) {
                console.error('数据库删除讨论失败:', dbError);
                throw dbError;
            }

            this.render();

            Modal.close();
            Toast.show('讨论已删除', 'info');
        } catch (err) {
            console.error('删除失败:', err);
            Toast.show('删除失败', 'error');
        }
    },

    /**
     * 显示编辑讨论模态框
     */
    editDiscussion(discussionId) {
        const discussion = this.discussions.find(d => d.id === discussionId);
        if (!discussion) return;

        // 关闭当前详情模态框
        const menu = document.getElementById('xhs-more-menu');
        if (menu) menu.classList.remove('active');

        this._removedFiles = [];

        Modal.open('更新讨论信息', `
            <div class="form-group">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">讨论主题 *</label>
                <input type="text" id="edit-discussion-title" value="${Utils.escapeHTML(discussion.name)}" style="height:44px; font-size:15px; border-radius:10px;">
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">详细内容 *</label>
                <textarea id="edit-discussion-content" rows="6" style="border-radius:10px; padding:12px; font-size:14px;">${Utils.escapeHTML(discussion.content || '')}</textarea>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">当前附件</label>
                <div id="edit-discussion-existing-files" class="xhs-other-files" style="margin-bottom:12px;">
                    ${FileUploadHelper.renderEditableAttachments(discussion.files, 'Discussions')}
                </div>
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">添加新附件</label>
                <div class="file-upload-zone" id="edit-discussion-file-zone" onclick="document.getElementById('edit-discussion-file-input').click()">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <p style="margin-top:8px; font-size:13px; color:#64748b;">点击上传新文件</p>
                    <input type="file" id="edit-discussion-file-input" multiple style="display:none;" onchange="Discussions.handleFileUpload(event)">
                </div>
                <div id="edit-discussion-file-list" class="file-list" style="margin-top:12px;"></div>
            </div>
        `, `
            <button class="btn btn-primary" style="height:42px; border-radius:12px; font-weight:700; padding:0 30px;" onclick="Discussions.update(${discussionId})">保存更新</button>
        `);
        FileUploadHelper.initDropZone('edit-discussion-file-zone', 'edit-discussion-file-list');
    },

    /**
     * 删除已有的附件（标记为删除）
     */
    removeExistingFile(index, elementId) {
        FileUploadHelper.handleExistingFileRemoval(index, elementId, this._removedFiles);
    },

    /**
     * 保存编辑结果
     */
    async update(id) {
        const title = document.getElementById('edit-discussion-title').value.trim();
        const content = document.getElementById('edit-discussion-content').value.trim();

        if (!title || !content) {
            Toast.show('请填写主题和内容', 'warning');
            return;
        }

        try {
            const discussion = this.discussions.find(d => d.id === id);
            if (!discussion) return;

            // 处理新上传的文件
            let newFiles = [];
            try {
                newFiles = await FileUploadHelper.processFilesBeforeStorage('edit-discussion-file-list');
            } catch (err) {
                Toast.show(err.message, 'error');
                return;
            }

            // 合并文件
            let existingFiles = [];
            try {
                existingFiles = discussion.files ? JSON.parse(discussion.files) : [];
            } catch (e) {
                existingFiles = [];
            }

            // 过滤掉被标记删除的文件
            if (this._removedFiles && this._removedFiles.length > 0) {
                existingFiles = existingFiles.filter((_, idx) => !this._removedFiles.includes(idx));
            }

            const allFiles = [...existingFiles, ...newFiles];

            const updateData = {
                name: title,
                content: content,
                files: allFiles.length > 0 ? JSON.stringify(allFiles) : null
            };

            await DB.update(Config.TABLES.DISCUSSIONS, id, updateData);

            // 更新本地缓存
            discussion.name = title;
            discussion.content = content;
            discussion.files = updateData.files;

            this.render();
            Toast.show('修改已保存', 'success');

            // 重新打开详情页
            this.showDetail(id);
        } catch (err) {
            console.error('更新讨论失败:', err);
            Toast.show('保存失败', 'error');
        }
    },

    /**
     * 下载附件文件
     * @param {string} fileName - 文件名
     */
    downloadFile(fileName) {
        const decodedFileName = decodeURIComponent(fileName);
        // 在实际应用中，这里应该从服务器获取文件
        // 目前使用模拟下载
        Toast.show(`开始下载: ${decodedFileName}`, 'info');

        // 创建模拟下载链接
        const link = document.createElement('a');
        link.href = '#';
        link.download = decodedFileName;
        link.click();

        setTimeout(() => {
            Toast.show(`下载完成: ${decodedFileName}`, 'success');
        }, 1000);
    },

    /**
     * 预览图片
     * @param {string} fileName - 图片文件名
     */
    previewImage(fileName) {
        const decodedFileName = decodeURIComponent(fileName);

        // 在实际应用中，这里应该从服务器获取图片URL
        // 目前使用模拟预览
        Modal.open('图片预览', `
            <div style="text-align: center; padding: 20px;">
                <div style="display: inline-block; max-width: 100%; max-height: 70vh; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
                    <img src="https://picsum.photos/800/600" alt="${Utils.escapeHTML(decodedFileName)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <p style="margin-top: 16px; font-size: 14px; color: #64748b;">${Utils.escapeHTML(decodedFileName)}</p>
            </div>
        `, '');
    }
};
