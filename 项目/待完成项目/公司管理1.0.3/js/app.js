/**
 * 主应用入口
 * 页面路由、导航切换、Toast 通知、Modal 管理
 */

// ==================== 路由与导航 ====================
const App = {
    currentPage: 'tasks-personal',

    /**
     * 初始化应用
     */
    init() {
        this.navigate('tasks-personal');

        // 请求桌面通知权限
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // 开发模式标识
        if (Config.IS_DEV) {
            setTimeout(() => {
                const title = document.querySelector('.sidebar-title');
                if (title) {
                    const badge = document.createElement('span');
                    badge.textContent = 'DEV';
                    badge.style.cssText = 'font-size: 10px; background: #ef4444; color: #fff; padding: 1px 4px; border-radius: 4px; margin-left: 6px; vertical-align: middle; font-weight: bold;';
                    title.appendChild(badge);
                }
            }, 100);
            console.log('%c[System] 开发模式已开启', 'color: #ef4444; font-weight: bold;');
        }
    },

    /**
     * 页面导航
     * @param {string} page - 目标页面 ID
     */
    navigate(page) {
        this.currentPage = page;

        // 隐藏所有页面
        document.querySelectorAll('.page-content').forEach(el => {
            el.classList.remove('active');
        });

        // 显示目标页面
        const target = document.getElementById(`page-${page}`);
        if (target) {
            target.classList.add('active');
        }

        // 更新导航高亮
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === page);
        });

        // 触发页面加载回调
        this._onPageEnter(page);
    },

    /**
     * 页面进入回调
     */
    _onPageEnter(page) {
        switch (page) {
            case 'tasks-global':
                TaskGlobal.load();
                break;
            case 'tasks-personal':
                TaskPersonal.load();
                break;
            case 'accounts':
                Accounts.init();
                break;
            case 'announcements':
                Announcements.load();
                break;
            case 'skills':
                Skills.load();
                break;
            case 'discussions':
                if (typeof Discussions !== 'undefined' && Discussions.load) Discussions.load();
                break;
            case 'claude-code':
                if (typeof ClaudeCode !== 'undefined' && ClaudeCode.init) ClaudeCode.init();
                break;
            case 'github-projects':
                if (typeof GitHubProjects !== 'undefined' && GitHubProjects.load) GitHubProjects.load();
                break;
            case 'messages':
                if (typeof Messages !== 'undefined' && Messages.load) Messages.load();
                break;
            case 'versions':
                if (typeof Versions !== 'undefined' && Versions.load) Versions.load();
                break;
        }
    },

    /**
     * 刷新当前页面
     */
    refreshCurrentPage() {
        if (this.currentPage) {
            console.log('[App] 刷新当前页面:', this.currentPage);
            this._onPageEnter(this.currentPage);
        }
    }
};

