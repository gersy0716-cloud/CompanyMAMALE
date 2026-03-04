/**
 * 通用文件上传助手
 * 封装云端上传逻辑、文件选择处理、附件展示等功能
 */
const FileUploadHelper = {
    /**
     * 处理文件上传事件（用于 onchange）
     * @param {Event} event - input change 事件
     * @param {string} listId - 渲染文件列表的容器 ID
     */
    handleFileUpload(event, listId) {
        const files = event.target.files || event.dataTransfer.files;
        if (!files || files.length === 0) return;

        const fileList = document.getElementById(listId);
        if (!fileList) return;

        Array.from(files).forEach(file => {
            if (file.size > 20 * 1024 * 1024) { // 限制 20MB
                Toast.show(`${file.name} 文件大小超过 20MB，无法上传`, 'error');
                return;
            }

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.fileName = file.name;
            fileItem.dataset.fileSize = this._formatFileSize(file.size);
            fileItem.fileObject = file; // 保存原始对象

            // 样式设置（复用 discussions 的样式，建议后期合并到 tasks.css）
            fileItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 8px;
            `;

            const isImage = file.type.startsWith('image/');
            const iconHtml = isImage ?
                `<img src="${URL.createObjectURL(file)}" style="width:24px; height:24px; border-radius:4px; object-fit:cover;">` :
                `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;

            fileItem.innerHTML = `
                <div style="width:32px; height:32px; border-radius:6px; background:#eff6ff; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    ${iconHtml}
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:14px; font-weight:500; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${file.name}</div>
                    <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${this._formatFileSize(file.size)}</div>
                </div>
                <button type="button" class="btn-remove" style="border:none; background:none; cursor:pointer; color:#94a3b8;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;

            fileItem.querySelector('.btn-remove').onclick = () => fileItem.remove();
            fileList.appendChild(fileItem);
        });
    },

    /**
     * 将文件列表中的文件批量上传到云端
     * @param {string} listId - 文件列表容器 ID
     * @returns {Promise<Array>} - 返回格式化的文件信息数组
     */
    async processFilesBeforeStorage(listId) {
        const fileList = document.getElementById(listId);
        if (!fileList) return [];

        const fileItems = fileList.querySelectorAll('.file-item');
        if (fileItems.length === 0) return [];

        const results = [];
        Toast.show('正在处理附件...', 'info');

        for (const item of Array.from(fileItems)) {
            const file = item.fileObject;
            if (!file) {
                // 如果是已存在的云端文件（在编辑模式下），直接保留
                if (item.dataset.fileUrl) {
                    results.push({
                        name: item.dataset.fileName,
                        size: item.dataset.fileSize,
                        url: item.dataset.fileUrl
                    });
                }
                continue;
            }

            try {
                // 上传
                const res = await DB.uploadFile(file);
                results.push({
                    name: file.name,
                    size: this._formatFileSize(file.size),
                    url: res.url
                });
            } catch (err) {
                console.error(`[上传失败] ${file.name}:`, err);
                throw new Error(`文件 ${file.name} 上传失败，请检查网络或配置`);
            }
        }
        return results;
    },

    /**
     * 渲染可在大图编辑模式下管理的附件列表（带删除按钮）
     * @param {Array|string} filesJson - 附件数据
     * @param {string} moduleName - 模块名称（如 'GitHubProjects'），用于构建回调函数
     * @returns {string} - HTML 字符串
     */
    renderEditableAttachments(filesJson, moduleName) {
        let files = [];
        try {
            files = typeof filesJson === 'string' ? JSON.parse(filesJson || '[]') : (filesJson || []);
        } catch (e) {
            files = [];
        }

        if (files.length === 0) {
            return '<div style="color:#94a3b8; font-size:13px; padding:12px; text-align:center; background:#f8fafc; border-radius:12px; border:1px dashed #e2e8f0;">暂无既有附件</div>';
        }

        return `
            <div class="editable-attachment-list" style="display:flex; flex-direction:column; gap:8px;">
                ${files.map((f, idx) => `
                    <div id="${moduleName}-existing-file-${idx}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; transition:all 0.2s;">
                        <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                            <div style="width:28px; height:28px; border-radius:6px; background:#eff6ff; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:13px; font-weight:600; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${Utils.escapeHTML(f.name)}</div>
                                <div style="font-size:11px; color:#94a3b8;">${f.size || ''}</div>
                            </div>
                        </div>
                        <button type="button" onclick="${moduleName}.removeExistingFile(${idx}, '${moduleName}-existing-file-${idx}')" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:6px; border-radius:6px; display:flex; transition:all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.color='#ef4444'" onmouseout="this.style.background='none'; this.style.color='#94a3b8'" title="移除此附件">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * 通用的删除附件视觉标记辅助
     */
    handleExistingFileRemoval(index, elementId, removedArray) {
        if (!removedArray.includes(index)) {
            removedArray.push(index);
        }
        const el = document.getElementById(elementId);
        if (el) {
            el.style.opacity = '0.4';
            el.style.pointerEvents = 'none';
            el.style.filter = 'grayscale(1)';
            el.style.textDecoration = 'line-through';
            const btn = el.querySelector('button');
            if (btn) btn.style.display = 'none';
        }
    },

    /**
     * 渲染附件列表静态 HTML（详情页展示）
     */
    renderAttachments(filesJson) {
        let files = [];
        try {
            files = typeof filesJson === 'string' ? JSON.parse(filesJson || '[]') : (filesJson || []);
        } catch (e) {
            console.error('解析附件失败:', e);
            return '<div class="empty-text">附件解析失败</div>';
        }

        if (!Array.isArray(files) || files.length === 0) {
            return '<div class="empty-text" style="color:#94a3b8; font-size:12px;">暂无附件</div>';
        }

        // 过滤掉无效附件（没有 url 和 data 的）
        files = files.filter(f => f && (f.url || f.data));
        if (files.length === 0) {
            return '<div class="empty-text" style="color:#94a3b8; font-size:12px;">暂无附件</div>';
        }

        return `
            <div class="attachment-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:12px;">
                ${files.map((file, idx) => {
            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
            const fileUrl = file.url || file.data || '';
            const safeFileName = Utils.escapeHTML(file.name);
            return `
                        <div class="attachment-card" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; display:flex; flex-direction:column;">
                            ${isImg ? `
                                <div class="attachment-preview" onclick="ImageLightbox.open('${fileUrl}', '${safeFileName}')" style="aspect-ratio:16/9; cursor:pointer; overflow:hidden;">
                                    <img src="${fileUrl}" style="width:100%; height:100%; object-fit:cover;">
                                </div>
                            ` : ''}
                            <div class="attachment-info" style="padding:8px 12px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                                <div style="flex:1; min-width:0;">
                                    <div style="font-size:12px; font-weight:600; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${safeFileName}">
                                        ${safeFileName}
                                    </div>
                                    <div style="font-size:10px; color:#94a3b8; margin-top:2px;">${file.size}</div>
                                </div>
                                <a href="javascript:void(0)" onclick="FileUploadHelper.downloadFile('${fileUrl}', '${safeFileName.replace(/'/g, "\\'")}')" style="padding:4px 8px; background:#eff6ff; color:#3b82f6; border-radius:6px; font-size:11px; text-decoration:none; font-weight:600; flex-shrink:0;">下载</a>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    /**
     * 强制使用原始文件名下载文件 (解决跨域 download 属性失效问题)
     */
    async downloadFile(url, filename) {
        try {
            Toast.show('准备下载...', 'info');
            const response = await fetch(url);
            if (!response.ok) throw new Error('网络响应异常');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 延迟释放，确保下载能够启动
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
            Toast.show('开始下载', 'success');
        } catch (error) {
            console.error('[下载失败]', error);
            Toast.show('下载失败，正在尝试直接打开...', 'warning');
            window.open(url, '_blank');
        }
    },

    _formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 初始化拖拽上传区域
     * @param {string} zoneId - 拖拽区域的 ID
     * @param {string} listId - 文件列表容器的 ID
     */
    initDropZone(zoneId, listId) {
        const zone = document.getElementById(zoneId);
        if (!zone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
            zone.addEventListener(name, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        zone.addEventListener('dragover', () => zone.classList.add('active'));
        zone.addEventListener('dragleave', () => zone.classList.remove('active'));
        zone.addEventListener('drop', (e) => {
            zone.classList.remove('active');
            this.handleFileUpload(e, listId);
        });
    }
};
