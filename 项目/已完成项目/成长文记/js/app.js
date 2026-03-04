/**
 * 主入口文件 - app.js
 *
 * 功能：
 * - 检测设备类型
 * - 动态切换手机端/屏幕端视图
 * - 初始化数据库连接
 * - 加载对应端的JS模块
 */

// ========== 全局变量 ==========

/**
 * 数据库实例
 * @type {Database}
 */
let db = null;

/**
 * 当前模式：'mobile' 或 'screen'
 * @type {string}
 */
let currentMode = null;

// ========== 设备检测 ==========

/**
 * 检测是否为移动设备
 *
 * 业务逻辑：
 * 1. 检测User Agent
 * 2. 检测屏幕宽度（小于768px认为是移动设备）
 * 3. 检测触摸屏
 *
 * @returns {boolean} 是否为移动设备
 */
function isMobileDevice() {
    // 检测User Agent
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(navigator.userAgent);

    // 检测屏幕宽度
    const isMobileScreen = window.innerWidth < 768;

    // 检测触摸屏
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    console.log('🔍 [App] 设备检测结果:', {
        userAgent: navigator.userAgent,
        isMobileUA: isMobileUA,
        isMobileScreen: isMobileScreen,
        isTouchDevice: isTouchDevice,
        screenWidth: window.innerWidth
    });

    // 综合判断：UA匹配 或 (屏幕小 且 支持触摸)
    return isMobileUA || (isMobileScreen && isTouchDevice);
}

// ========== 视图切换 ==========

/**
 * 显示手机端视图
 *
 * 业务逻辑：
 * 1. 隐藏屏幕端容器
 * 2. 显示手机端容器
 * 3. 加载手机端JS模块
 */
function showMobileView() {
    console.log('📱 [App] 切换到手机端视图');

    currentMode = 'mobile';

    // 切换视图显示
    const mobileView = document.getElementById('mobileView');
    const screenView = document.getElementById('screenView');

    if (mobileView) mobileView.classList.remove('hidden');
    if (screenView) screenView.classList.add('hidden');

    // 加载手机端模块
    loadScript('js/mobile/app-mobile.js');
}

/**
 * 显示屏幕端视图
 *
 * 业务逻辑：
 * 1. 隐藏手机端容器
 * 2. 显示屏幕端容器
 * 3. 加载屏幕端JS模块
 */
function showScreenView() {
    console.log('🖥️ [App] 切换到屏幕端视图');

    currentMode = 'screen';

    // 切换视图显示
    const mobileView = document.getElementById('mobileView');
    const screenView = document.getElementById('screenView');

    if (mobileView) mobileView.classList.add('hidden');
    if (screenView) screenView.classList.remove('hidden');

    // 加载屏幕端模块
    loadScript('js/screen/app-screen.js');
}

// ========== 工具函数 ==========

/**
 * 动态加载JS脚本
 *
 * @param {string} src - 脚本路径
 * @returns {Promise} 加载完成的Promise
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // 检查是否已加载
        if (document.querySelector(`script[src="${src}"]`)) {
            console.log(`⚠️ [App] 脚本已加载: ${src}`);
            resolve();
            return;
        }

        const script = document.createElement('script');
        // 添加版本参数防止缓存
        const version = Date.now();
        script.src = `${src}?v=${version}`;
        script.onload = () => {
            console.log(`✅ [App] 脚本加载成功: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`❌ [App] 脚本加载失败: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.body.appendChild(script);
    });
}

/**
 * 显示Toast提示
 *
 * @param {string} message - 提示信息
 * @param {string} type - 类型：success/error/warning/info
 */
function showToast(message, type = 'info') {
    console.log(`💬 [Toast] ${type}: ${message}`);

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * 显示Loading遮罩
 *
 * @param {string} text - Loading文字
 */
function showLoading(text = '加载中...') {
    console.log(`⏳ [Loading] ${text}`);

    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');

    if (overlay && loadingText) {
        loadingText.textContent = text;
        overlay.classList.remove('hidden');
    }
}

/**
 * 隐藏Loading遮罩
 */
function hideLoading() {
    console.log('✅ [Loading] 隐藏');

    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * 格式化文件大小
 *
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小（如：1.5MB）
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// ========== 初始化 ==========

/**
 * 页面加载完成后初始化
 *
 * 业务逻辑：
 * 1. 验证URL参数
 * 2. 初始化数据库连接
 * 3. 检测设备类型
 * 4. 显示对应视图
 */
window.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 [App] 应用启动');

    // 🔒 自动 HTTPS 跳转逻辑
    // 如果当前是 HTTP 且不是 localhost (避免干扰本地调试，但 anywhere localhost 也是 http)
    // 我们的目标是：如果是 http://ip:8000 -> 跳转到 https://ip:8001
    if (window.location.protocol === 'http:') {
        const currentPort = parseInt(window.location.port) || 80;
        // 假设 HTTPS 端口是 HTTP 端口 + 1 (Anywhere 默认行为)
        const targetPort = currentPort + 1;

        console.warn(`🔒 [Security] 检测到 HTTP 环境 (${currentPort})，正在跳转到 HTTPS (${targetPort})...`);

        const newUrl = `https://${window.location.hostname}:${targetPort}${window.location.pathname}${window.location.search}`;
        window.location.href = newUrl;
        return; // 停止后续初始化
    }

    try {
        // 验证URL参数
        if (!CONFIG.URL_PARAMS.type || !CONFIG.URL_PARAMS.token) {
            throw new Error('缺少必需的URL参数，请从正确的入口访问');
        }

        // 初始化数据库
        db = new Database(
            CONFIG.DATABASE.BASE_URL,
            CONFIG.DATABASE.BASE_ID,
            CONFIG.DATABASE.API_KEY
        );

        console.log('✅ [App] 数据库初始化成功');
        console.log('👤 [App] 当前用户:', CONFIG.URL_PARAMS.username);

        // 检测设备类型并切换视图
        if (isMobileDevice()) {
            showMobileView();
        } else {
            showScreenView();
        }

    } catch (error) {
        console.error('❌ [App] 初始化失败:', error);
        showToast(error.message, 'error');
    }
});

console.log('✅ [App] app.js 加载完成');