// ==================== Toast 通知 ====================
const Toast = {
    /**
     * 显示 Toast 通知
     * @param {string} message - 通知内容
     * @param {'success'|'error'|'info'|'warning'} type - 通知类型
     * @param {number} duration - 持续时间 ms
     */
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // 类型图标
        const icons = {
            success: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
            info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        };

        toast.innerHTML = `<span style="display:inline-flex;align-items:center;">${icons[type] || ''}</span> ${message}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// ==================== 团队通知系统 ====================
const NotificationSystem = {
    pollingTimer: null,

    /**
     * 发送团队通知
     */
    sendTeamNotification(type, data, sender = null) {
        const currentUser = Auth.currentUser;
        if (!currentUser) return;
    },

    /**
     * 开启轮询检查新事件（任务、讨论）
     */
    startPolling() {
        if (this.pollingTimer) clearInterval(this.pollingTimer);
        if (!localStorage.getItem('last_notification_check')) {
            localStorage.setItem('last_notification_check', new Date().toISOString());
        }
        console.log('[通知系统] 已开启团队事件轮询...');
        // 首次加载未读角标（静默，不显示错误）
        if (typeof Messages !== 'undefined') {
            Messages._silentLoad().catch(() => { });
        }
        this.pollingTimer = setInterval(() => this.checkNewEvents(), Config.NOTIFICATION_POLLING_INTERVAL || 15000);
    },

    _buildCheckFilter(lastCheck) {
        return [['where', ['created_at', '>', lastCheck]]];
    },

    /**
     * 执行检查动作
     */
    async checkNewEvents() {
        if (!Auth.currentUser) return;
        const lastCheck = localStorage.getItem('last_notification_check');
        const now = Utils.toDBDate(); // 使用 DB 兼容格式记录

        try {
            const filters = this._buildCheckFilter(lastCheck);
            const events = [];

            // 1. 检查新任务
            const taskRes = await DB.query(Config.TABLES.TASKS, { filters });
            const newTasks = (taskRes.data || []).filter(t => String(t.user_id) !== String(Auth.currentUser.name));
            if (newTasks.length > 0) events.push({ type: 'task', count: newTasks.length, latest: newTasks[0] });

            // 2. 检查公告
            const annRes = await DB.query(Config.TABLES.ANNOUNCEMENTS, { filters });
            const newAnns = (annRes.data || []).filter(a => String(a.user_id) !== String(Auth.currentUser.name));
            if (newAnns.length > 0) events.push({ type: 'announcement', count: newAnns.length, latest: newAnns[0] });

            // 3. 检查讨论
            const discRes = await DB.query(Config.TABLES.DISCUSSIONS, { filters });
            const newDiscs = (discRes.data || []).filter(d => String(d.user_id) !== String(Auth.currentUser.name));
            if (newDiscs.length > 0) events.push({ type: 'discussion', count: newDiscs.length, latest: newDiscs[0] });

            // 3. 检查新 Skill
            const skillRes = await DB.query(Config.TABLES.SKILLS, { filters });
            const newSkills = (skillRes.data || []).filter(s => String(s.user_id) !== String(Auth.currentUser.name));
            if (newSkills.length > 0) events.push({ type: 'skill', count: newSkills.length, latest: newSkills[0] });

            // 4. 检查新 GitHub 项目
            const githubRes = await DB.query(Config.TABLES.GITHUB_PROJECTS, { filters });
            const newGithub = (githubRes.data || []).filter(p => String(p.user_id) !== String(Auth.currentUser.name));
            if (newGithub.length > 0) events.push({ type: 'github', count: newGithub.length, latest: newGithub[0] });

            // 弹出汇总通知
            if (events.length > 0) {
                events.forEach(e => this.showTeamNotification(e.type, e.latest, e.count));
            }

            localStorage.setItem('last_notification_check', now);

            // 5. 检查新的站内消息（MESSAGES 表）
            if (typeof Messages !== 'undefined' && Config.TABLES.MESSAGES) {
                try {
                    // 极致兼容：查询所有可能匹配自己的未读消息
                    const myIdentities = [String(Auth.currentUser.id), String(Auth.currentUser.name), String(Auth.currentUser.real_name)];
                    const msgFilters = [
                        ['where', ['recipient_id', 'IN', myIdentities]],
                        ['where', ['is_read', '=', '0']],
                        ['where', ['created_at', '>', lastCheck]]
                    ];
                    const msgResult = await DB.query(Config.TABLES.MESSAGES, { filters: msgFilters });
                    const newMsgs = msgResult.data || [];
                    if (newMsgs.length > 0) console.log('[通知系统] 发现新消息:', newMsgs);

                    // 同步 Messages 对象中的静态状态，不仅仅是修改 UI
                    if (typeof Messages !== 'undefined') {
                        // 触发静默加载，确保内存中的 messages 列表与数据库一致
                        Messages._silentLoad();
                    } else {
                        // 回退方案：直接更新角标
                        const badge = document.getElementById('msg-badge');
                        const count = (msgResult.data || []).length;
                        if (badge) {
                            if (count > 0) {
                                badge.textContent = count > 99 ? '99+' : count;
                                badge.style.display = 'inline-flex';
                            } else {
                                badge.style.display = 'none';
                            }
                        }
                    }

                    if (newMsgs.length > 0) {
                        // 映射板块名称
                        const sectionMap = {
                            'task': '任务板块',
                            'discussion': '讨论板块',
                            'announcement': '公告板块',
                            'skill': '技能分享',
                            'github': '项目分享'
                        };

                        if (newMsgs.length === 1) {
                            const msg = newMsgs[0];
                            const sectionName = sectionMap[msg.ref_type] || '系统消息';
                            const title = `${sectionName}通知`;
                            const body = msg.content && msg.content.length > 30
                                ? msg.content.substring(0, 30) + '...'
                                : (msg.content || '你有一条新消息');

                            console.log('[通知系统] 发送单条通知:', { title, body });

                            // 1. 尝试通过 IPC (Main Process) 发送
                            if (window.electron && window.electron.showNotification) {
                                console.log('[通知系统] 正在调用 Electron IPC...');
                                window.electron.showNotification(title, body);
                            }

                            // 2. 尝试通过 Web Notification API 发送 (作为备份)
                            if ('Notification' in window) {
                                if (Notification.permission === 'granted') {
                                    console.log('[通知系统] 正在调用 Web Notification...');
                                    new Notification(title, { body, icon: 'build/tray-icon.png' });
                                } else if (Notification.permission !== 'denied') {
                                    console.log('[通知系统] 请求通知权限...');
                                    Notification.requestPermission().then(permission => {
                                        if (permission === 'granted') {
                                            new Notification(title, { body });
                                        }
                                    });
                                }
                            }

                            if (window.speechSynthesis) {
                                const utterance = new SpeechSynthesisUtterance(`你有一条新的${sectionName}消息`);
                                utterance.lang = 'zh-CN';
                                window.speechSynthesis.speak(utterance);
                            }
                        } else {
                            // 多条消息聚合
                            const sections = [...new Set(newMsgs.map(m => sectionMap[m.ref_type] || '系统'))];
                            const title = '多场景消息提醒';
                            const body = `收到了来自 ${sections.join('、')} 等板块的 ${newMsgs.length} 条动态`;

                            if (window.electron && window.electron.showNotification) {
                                window.electron.showNotification(title, body);
                            }
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification(title, { body });
                            }

                            if (window.speechSynthesis) {
                                const utterance = new SpeechSynthesisUtterance(`收到了${newMsgs.length}条多板块动态消息`);
                                utterance.lang = 'zh-CN';
                                window.speechSynthesis.speak(utterance);
                            }
                        }
                    }
                } catch (msgErr) {
                    console.error('[通知系统] 消息轮询失败:', msgErr);
                }
            }
        } catch (err) {
            console.error('[通知系统] 轮询检查失败:', err);
        }
    },

    /**
     * 显示团队通知
     */
    showTeamNotification(type, data, count = 1, sender = null) {
        let title = '';
        let body = '';
        const suffix = count > 1 ? ` (共${count}条新内容)` : '';

        switch (type) {
            case 'task':
                title = '📅 新任务发布';
                body = `任务: ${data.name || '未命名'}${suffix}`;
                break;
            case 'discussion':
                title = '💬 新项目讨论';
                body = `主题: ${data.name || data.title || '未命名'}${suffix}`;
                break;
            case 'announcement':
                title = '📢 新内部公告';
                body = `公告: ${data.name || '未命名'}${suffix}`;
                break;
            case 'skill':
                title = '💡 新 Skill 分享';
                body = `内容: ${data.name || '未命名技能'}${suffix}`;
                break;
            case 'github':
                title = '🐙 新 GitHub 项目';
                body = `项目: ${data.name || '未命名项目'}${suffix}`;
                break;
            default:
                title = '🔔 系统通知';
                body = (data.name || '您收到一条新消息') + suffix;
        }

        // 1. Electron 原生通知
        if (window.electron && window.electron.showNotification) {
            window.electron.showNotification(title, body);
        }
        // 2. Web Notification API (双端通用)
        else if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(title, { body: body, icon: 'favicon.ico' });
            } catch (e) {
                console.warn('Web Notification 触发失败:', e);
            }
        }

        // 无论是否弹出桌面通知，都显示 Toast
        Toast.show(`${title}: ${body}`, 'info');
    },

};

// ==================== Modal 管理 ====================
const Modal = {
    /**
     * 打开 Modal
     * @param {string} title - 标题
     * @param {string} bodyHTML - 内容 HTML
     * @param {string} [footerHTML] - 底栏 HTML
     */
    open(title, bodyHTML, footerHTML = '') {
        document.getElementById('modal-title').innerHTML = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        // Support array-based footer buttons
        if (Array.isArray(footerHTML)) {
            document.getElementById('modal-footer').innerHTML = footerHTML.map(b =>
                `<button class="${b.class || 'btn btn-secondary'}" onclick="${b.onclick || ''}">${b.text}</button>`
            ).join('');
        } else {
            document.getElementById('modal-footer').innerHTML = footerHTML;
        }
        document.getElementById('modal-overlay').style.display = 'flex';

        // 聚焦第一个输入框
        setTimeout(() => {
            const firstInput = document.querySelector('#modal-body input, #modal-body textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    },

    /**
     * 关闭 Modal
     */
    close() {
        document.getElementById('modal-overlay').style.display = 'none';
    }
};

// ==================== 工具函数 ====================
const Utils = {
    /**
     * 格式化日期
     * @param {string} dateStr - ISO 日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;

        // 1分钟内
        if (diff < 60000) return '刚刚';
        // 1小时内
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        // 24小时内
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        // 7天内
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

        // 超过7天显示日期
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() === now.getFullYear()
            ? `${month}-${day}`
            : `${d.getFullYear()}-${month}-${day}`;
    },

    /**
     * 将日期转换为 DB 兼容格式 (YYYY-MM-DD HH:mm:ss)
     * 防止 BaseMulti 500 错误
     */
    toDBDate(date = new Date()) {
        const d = new Date(date);
        const pad = (n) => String(n).padStart(2, '0');
        const Y = d.getFullYear();
        const M = pad(d.getMonth() + 1);
        const D = pad(d.getDate());
        const H = pad(d.getHours());
        const min = pad(d.getMinutes());
        const S = pad(d.getSeconds());
        return `${Y}-${M}-${D} ${H}:${min}:${S}`;
    },

    /**
     * 生成随机头像颜色
     */
    randomColor() {
        return Config.AVATAR_COLORS[
            Math.floor(Math.random() * Config.AVATAR_COLORS.length)
        ];
    },

    /**
     * HTML 转义
     */
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    priorityTagClass(priority) {
        const map = { '高': 'tag-priority-high', '中': 'tag-priority-medium', '低': 'tag-priority-low' };
        return map[priority] || '';
    },
    statusTagClass(status) {
        const map = { '待接取': 'tag-status', '进行中': 'tag-status-active', '待验收': 'tag-status-waiting', '已完成': 'tag-status-done' };
        return map[status] || 'tag-status';
    }
};

// ==========================================
// 初始化
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化应用
    Auth.init().finally(async () => {
        // 开启轮询
        if (Auth.currentUser && typeof NotificationSystem !== 'undefined') {
            NotificationSystem.startPolling();
        }

        // 监听来自主进程的导航请求（托盘菜单点击）
        if (window.electron && window.electron.onNavigateTo) {
            window.electron.onNavigateTo((page) => {
                App.navigate(page);
            });
        }

        // 检查版本更新
        if (typeof Versions !== 'undefined') {
            Versions.init();
        }
    });
});

// ==================== 性能优化 ====================
// 图片懒加载
if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                imgObserver.unobserve(img);
            }
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img[data-src]').forEach(img => {
            imgObserver.observe(img);
        });
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
