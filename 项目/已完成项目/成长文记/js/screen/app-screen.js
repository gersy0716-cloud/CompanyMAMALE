/**
 * 屏幕端入口文件 - app-screen.js
 *
 * 功能：
 * - 初始化屏幕端各功能模块
 * - TAB切换逻辑
 * - 成长时刻轮播
 * - 作文润色
 */

console.log('🖥️ [App-Screen] 屏幕端模块加载');

// ========== 模块状态 ==========

/**
 * 轮播状态
 */
const slideshowState = {
    photos: [],
    currentIndex: 0,
    isPlaying: false,
    timer: null,
    cache: new Map() // URL -> Image
};

/**
 * 作文润色状态
 */
const polishState = {
    allRecords: [],        // 所有来自数据库的作品
    currentEssay: null,
    currentTab: 'pending', // 'pending' | 'history'
    fontSize: CONFIG.DEFAULT_FONT_SIZE,
    resultFontSize: CONFIG.DEFAULT_FONT_SIZE,
    currentMarkdown: '',   // 缓存当前润色出的markdown内容
    isPolishing: false
};

// ========== 初始化 ==========

/**
 * 初始化屏幕端
 */
async function initScreen() {
    console.log('🖥️ [App-Screen] 初始化');

    // 检查marked库是否加载
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
    }

    // 绑定主TAB切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 绑定侧边栏TAB切换
    document.getElementById('tabPending')?.addEventListener('click', () => switchSidebarTab('pending'));
    document.getElementById('tabHistory')?.addEventListener('click', () => switchSidebarTab('history'));

    // 搜索与同步
    document.getElementById('essaySearchInput')?.addEventListener('input', (e) => handleSidebarSearch(e.target.value));
    document.getElementById('refreshListBtn')?.addEventListener('click', () => syncAllData(true));

    // 字体控制
    document.getElementById('originalFontIncreaseBtn')?.addEventListener('click', () => adjustFontSize('original', 2));
    document.getElementById('originalFontDecreaseBtn')?.addEventListener('click', () => adjustFontSize('original', -2));
    document.getElementById('resultFontIncreaseBtn')?.addEventListener('click', () => adjustFontSize('result', 2));
    document.getElementById('resultFontDecreaseBtn')?.addEventListener('click', () => adjustFontSize('result', -2));

    // 润色功能
    document.getElementById('polishBtn')?.addEventListener('click', polishEssay);

    // 成长时刻控制
    document.getElementById('startSlideshowBtn')?.addEventListener('click', startSlideshow);
    document.getElementById('stopSlideshowBtn')?.addEventListener('click', stopSlideshow);
    document.getElementById('refreshSlideshowBtn')?.addEventListener('click', manualRefreshGrowthMoments);
    document.getElementById('prevPhotoBtn')?.addEventListener('click', displayPrevPhoto);
    document.getElementById('nextPhotoBtn')?.addEventListener('click', displayNextPhoto);

    // 原文图片查看
    document.getElementById('viewOriginalImageBtn')?.addEventListener('click', () => {
        if (polishState.currentEssay?.url) {
            showImageModal(polishState.currentEssay.url);
        }
    });

    // 加载初始数据
    await syncAllData();
    loadGrowthMomentsWithCache();

    console.log('✅ [App-Screen] 屏幕端初始化完成');
}

// ========== TAB切换 ==========

/**
 * 切换TAB
 *
 * @param {string} tabName - TAB名称
 */
