/**
 * 认证模块
 * 登录、注册、本地存储登录状态
 */
const Auth = {
    /** 当前登录用户 */
    currentUser: null,
    /** 所有用户信息缓存 */
    allUsers: [],

    /**
     * 初始化 — 尝试从本地存储恢复登录状态
     */
    async init() {
        await this.loadAllUsers();
        this._restoreLoginState();
    },

    /**
     * 从本地存储恢复登录状态
     */
    _restoreLoginState() {
        try {
            const storedUser = localStorage.getItem('auth_current_user');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
                this._enterApp();
                return;
            }
        } catch (e) {
            console.error('恢复登录状态失败:', e);
        }
        this._showAuthPage();
    },

    /**
     * 保存登录状态到本地存储
     */
    _saveLoginState() {
        try {
            if (this.currentUser) {
                localStorage.setItem('auth_current_user', JSON.stringify(this.currentUser));
            }
        } catch (e) {
            console.error('保存登录状态失败:', e);
        }
    },

    /**
     * 清除本地存储的登录状态
     */
    _clearLoginState() {
        try {
            localStorage.removeItem('auth_current_user');
        } catch (e) {
            console.error('清除登录状态失败:', e);
        }
    },

    /**
     * 加载所有用户信息
     */
    async loadAllUsers() {
        try {
            if (!Config.DB_BASE_ID) {
                this.allUsers = [];
            } else {
                const result = await DB.queryAll(Config.TABLES.USERS);
                this.allUsers = result.map(u => ({
                    ...u,
                    // 增加显示用的辅助字段，但不覆盖原始字段
                    display_name: u.real_name || u.name || '未知用户',
                    avatar_color: u.avatar_color || 'var(--primary)'
                }));
                console.log('[Auth] 已加载用户信息，共:', this.allUsers.length, '样例:', this.allUsers[0]);

                // 刷新 UI 以更新可能因加载延迟而显示为 Mock 的用户名
                if (typeof App !== 'undefined' && App.refreshCurrentPage) {
                    App.refreshCurrentPage();
                }
            }
        } catch (e) {
            console.error('加载用户列表失败:', e);
            this.allUsers = [];
        }
    },

    /**
     * 获取用户信息 (标准匹配：优先匹配 user_id 与 users.name)
     * 极致兼容：支持 ID、登录名、姓名
     */
    getUser(key) {
        if (!key) return { name: '系统', real_name: '系统', avatar_color: 'var(--primary)' };

        // 1. 解析输入的标识符 (matchKey)
        let matchKey = '';
        let initialColor = 'var(--primary)';

        if (Array.isArray(key)) key = key[0];

        if (typeof key === 'object' && key !== null) {
            // 如果传入的是对象，尝试提取关键 ID
            matchKey = String(key.user_id || key.id || key.name || key.real_name || '').trim();
            initialColor = key.avatar_color || initialColor;
        } else {
            matchKey = String(key).trim();
        }

        // 过滤无效输入
        if (!matchKey || matchKey === '[object Object]' || matchKey === 'undefined') {
            return { name: '系统', real_name: '系统', avatar_color: 'var(--primary)' };
        }

        const query = matchKey.toLowerCase();

        // 2. 匹配逻辑：user_id/name/id -> users -> 显示 real_name
        const findMatch = (u) => {
            if (!u) return false;
            const uId = String(u.id || '').toLowerCase();
            const uName = String(u.name || '').toLowerCase();
            const uReal = String(u.real_name || '').toLowerCase();
            return uName === query || uReal === query || uId === query;
        };

        // 先从缓存找
        let match = this.allUsers.find(findMatch);

        // 找不到再看当前登录用户
        if (!match && this.currentUser && findMatch(this.currentUser)) {
            match = this.currentUser;
        }

        if (match) {
            // 匹配成功：保持原始字段
            const displayName = match.real_name || match.name || matchKey;
            console.debug(`[Auth] getUser 匹配成功: "${matchKey}" -> "${displayName}"`);

            // 计算头像显示的文字 (取首字母/汉字)
            const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

            return {
                ...match,
                id: match.id || matchKey,
                display_name: displayName,
                avatar_initial: initial,
                avatar_color: match.avatar_color || 'var(--primary)'
            };
        }

        // 3. 匹配失败处理
        if (this.allUsers.length === 0 && Config.DB_BASE_ID) {
            this.loadAllUsers(); // 异步加载
        }

        console.debug(`[Auth] getUser 匹配失败: "${matchKey}"，当前缓存用户数: ${this.allUsers.length}`);

        // 如果匹配不到，则原样返回输入值作为名称 (即 usrsjL27)
        return {
            id: matchKey,
            name: matchKey,
            real_name: matchKey,
            avatar_color: initialColor,
            is_mock: true
        };
    },

    /**
     * 诊断工具：在控制台输入 Auth.diagnose()
     */
    diagnose() {
        console.log('--- Auth 诊断信息 ---');
        console.log('当前用户:', this.currentUser);
        console.log('用户缓存数量:', this.allUsers.length);
        if (this.allUsers.length > 0) {
            console.log('用户样例 (前3个):', this.allUsers.slice(0, 3));
        }
        console.log('--------------------');
    },

    /**
     * 登录
     */
    async login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            Toast.show('请填写用户名和密码', 'warning');
            return;
        }

        // === 管理员账号特殊处理 ===
        if (username === 'admin' && password === '123456') {
            this.currentUser = {
                id: 'admin',
                name: 'admin',
                real_name: '系统管理员',
                role: 'admin',
                avatar_color: 'var(--primary)'
            };
            this._saveLoginState();
            Toast.show('管理员登录成功', 'success');
            this._enterApp();
            return;
        }

        try {
            // 查询用户
            const result = await DB.query(Config.TABLES.USERS, {
                filters: [['where', ['name', '=', username]]]
            });

            if (result.data.length === 0) {
                Toast.show('用户名不存在', 'error');
                return;
            }

            const user = result.data[0];
            if (user.password !== password) {
                Toast.show('密码错误', 'error');
                return;
            }

            this.currentUser = user;
            this._saveLoginState();

            // 保存账号和密码（记住我）
            const rememberMe = document.getElementById('remember-me').checked;
            if (rememberMe) {
                localStorage.setItem('saved_account_name', username);
                localStorage.setItem('saved_account_pwd', password);
            } else {
                localStorage.removeItem('saved_account_name');
                localStorage.removeItem('saved_account_pwd');
            }

            // 开启团队事件轮询
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.startPolling();
            }

            Toast.show(`欢迎回来，${user.real_name}！`, 'success');
            this._enterApp();
        } catch (err) {
            Toast.show('登录失败，请检查网络', 'error');
        }
    },

    /**
     * 注册
     */
    async register() {
        const realName = document.getElementById('reg-realname').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confirmPwd = document.getElementById('reg-password-confirm').value.trim();

        if (!realName || !username || !password) {
            Toast.show('请填写所有必填项', 'warning');
            return;
        }

        if (password !== confirmPwd) {
            Toast.show('两次密码不一致', 'error');
            return;
        }

        if (password.length < 4) {
            Toast.show('密码至少4位', 'warning');
            return;
        }

        try {
            // 检查用户名是否存在
            const existing = await DB.query(Config.TABLES.USERS, {
                filters: [['where', ['name', '=', username]]]
            });

            if (existing.data.length > 0) {
                Toast.show('用户名已存在', 'error');
                return;
            }

            // 随机头像颜色
            const avatarColor = Config.AVATAR_COLORS[
                Math.floor(Math.random() * Config.AVATAR_COLORS.length)
            ];

            const user = await DB.create(Config.TABLES.USERS, {
                name: username,
                password,
                real_name: realName,
                avatar_color: avatarColor
            });

            this.currentUser = user;
            this._saveLoginState();

            Toast.show(`注册成功！欢迎，${realName}`, 'success');
            this._enterApp();
        } catch (err) {
            Toast.show('注册失败，请检查网络', 'error');
        }
    },

    /**
     * 退出登录
     */
    logout() {
        this.currentUser = null;
        this._clearLoginState();
        this._showAuthPage();
        Toast.show('已退出登录', 'info');
    },

    /**
     * 切换显示登录表单
     */
    showLogin() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    },

    /**
     * 切换显示注册表单
     */
    showRegister() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    },

    // ===  内部方法 ===

    _showAuthPage() {
        document.getElementById('auth-page').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';

        // 尝试恢复保存的账号和密码
        const savedAccount = localStorage.getItem('saved_account_name');
        const savedPwd = localStorage.getItem('saved_account_pwd');

        if (savedAccount) {
            const usernameInput = document.getElementById('login-username');
            const pwdInput = document.getElementById('login-password');
            const rememberCheckbox = document.getElementById('remember-me');

            if (usernameInput) usernameInput.value = savedAccount;
            if (pwdInput && savedPwd) pwdInput.value = savedPwd;
            if (rememberCheckbox) rememberCheckbox.checked = true;

            // 自动聚焦到登录按钮（如果账号密码都填了）
            if (savedAccount && savedPwd) {
                setTimeout(() => {
                    const loginBtn = document.querySelector('.auth-btn');
                    if (loginBtn) loginBtn.focus();
                }, 100);
            } else if (usernameInput) {
                // 仅填了账号，聚焦到密码框
                setTimeout(() => {
                    if (pwdInput) pwdInput.focus();
                }, 100);
            }
        }
    },

    _enterApp() {
        document.getElementById('auth-page').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        this._updateUserUI();

        // 权限控制 UI
        const isAdmin = this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.name === 'admin');
        document.body.classList.toggle('is-admin', isAdmin);

        // 侧边栏菜单显示逻辑
        const sidebar = document.querySelector('.sidebar-nav');
        if (sidebar) {
            // 首先显示所有内容
            sidebar.querySelectorAll('.nav-section, .nav-item').forEach(el => el.style.display = '');

            if (!isAdmin) {
                // 普通用户：隐藏“版本更新”
                const versionItem = sidebar.querySelector('[data-page="versions"]');
                if (versionItem) versionItem.style.display = 'none';
            } else {
                // 管理员：显示所有功能（包含版本更新）
                console.log('[Auth] 管理员登录，显示完整功能菜单');
            }
        }

        App.init();

        // 管理员自动跳转到版本页面
        if (isAdmin) {
            App.navigate('versions');
        }
    },

    _updateUserUI() {
        if (!this.currentUser) return;
        const user = this.getUser(this.currentUser.name);
        const name = user.display_name;
        const initial = user.avatar_initial;
        const color = user.avatar_color;

        // 侧边栏用户信息
        const avatar = document.getElementById('sidebar-avatar');
        if (avatar) {
            avatar.textContent = initial;
            avatar.style.background = color;
        }

        const nameEl = document.getElementById('sidebar-username');
        if (nameEl) nameEl.textContent = name;
    }
};
