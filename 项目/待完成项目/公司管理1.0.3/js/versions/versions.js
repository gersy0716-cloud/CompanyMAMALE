/**
 * 版本更新模块
 * 支持检查更新、发布新版本、下载安装包
 * 展示：状态卡片 + 时间线版本历史
 */
const Versions = {
    versions: [],
    hasUpdate: false,
    latestVersion: null,
    isUpdating: false,
    updateProgress: 0,
    checkTimer: null,

    /**
     * 初始化
     */
    init() {
        console.log('[版本] 模块初始化...');
        this.checkUpdate(true); // 首次静默检查

        // 每 30 分钟自动检查一次
        if (this.checkTimer) clearInterval(this.checkTimer);
        this.checkTimer = setInterval(() => this.checkUpdate(true), 30 * 60 * 1000);

        // 监听来自主进程的更新进度
        if (window.electron) {
            window.electron.onUpdateProgress((progress) => {
                console.log(`[更新] 下载进度: ${progress}%`);
                this.isUpdating = true;
                this.updateProgress = progress;
                this.render(); // 如果在页面上，更新 UI

                // 仅管理员或非静默模式下提示，普通用户静默更新不打扰
                const isAdmin = Auth.currentUser && (Auth.currentUser.role === 'admin' || Auth.currentUser.name === 'admin');
                if (isAdmin) {
                    if (progress % 20 === 0 || progress === 1 || progress === 99) {
                        Toast.show(`系统正在后台静默更新 (${progress}%)...`, 'info', 2000);
                    }

                    if (progress === 100) {
                        Toast.show('更新包下载完成，准备安装重启...', 'success', 5000);
                    }
                }
            });

            window.electron.onUpdateError((err) => {
                console.error('[更新] 失败:', err);
                this.isUpdating = false;
                // 仅管理员提示错误
                if (Auth.currentUser && Auth.currentUser.role === 'admin') {
                    Toast.show('系统自动更新失败: ' + err, 'error');
                }
            });
        }
    },

    /**
     * 加载版本列表
     */
    async load() {
        try {
            const data = await DB.queryAll(Config.TABLES.VERSIONS);
            this.versions = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            this.render();

            // 仅 admin 可以发布新版本
            const publishBtn = document.getElementById('btn-publish-version');
            if (publishBtn) {
                const isAdmin = Auth.currentUser && (Auth.currentUser.role === 'admin' || Auth.currentUser.name === 'admin');
                publishBtn.style.display = isAdmin ? '' : 'none';
            }
        } catch (err) {
            console.error('[版本] 加载失败:', err);
            Toast.show('版本列表加载失败', 'error');
        }
    },

    /**
     * 检查是否有新版本
     * @param {boolean} silent - 是否静默模式（不弹窗，直接下载）
     */
    async checkUpdate(silent = false) {
        if (this.isUpdating) return;

        try {
            const result = await DB.query(Config.TABLES.VERSIONS, { pageLimit: 1 });
            const list = (result.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            if (list.length === 0) return;

            const latest = list[0];
            const remoteVer = (latest.version || '').replace(/^v/i, '');
            const localVer = (Config.CURRENT_VERSION || '').replace(/^v/i, '');

            if (this._compareVersions(remoteVer, localVer) > 0) {
                this.hasUpdate = true;
                this.latestVersion = latest;
                this._showUpdateBadge();

                // 开启静默更新流程
                console.log(`[更新] 发现新版本 ${latest.version}，开始静默下载安装...`);
                if (latest.download_url && window.electron && window.electron.downloadAndInstallUpdate) {
                    this.isUpdating = true;
                    window.electron.downloadAndInstallUpdate(latest.download_url);

                    // 只有管理员且非静默模式才提示
                    const isAdmin = Auth.currentUser && (Auth.currentUser.role === 'admin' || Auth.currentUser.name === 'admin');
                    if (isAdmin && !silent) {
                        Toast.show(`发现新版本 ${latest.version}，正在后台为您静默更新...`, 'info');
                    }
                } else if (!silent) {
                    // 如果无法自动更新（比如 Web 端），则显示手动更新弹窗
                    this._showUpdateDialog(latest);
                }
            } else if (!silent) {
                Toast.show('已是最新版本', 'success');
            }
        } catch (err) {
            console.warn('[版本] 检查更新失败:', err);
            // 仅管理员提示错误
            if (!silent && Auth.currentUser && Auth.currentUser.role === 'admin') {
                Toast.show('检查更新失败', 'error');
            }
        }
    },

    /**
     * 版本号比较：返回 1 表示 a > b，0 表示相等，-1 表示 a < b
     */
    _compareVersions(a, b) {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const na = pa[i] || 0;
            const nb = pb[i] || 0;
            if (na > nb) return 1;
            if (na < nb) return -1;
        }
        return 0;
    },

    /**
     * 在侧边栏显示更新红点
     */
    _showUpdateBadge() {
        // 仅管理员显示红点
        if (Auth.currentUser && Auth.currentUser.role !== 'admin') return;

        const badge = document.getElementById('version-badge');
        if (badge) {
            badge.style.display = 'inline-flex';
            badge.textContent = '新';
        }
    },

    /**
     * 弹出更新提示对话框（作为手动更新的保底方案）
     */
    _showUpdateDialog(versionData) {
        const changelog = Utils.escapeHTML(versionData.changelog || '修复已知问题，提升稳定性');
        const modal = document.createElement('div');
        modal.id = 'update-dialog-overlay';
        modal.className = 'version-update-overlay';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
            <div class="version-update-dialog">
                <div class="version-update-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </div>
                <div class="version-update-title">发现新版本 ${Utils.escapeHTML(versionData.version)}</div>
                <div class="version-update-subtitle">当前版本 ${Config.CURRENT_VERSION}</div>
                <div class="version-update-changelog">${changelog.replace(/\n/g, '<br>')}</div>
                <div class="version-update-actions">
                    <button class="btn btn-secondary" onclick="document.getElementById('update-dialog-overlay').remove()">
                        稍后提醒
                    </button>
                    <button class="btn btn-primary" onclick="Versions.downloadUpdate('${Utils.escapeHTML(versionData.download_url || '')}'); document.getElementById('update-dialog-overlay').remove();">
                        立即下载包
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * 下载更新安装包（手动模式）
     */
    downloadUpdate(url) {
        if (!url) {
            Toast.show('下载链接不可用', 'error');
            return;
        }
        Toast.show('正在下载更新...', 'info');

        // 使用 Electron shell 打开外部链接下载
        if (window.electron && window.electron.openExternal) {
            window.electron.openExternal(url);
        } else {
            // Web 回退：直接下载
            FileUploadHelper.downloadFile(url, `码码乐_更新安装包.exe`);
        }
    },

    /**
     * 渲染版本页面：如果是管理员执行发布，如果是普通用户则不显示（CSS已隐藏）
     */
    render() {
        const container = document.getElementById('version-list');
        if (!container) return;

        const isAdmin = Auth.currentUser && (Auth.currentUser.role === 'admin' || Auth.currentUser.name === 'admin');

        if (isAdmin) {
            // 管理员界面：直接显示发布表单，不显示状态检查和复杂历史
            container.innerHTML = `
                <div class="version-publish-container" style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 4px;">发布新版本</h3>
                        <p style="font-size: 13px; color: #64748b;">填写以下信息以发布系统更新。发布后，所有客户端将自动静默下载并升级。</p>
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">版本号 <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="admin-version-number" placeholder="例如 v1.0.1" style="width: 100%; height:44px; padding: 0 12px; border:1px solid #e2e8f0; border-radius:10px; font-size:15px; background: #f8fafc;">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">下载直链 <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="admin-version-url" placeholder="请输入 setup.exe 的直链下载地址" style="width: 100%; height:44px; padding: 0 12px; border:1px solid #e2e8f0; border-radius:10px; font-size:15px; background: #f8fafc;">
                        <p style="margin-top:8px; font-size:12px; color:#94a3b8;">提示：请确保该链接可直接访问并下载安装程序（如 OSS 直链）。</p>
                    </div>
                    <button class="btn btn-primary" style="height:48px; border-radius:12px; font-size: 16px; font-weight:700; width:100%; box-shadow: 0 4px 12px rgba(64,128,255,0.2);" onclick="Versions.submitAdminVersion()">提 交 发 布</button>
                    
                    <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                        <h4 style="font-size: 14px; color: #64748b; margin-bottom: 16px;">最近发布历史</h4>
                        <div id="admin-history-list" class="version-timeline" style="margin-top: 0;">
                            ${this.versions.slice(0, 5).map((v, i) => this._renderTimelineItem(v, i, true)).join('')}
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // 普通用户界面（理论上由于侧边栏限制不会进入，但作为保底逻辑）
        container.innerHTML = `
            <div class="version-status-card" style="justify-content: center; text-align: center; padding: 40px;">
                <p style="color: #64748b;">系统已开启全自动后台升级，您无需进行任何操作。</p>
            </div>
        `;
    },

    /**
     * 管理员页面提交新版本
     */
    async submitAdminVersion() {
        const version = document.getElementById('admin-version-number')?.value?.trim();
        const downloadUrl = document.getElementById('admin-version-url')?.value?.trim();

        if (!version) {
            Toast.show('请输入版本号', 'error');
            return;
        }
        if (!downloadUrl) {
            Toast.show('请提供下载直链', 'error');
            return;
        }

        try {
            Toast.show('正在发布新版本...', 'info');
            await DB.create(Config.TABLES.VERSIONS, {
                name: version,
                version: version,
                download_url: downloadUrl,
                changelog: ''
            });

            Toast.show(`版本 ${version} 已成功发布！`, 'success', 5000);
            await this.load();
        } catch (err) {
            console.error('[版本] 发布失败:', err);
            Toast.show('发布失败，请检查网络或配置', 'error');
        }
    },

    /**
     * 渲染单条时间线项
     */
    _renderTimelineItem(versionData, index, isAdmin = false) {
        const ver = Utils.escapeHTML(versionData.version || versionData.name || '未知版本');
        const localVer = (Config.CURRENT_VERSION || '').replace(/^v/i, '');
        const remoteVer = (versionData.version || '').replace(/^v/i, '');
        const isCurrent = this._compareVersions(remoteVer, localVer) === 0;
        const isLatestRelease = index === 0;

        // 管理员在历史列表里不需要展示下载按钮，且样式微调
        if (isAdmin) {
            return `
                <div class="version-timeline-item" style="padding-bottom: 12px; border-left: 2px solid #f1f5f9; margin-left: 10px; padding-left: 20px; position: relative;">
                    <div style="position: absolute; left: -6px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: ${isLatestRelease ? '#4080ff' : '#cbd5e1'};"></div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #334155;">${ver}</span>
                        <span style="font-size: 12px; color: #94a3b8;">${versionData.created_at ? Utils.formatDate(versionData.created_at) : ''}</span>
                    </div>
                </div>
            `;
        }

        // 时间线项 class
        let itemClass = 'version-timeline-item';
        if (isLatestRelease) itemClass += ' is-latest';
        if (isCurrent) itemClass += ' is-current';

        // 版本标签
        let tagHtml = '';
        if (isLatestRelease && !isCurrent) {
            tagHtml = `<span class="version-tag tag-latest">最新</span>`;
        } else if (isCurrent) {
            tagHtml = `<span class="version-tag tag-current">当前版本</span>`;
        } else {
            tagHtml = `<span class="version-tag tag-history">历史</span>`;
        }

        // 格式化日期
        const dateStr = versionData.created_at ? Utils.formatDate(versionData.created_at) : '';

        // 发布者
        const publisher = Utils.escapeHTML(versionData.user_id || '');

        // 更新日志
        const changelog = versionData.changelog || '';
        let changelogHtml = '';
        if (changelog) {
            // 尝试按行分割作为列表
            const lines = changelog.split('\n').filter(l => l.trim());
            if (lines.length > 1) {
                changelogHtml = `
                    <div class="version-changelog">
                        <ul class="version-changelog-list">
                            ${lines.map(line => `<li>${Utils.escapeHTML(line.replace(/^[-•·*]\s*/, ''))}</li>`).join('')}
                        </ul>
                    </div>
                `;
            } else {
                changelogHtml = `
                    <div class="version-changelog">
                        <div class="version-changelog-text">${Utils.escapeHTML(changelog)}</div>
                    </div>
                `;
            }
        }

        // 下载按钮
        const downloadUrl = versionData.download_url || '';
        let downloadHtml = '';
        if (downloadUrl) {
            downloadHtml = `
                <button class="version-download-btn" onclick="Versions.downloadUpdate('${Utils.escapeHTML(downloadUrl)}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    下载安装包
                </button>
            `;
        }

        return `
            <div class="${itemClass}">
                <div class="version-timeline-card">
                    <div class="version-card-header">
                        <div class="version-card-title">
                            <span class="version-card-ver">${ver}</span>
                            ${tagHtml}
                        </div>
                        <div class="version-card-meta">
                            ${dateStr ? `
                                <span class="version-card-meta-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    ${dateStr}
                                </span>
                            ` : ''}
                            ${publisher ? `
                                <span class="version-card-meta-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    ${publisher}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    ${changelogHtml}
                    ${downloadHtml}
                </div>
            </div>
        `;
    },

    /**
     * 显示发布新版本弹窗
     */
    showPublishModal() {
        Modal.open('发布新版本', `
            <div class="form-group">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">版本号 <span style="color:#ef4444;">*</span></label>
                <input type="text" id="new-version-number" placeholder="例如 v1.0.1" style="height:44px; font-size:15px; border-radius:10px;">
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">更新说明</label>
                <textarea id="new-version-changelog" rows="5" placeholder="请输入本次更新内容，每行一条..." style="border-radius:10px; padding:12px; font-size:14px;"></textarea>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">下载直链 <span style="color:#ef4444;">*</span></label>
                <input type="text" id="new-version-url" placeholder="请输入 setup.exe 的直链地址" style="height:44px; font-size:15px; border-radius:10px;">
                <p style="margin-top:8px; font-size:12px; color:#94a3b8;">提示：请确保该链接可直接访问并下载安装程序。</p>
            </div>
        `, `
            <button class="btn btn-primary" style="height:42px; border-radius:12px; padding:0 40px; font-weight:700; width:100%; box-shadow: 0 4px 12px rgba(64,128,255,0.2);" onclick="Versions.submitVersion()">发布新版本</button>
        `);
    },

    /**
     * 提交新版本
     */
    async submitVersion() {
        const version = document.getElementById('new-version-number')?.value?.trim();
        const changelog = document.getElementById('new-version-changelog')?.value?.trim();
        const downloadUrl = document.getElementById('new-version-url')?.value?.trim();

        if (!version) {
            Toast.show('请输入版本号', 'error');
            return;
        }

        if (!downloadUrl) {
            Toast.show('请提供下载直链', 'error');
            return;
        }

        try {
            Toast.show('正在发布...', 'info');
            await DB.create(Config.TABLES.VERSIONS, {
                version: version,
                changelog: changelog || '',
                download_url: downloadUrl,
                user_id: Auth.currentUser ? Auth.currentUser.name : 'Unknown'
            });

            Modal.close();
            Toast.show(`版本 ${version} 发布成功！所有端将同步。`, 'success', 5000);
            await this.load();
        } catch (err) {
            console.error('[版本] 发布失败:', err);
            Toast.show('版本发布失败', 'error');
        }
    }
};