function switchTab(tabName) {
    console.log('🔄 [Tab] 切换到:', tabName);

    // 更新TAB按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // 更新TAB内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// ========== 作文润色：逻辑整合 ==========

/**
 * 同步所有作文数据
 * 
 * @param {boolean} showToastMsg - 是否显示吐司提示
 */
async function syncAllData(showToastMsg = false) {
    try {
        if (showToastMsg) showLoading('正在同步数据...');
        console.log('🔄 [Polish] 正在从数据库同步作品列表...');

        const records = await db.getRecords(CONFIG.DATABASE.TABLES.ESSAYS);

        // 排序：按创建时间倒序
        records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        polishState.allRecords = records;

        // 渲染当前列表
        renderSidebarList();

        // 自动选择第一条（如果有记录且当前未选择）
        // 或者如果当前有选择但不在列表中了（比如切换了标签），也重置
        if (polishState.allRecords.length > 0) {
            // 简单策略：总是选择列表中的第一个匹配当前标签的项
            const currentTabList = polishState.allRecords.filter(r =>
                polishState.currentTab === 'history' ? !!r.polished_text : !r.polished_text
            );

            if (currentTabList.length > 0) {
                // 如果当前没有选中，或者选中的不在当前列表里，默认选第一个
                const isCurrentInList = polishState.currentEssay &&
                    currentTabList.find(r => r.id === polishState.currentEssay.id);

                if (!polishState.currentEssay || !isCurrentInList) {
                    selectWork(currentTabList[0].id);
                } else {
                    // 如果当前还在，刷新一下以更新数据
                    selectWork(polishState.currentEssay.id);
                }
            }
        }

        if (showToastMsg) {
            hideLoading();
            showToast('数据同步成功', 'success');
        }
    } catch (error) {
        console.error('❌ [Polish] 同步失败:', error);
        if (showToastMsg) {
            hideLoading();
            showToast('同步失败: ' + error.message, 'error');
        }
    }
}

/**
 * 切换侧边栏标签
 */
function switchSidebarTab(tab) {
    if (polishState.currentTab === tab) return;

    polishState.currentTab = tab;

    // 更新 UI
    document.getElementById('tabPending').classList.toggle('active', tab === 'pending');
    document.getElementById('tabHistory').classList.toggle('active', tab === 'history');

    // 渲染列表
    renderSidebarList();
}

/**
 * 侧边栏搜索
 */
function handleSidebarSearch(query) {
    renderSidebarList(query.toLowerCase());
}

/**
 * 渲染侧边栏列表
 */
function renderSidebarList(filter = '') {
    const listContainer = document.getElementById('essaySidebarList');
    if (!listContainer) return;

    // 根据标签过滤
    const filtered = polishState.allRecords.filter(r => {
        const isMatchTab = polishState.currentTab === 'history' ? !!r.polished_text : !r.polished_text;
        const isMatchSearch = !filter ||
            (r.text && r.text.toLowerCase().includes(filter)) ||
            (r.prompt && r.prompt.toLowerCase().includes(filter));
        return isMatchTab && isMatchSearch;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <p>暂无${polishState.currentTab === 'pending' ? '待润色作品' : '润色历程'}</p>
                <p class="sub-desc">${filter ? '请尝试其他搜索词' : '在手机端上传照片后点击同步'}</p>
            </div>
        `;
        if (!polishState.currentEssay) clearPolishWorkspace(true);
        return;
    }

    listContainer.innerHTML = filtered.map(essay => {
        const timeStr = new Date(essay.created_at).toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });

        // 动态显示摘要：待办显示原文摘要，历史显示润色提示词
        const isHistory = polishState.currentTab === 'history';
        const rawContent = isHistory ? (essay.prompt || '（默认润色）') : (essay.text || '');
        // 给提示词增加固定前缀，使其更明显
        const displayData = isHistory ? `💡 提示词：${rawContent}` : rawContent;

        const summary = displayData.substring(0, 50).replace(/\n/g, ' ') + (displayData.length > 50 ? '...' : '');

        const isActive = polishState.currentEssay && polishState.currentEssay.id === essay.id;

        return `
            <div class="essay-card ${isActive ? 'active' : ''}" onclick="selectWork('${essay.id}')">
                <div class="essay-card-header">
                    <span class="essay-card-title">📅 ${timeStr}</span>
                </div>
                <div class="essay-card-desc">${summary}</div>
            </div>
        `;
    }).join('');
}

/**
 * 选择作品
 */
function selectWork(id) {
    const essay = polishState.allRecords.find(r => String(r.id) === String(id));
    if (!essay) return;

    polishState.currentEssay = essay;

    // 刷新列表项高亮
    renderSidebarList(document.getElementById('essaySearchInput')?.value);

    // 更新详情区
    updateWorkArea(essay);
}

/**
 * 更新主工作区内容
 */
function updateWorkArea(essay) {
    const isHistory = !!essay.polished_text;

    // 更新 Sync Data Badge (原 ID Badge)
    const idBadge = document.getElementById('currentEssayIdBadge');
    if (idBadge) {
        // 用户要求显示时间而不是 ID
        const timeStr = new Date(essay.created_at).toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        idBadge.textContent = timeStr;
    }

    // 1. 照片预览按钮控制
    const viewImageBtn = document.getElementById('viewOriginalImageBtn');
    if (viewImageBtn) {
        if (essay.url) {
            viewImageBtn.classList.remove('hidden');
        } else {
            viewImageBtn.classList.add('hidden');
        }
    }

    // 2. 原文内容
    const originalContainer = document.getElementById('originalTextContent');
    if (originalContainer) {
        let htmlContent;
        if (essay.text) {
            htmlContent = typeof marked !== 'undefined' ? marked.parse(essay.text) : essay.text.replace(/\n/g, '<br>');
        }
        originalContainer.innerHTML = `<div class="markdown-content">${htmlContent || '（暂无原文）'}</div>`;
        originalContainer.style.fontSize = polishState.fontSize + 'px';
    }

    // 3. 控件状态
    const promptInput = document.getElementById('promptInput');
    const polishBtn = document.getElementById('polishBtn');

    if (promptInput) {
        promptInput.value = essay.prompt || '';
        promptInput.disabled = isHistory;
        promptInput.placeholder = isHistory ? '该作品已润色，不支持在此修改提示词' : '请输入你的润色要求...';
    }
    if (polishBtn) {
        polishBtn.disabled = isHistory;
        polishBtn.style.display = isHistory ? 'none' : 'block';
    }

    // 4. 润色结果
    const resultContainer = document.getElementById('polishResult');
    if (resultContainer) {
        if (essay.polished_text) {
            const htmlContent = typeof marked !== 'undefined' ? marked.parse(essay.polished_text) : essay.polished_text.replace(/\n/g, '<br>');
            resultContainer.innerHTML = `<div class="markdown-content">${htmlContent}</div>`;
            resultContainer.style.fontSize = polishState.resultFontSize + 'px';
            polishState.currentMarkdown = essay.polished_text;
        } else {
            resultContainer.innerHTML = '<p class="placeholder">待润色：输入要求并点击上方按钮开始</p>';
            polishState.currentMarkdown = '';
        }
    }

    console.log('📝 [Polish] 作品已更新:', essay.id);
}

/**
 * 清除工作区状态
 */
function clearPolishWorkspace(isEmpty) {
    const photoPreview = document.getElementById('essayPhotoPreview');
    const originalContainer = document.getElementById('originalTextContent');
    const resultContainer = document.getElementById('polishResult');
    const promptInput = document.getElementById('promptInput');
    const polishBtn = document.getElementById('polishBtn');
    const exportBtn = document.getElementById('exportMdBtn');
    const idBadge = document.getElementById('currentEssayIdBadge');

    const message = isEmpty ? '请先在手机端上传作品' : '请从左侧列表选择作品';

    const viewImageBtn = document.getElementById('viewOriginalImageBtn');
    if (viewImageBtn) viewImageBtn.classList.add('hidden');
    if (originalContainer) originalContainer.innerHTML = `<p class="placeholder">${message}</p>`;
    if (resultContainer) resultContainer.innerHTML = `<p class="placeholder">${message}</p>`;
    if (promptInput) {
        promptInput.value = '';
        promptInput.disabled = true;
    }
    if (polishBtn) polishBtn.disabled = true;
    if (idBadge) idBadge.textContent = '未选中';
}

/**
 * 调整字体大小
 */
function adjustFontSize(type, delta) {
    if (type === 'original') {
        polishState.fontSize = Math.max(12, Math.min(32, polishState.fontSize + delta));
        const originalContent = document.getElementById('originalTextContent');
        if (originalContent) originalContent.style.fontSize = polishState.fontSize + 'px';
    } else {
        polishState.resultFontSize = Math.max(12, Math.min(32, polishState.resultFontSize + delta));
        const resultItems = document.querySelectorAll('#polishResult, #polishResult .markdown-content');
        resultItems.forEach(el => el.style.fontSize = polishState.resultFontSize + 'px');
    }
}


/**
 * AI 润色作文
 */
async function polishEssay() {
    if (!polishState.currentEssay || polishState.isPolishing) return;

    const promptInput = document.getElementById('promptInput');
    const userPrompt = promptInput?.value.trim() || '';
    const fullPrompt = CONFIG.buildPolishPrompt(userPrompt, polishState.currentEssay.text);

    try {
        polishState.isPolishing = true;
        document.getElementById('polishBtn').disabled = true;

        showLoading(CONFIG.LOADING_TEXT.AI_POLISHING);

        const resultContainer = document.getElementById('polishResult');
        resultContainer.innerHTML = '<div class="markdown-content">正在唤起 AI 灵感...</div>';

        // SSE 请求
        const response = await fetch(CONFIG.API.AI.FULL_URL, {
            method: 'POST',
            headers: CONFIG.getCommonHeaders(),
            body: JSON.stringify({
                provideName: CONFIG.API.AI.PROVIDER,
                model: CONFIG.API.AI.MODEL,
                messages: [
                    { role: 'system', content: '你是一名资深语文特级教师，擅长通过润色启发学生优化作文表达。' },
                    { role: 'user', content: fullPrompt }
                ]
            })
        });

        hideLoading();
        if (!response.ok) throw new Error(`AI 请求失败: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let polishedText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) {
                            polishedText += content;
                            const html = typeof marked !== 'undefined' ? marked.parse(polishedText) : polishedText;
                            resultContainer.innerHTML = `<div class="markdown-content">${html}</div>`;
                        }
                    } catch (e) { }
                }
            }
        }

        if (polishedText) {
            polishState.currentMarkdown = polishedText;

            // 保存并同步
            showLoading('正在保存润色结果...');
            await db.updateRecord(CONFIG.DATABASE.TABLES.ESSAYS, polishState.currentEssay.id, {
                polished_text: polishedText,
                prompt: userPrompt
            });

            // 重要：同步全量数据并重绘，确保侧边栏也更新（移动到“历程记录”中）
            await syncAllData();

            // 自动选中该记录（此时它已处于 history 标签下，但我们保持当前选中对象引用）
            const updatedEssay = polishState.allRecords.find(r => r.id === polishState.currentEssay.id);
            if (updatedEssay) {
                polishState.currentEssay = updatedEssay;
                updateWorkArea(updatedEssay);
            }

            hideLoading();
            showToast('润色完成！已存入历程记录', 'success');
        }

    } catch (error) {
        console.error('❌ [Polish] 失败:', error);
        hideLoading();
        showToast(error.message, 'error');
    } finally {
        polishState.isPolishing = false;
        if (document.getElementById('polishBtn')) {
            document.getElementById('polishBtn').disabled = !!polishState.currentEssay?.polished_text;
        }
    }
}



// ========== 成长时刻：轮播逻辑 ==========

/**
 * 加载并缓存成长时刻照片
 */
/**
 * 加载并缓存成长时刻照片
 */
async function loadGrowthMomentsWithCache(autoStart = false) {
    try {
        console.log('🖼️ [Slideshow] 检查照片缓存...');

        // 缓存Key
        const CACHE_KEY = 'growth_moments_cache';
        const CACHE_TIME_KEY = 'growth_moments_time';
        const CACHE_DURATION = 60 * 60 * 1000; // 1小时

        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        let records = [];

        // 检查缓存是否有效
        if (cachedData && cachedTime && (now - parseInt(cachedTime) < CACHE_DURATION)) {
            console.log('✅ [Slideshow] 使用本地缓存');
            records = JSON.parse(cachedData);
        } else {
            console.log('🔄 [Slideshow] 缓存过期或不存在，从服务器加载...');
            records = await db.getRecords(CONFIG.DATABASE.TABLES.GROWTH_MOMENTS);

            // 排序：时间倒序
            records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // 写入缓存
            localStorage.setItem(CACHE_KEY, JSON.stringify(records));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            console.log('💾 [Slideshow] 已更新本地缓存');
        }

        slideshowState.photos = records;
        slideshowState.currentIndex = 0;

        if (slideshowState.photos.length > 0) {
            renderPhoto(slideshowState.photos[0]);
            // 后台预加载其余照片
            preloadAllPhotos();

            // 只有当 autoStart 为 true 时才自动开始
            if (autoStart) {
                startSlideshow();
            } else {
                // 否则确保处于停止状态
                stopSlideshow();
            }
        } else {
            document.getElementById('slideshowImage').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📷</div>
                    <p>暂无成长时刻照片</p>
                    <p class="sub-desc">请使用手机端上传照片</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ [Slideshow] 加载失败:', error);
    }
}

/**
 * 手动刷新照片
 */
async function manualRefreshGrowthMoments() {
    stopSlideshow();

    // 1. 清空内存中的图片对象缓存
    slideshowState.cache.clear();

    // 2. 关键修复：清空LocalStorage中的数据缓存，强制重新拉取
    localStorage.removeItem('growth_moments_cache');
    localStorage.removeItem('growth_moments_time');

    showLoading('正在刷新照片并预加载...');
    // Fix: 刷新后不自动播放，等待用户点击开始
    await loadGrowthMomentsWithCache(false);
    hideLoading();
    showToast('照片库已更新，请点击开始播放', 'success');
}

/**
 * 后台预加载所有照片
 */
function preloadAllPhotos() {
    console.log('📦 [Slideshow] 开始全量预加载图片...');
    slideshowState.photos.forEach(photo => {
        const url = photo.image_url;
        if (!slideshowState.cache.has(url)) {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                slideshowState.cache.set(url, img);
            };
        }
    });
}

/**
 * 开始轮播
 */
function startSlideshow() {
    if (slideshowState.isPlaying || slideshowState.photos.length <= 1) return;

    slideshowState.isPlaying = true;
    updateSlideshowControls();

    slideshowState.timer = setInterval(() => {
        displayNextPhoto();
    }, CONFIG.SLIDESHOW.INTERVAL);

    console.log('▶️ [Slideshow] 轮播开始');
}

/**
 * 停止轮播
 */
function stopSlideshow() {
    if (!slideshowState.isPlaying) return;

    slideshowState.isPlaying = false;
    updateSlideshowControls();

    if (slideshowState.timer) {
        clearInterval(slideshowState.timer);
        slideshowState.timer = null;
    }

    console.log('⏸️ [Slideshow] 轮播停止');
}

/**
 * 切换到下一张
 */
function displayNextPhoto() {
    if (slideshowState.photos.length === 0) return;
    slideshowState.currentIndex = (slideshowState.currentIndex + 1) % slideshowState.photos.length;
    renderPhoto(slideshowState.photos[slideshowState.currentIndex]);
}

/**
 * 切换到上一张
 */
function displayPrevPhoto() {
    if (slideshowState.photos.length === 0) return;
    slideshowState.currentIndex = (slideshowState.currentIndex - 1 + slideshowState.photos.length) % slideshowState.photos.length;
    renderPhoto(slideshowState.photos[slideshowState.currentIndex]);
}

/**
 * 渲染照片
 */
function renderPhoto(photo) {
    const container = document.getElementById('slideshowImage');
    if (!container) return;

    const url = photo.image_url;

    // 1. 检查缓存中是否已有加载好的图片
    if (slideshowState.cache.has(url)) {
        console.log('🚀 [Slideshow] 命中缓存，瞬时渲染');
        container.innerHTML = '';
        const imgElement = slideshowState.cache.get(url).cloneNode();
        imgElement.alt = "成长时刻";
        container.appendChild(imgElement);
        // 确保淡入样式生效
        requestAnimationFrame(() => {
            imgElement.classList.add('loaded');
        });
        return;
    }

    // 2. 无缓存则执行原有的加载逻辑
    container.classList.add('loading');
    const img = new Image();
    img.src = url;

    img.onload = () => {
        // 3. 只有完全加载后才替换内容
        container.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.src = url;
        imgElement.alt = "成长时刻";
        container.appendChild(imgElement);
        container.classList.remove('loading');

        // 加入缓存以备下次使用
        slideshowState.cache.set(url, img);

        // 4. 触发 CSS 淡入
        setTimeout(() => {
            imgElement.classList.add('loaded');
        }, 50);
    };

    img.onerror = () => {
        container.classList.remove('loading');
        container.innerHTML = '<div class="empty-state"><p>图片加载失败</p></div>';
    };
}

/**
 * 更新按钮状态
 */
function updateSlideshowControls() {
    const startBtn = document.getElementById('startSlideshowBtn');
    const stopBtn = document.getElementById('stopSlideshowBtn');

    if (startBtn) startBtn.disabled = slideshowState.isPlaying;
    if (stopBtn) stopBtn.disabled = !slideshowState.isPlaying;
}

// ========== 全局弹窗：图片放大 ==========

/**
 * 显示图片放大模态框
 * 
 * @param {string} url - 图片URL
 */
function showImageModal(url) {
    console.log('🔍 [UI] 放大图片:', url);

    // 检查是否已存在模态框，防止重复创建
    let modal = document.querySelector('.image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.onclick = () => modal.remove();
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="image-modal-content">
            <img src="${url}" alt="原图预览">
            <div class="image-modal-close">点击任意位置关闭</div>
        </div>
    `;
}

// 初始化
initScreen();
