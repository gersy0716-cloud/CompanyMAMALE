/**
 * 手机端入口文件 - app-mobile.js
 *
 * 功能：
 * - 初始化手机端各功能模块
 * - 绑定按钮事件
 * - 管理模块间通信
 */

console.log('📱 [App-Mobile] 手机端模块加载');

// ========== 模块状态 ==========

/**
 * 当前作品ID（用于语音提示词关联）
 * @type {string|null}
 */
let currentEssayId = null;

// ========== 初始化 ==========

/**
 * 初始化手机端
 *
 * 业务逻辑：
 * 1. 绑定按钮事件
 * 2. 加载功能模块
 */
function initMobile() {
    console.log('📱 [App-Mobile] 初始化手机端');

    // 绑定成长时刻上传按钮
    const photoUploadBtn = document.getElementById('photoUploadBtn');
    const photoInput = document.getElementById('photoInput');

    if (photoUploadBtn && photoInput) {
        photoUploadBtn.addEventListener('click', () => {
            console.log('📷 点击成长时刻按钮');
            photoInput.click();
        });

        photoInput.addEventListener('change', handlePhotoUpload);
    }

    // 绑定作文上传按钮
    const essayUploadBtn = document.getElementById('essayUploadBtn');
    const essayInput = document.getElementById('essayInput');

    if (essayUploadBtn && essayInput) {
        essayUploadBtn.addEventListener('click', () => {
            console.log('📝 点击作文上传按钮');
            essayInput.click();
        });

        essayInput.addEventListener('change', handleEssayUpload);
    }

    // 绑定语音提示词按钮
    const voicePromptBtn = document.getElementById('voicePromptBtn');
    if (voicePromptBtn) {
        voicePromptBtn.addEventListener('click', handleVoicePrompt);
    }

    console.log('✅ [App-Mobile] 手机端初始化完成');
}

// ========== 成长时刻上传 ==========

/**
 * 处理成长时刻照片上传
 *
 * @param {Event} event - change事件
 */
async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📷 [Photo] 选择文件:', file.name);

    try {
        // 验证文件 (成长时刻超限则静默压缩)
        let fileToUpload = file;
        const maxSize = CONFIG.UPLOAD.MAX_SIZE;

        if (file.size > maxSize) {
            console.log(`📦 [Photo] 文件过大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，启动自动压缩...`);
            showLoading('正在优化图片...');
            fileToUpload = await compressImage(file, maxSize);
            console.log('✅ [Photo] 压缩完成，最终大小:', (fileToUpload.size / 1024).toFixed(2), 'KB');
        } else {
            // 基础类型验证
            const validation = CONFIG.validateFile(file);
            if (!validation.valid && !validation.error.includes('文件过大')) {
                throw new Error(validation.error);
            }
        }

        // 上传照片
        showLoading(CONFIG.LOADING_TEXT.UPLOADING);
        const uploadResult = await uploadFile(fileToUpload);

        console.log('✅ [Photo] 上传成功:', uploadResult.url);

        // 保存到数据库
        // 注意：不发送 upload_time，使用系统自动生成的 created_at 作为上传时间
        await db.createRecord(CONFIG.DATABASE.TABLES.GROWTH_MOMENTS, {
            image_url: uploadResult.url
        });

        hideLoading();
        showToast(CONFIG.SUCCESS_TEXT.PHOTO_UPLOADED, 'success');

    } catch (error) {
        console.error('❌ [Photo] 上传失败:', error);
        hideLoading();
        showToast(error.message || CONFIG.ERROR_TEXT.UPLOAD_FAILED, 'error');
    } finally {
        event.target.value = '';
    }
}

// ========== 作文上传 ==========

/**
 * 处理作文照片上传
 *
 * @param {Event} event - change事件
 */
async function handleEssayUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📝 [Essay] 选择文件:', file.name, '大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    try {
        // 验证文件类型
        if (!CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`不支持的文件类型：${file.type}，仅支持 JPG、PNG 格式`);
        }

        // 自动压缩策略：作文需要较高清晰度，设定目标为 2MB
        let fileToUpload = file;
        const targetSize = 2 * 1024 * 1024; // 2MB

        if (file.size > targetSize) {
            console.log(`📉 [Essay] 文件较大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，进行初步优化以确保识别率...`);
            showLoading('正在优化图片识别率...');
            // 使用较高质量(0.9)进行压缩，确保文字清晰
            fileToUpload = await compressImage(file, targetSize, 0.9, 0.9);
            console.log('✅ [Essay] 优化完成，最终大小:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB');
        } else if (file.size > CONFIG.UPLOAD.MAX_SIZE) {
            // 超过用户设置的 硬限制
            throw new Error(`文件超过服务器限制 (${(CONFIG.UPLOAD.MAX_SIZE / 1024 / 1024).toFixed(0)}MB)`);
        }

        // 上传照片
        showLoading(CONFIG.LOADING_TEXT.UPLOADING);
        const uploadResult = await uploadFile(fileToUpload);

        console.log('✅ [Essay] 上传成功:', uploadResult.url);

        // OCR识别
        showLoading(CONFIG.LOADING_TEXT.OCR_RECOGNIZING);
        const ocrResult = await callOCR(uploadResult.url);

        console.log('✅ [Essay] OCR识别成功');

        // 1. 立即保存初始OCR结果到数据库
        showLoading('正在保存初始结果...');
        console.log('💾 [Essay] 自动保存OCR结果...');

        const record = await db.createRecord(CONFIG.DATABASE.TABLES.ESSAYS, {
            url: uploadResult.url,
            text: ocrResult
        });

        currentEssayId = record.id;
        console.log('✅ [Essay] 初始记录创建成功, ID:', currentEssayId);

        hideLoading();

        // 2. 显示识别结果弹窗供用户修改
        showOCRResultModal(uploadResult.url, ocrResult);

    } catch (error) {
        console.error('❌ [Essay] 处理失败:', error);
        hideLoading();

        let errorMsg = error.message;
        if (errorMsg === 'Load failed') {
            errorMsg = '网络请求失败 (Load failed)，可能是文件过大或接口响应超时，请尝试拍照或上传更小的图片。';
        }

        showToast(errorMsg || CONFIG.ERROR_TEXT.OCR_FAILED, 'error');
    } finally {
        event.target.value = '';
    }
}

/**
 * 显示OCR识别结果弹窗
 *
 * @param {string} imageUrl - 图片URL
 * @param {string} text - 识别的文字
 */
function showOCRResultModal(imageUrl, text) {
    const modal = document.getElementById('ocrResultModal');
    const textArea = document.getElementById('ocrResultText');

    if (modal && textArea) {
        textArea.value = text;
        textArea.disabled = true;
        modal.classList.remove('hidden');

        // 存储临时数据
        modal.dataset.imageUrl = imageUrl;

        // 绑定编辑按钮
        document.getElementById('ocrEditBtn').onclick = () => {
            textArea.disabled = false;
            textArea.focus();
        };

        // 绑定确认按钮 (改为更新逻辑)
        document.getElementById('ocrConfirmBtn').onclick = () => {
            // 更新已存在的记录
            updateEssayRecord(textArea.value);
        };

        // 绑定取消按钮
        document.getElementById('ocrCancelBtn').onclick = async () => {
            // 删除已创建的记录
            if (currentEssayId) {
                try {
                    await db.deleteRecord(CONFIG.DATABASE.TABLES.ESSAYS, currentEssayId);
                    console.log('🗑️ [Essay] 用户取消，已删除记录:', currentEssayId);
                    currentEssayId = null;
                } catch (e) {
                    console.error('❌ [Essay] 删除记录失败:', e);
                }
            }
            modal.classList.add('hidden');
            showToast('已取消', 'warning');
        };
    }
}

/**
 * 更新作文记录 (用户修改OCR结果后)
 *
 * @param {string} text - 修改后的文字
 */
async function updateEssayRecord(text) {
    try {
        if (!currentEssayId) {
            throw new Error('未找到记录ID');
        }

        showLoading('正在更新记录...');
        console.log('✏️ [Essay] 用户修改，正在更新数据库...');

        const result = await db.updateRecord(CONFIG.DATABASE.TABLES.ESSAYS, currentEssayId, {
            text: text
        });

        // 处理Fallback导致的ID变更
        if (result && result.id && result.id !== currentEssayId) {
            currentEssayId = result.id;
        }

        hideLoading();

        // 关闭弹窗
        document.getElementById('ocrResultModal').classList.add('hidden');

        showToast(CONFIG.SUCCESS_TEXT.ESSAY_SAVED, 'success');

        // 启用语音提示词按钮
        const voiceBtn = document.getElementById('voicePromptBtn');
        if (voiceBtn) {
            voiceBtn.disabled = false;
            // 自动滚动到语音提示词区域
            document.getElementById('voicePromptCard')?.scrollIntoView({ behavior: 'smooth' });
            // 轻微震动提示
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(100);
            }
        }

    } catch (error) {
        console.error('❌ [Essay] 更新失败:', error);
        hideLoading();
        showToast('更新失败: ' + error.message, 'error');
    }
}

/**
 */
let voiceState = {
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    startTime: null,
    timerInterval: null
};

/**
 * 处理语音提示词录制
 * 
 * 业务逻辑：
 * 1. 如果当前没有关联的作文，自动获取最新的一篇
 * 2. 如果数据库也没有作文，提示用户先上传
 * 3. 切换录音状态（开始/停止）
 */
async function handleVoicePrompt() {
    // 如果当前没有关联的作文ID
    if (!currentEssayId) {
        try {
            showLoading('正在查找作文...');

            // 从数据库获取最新的作文
            const essays = await db.getRecords(CONFIG.DATABASE.TABLES.ESSAYS);

            hideLoading();

            if (essays.length === 0) {
                // 数据库中没有任何作文
                showToast('请先上传一篇作文，再录制语音提示词', 'warning');
                return;
            }

            // 按创建时间排序，获取最新的一篇
            essays.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            currentEssayId = essays[0].id;

            console.log('📝 [Voice] 自动关联最新作文ID:', currentEssayId);
            showToast('已关联最新作文，开始录音...', 'info');

        } catch (error) {
            hideLoading();
            console.error('❌ [Voice] 获取作文失败:', error);
            showToast('获取作文失败，请稍后重试', 'error');
            return;
        }
    }

    if (voiceState.isRecording) {
        // 正在录音，点击停止
        stopRecording();
    } else {
        // 开始录音
        startRecording();
    }
}


/**
 * 开始录音
 */
async function startRecording() {
    try {
        console.log('🎤 [Voice] 请求麦克风权限');
        console.log('🔍 [Voice] 环境检查:', {
            isSecureContext: window.isSecureContext,
            hasMediaDevices: !!navigator.mediaDevices,
            hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            protocol: window.location.protocol,
            hostname: window.location.hostname
        });

        // 检查浏览器支持
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            let errorMsg = '您的浏览器不支持麦克风访问。';
            if (!window.isSecureContext) {
                errorMsg += ' 检测到当前处于非安全上下文(HTTP)，请使用 HTTPS 协议或 localhost 访问。';
            }
            throw new Error(errorMsg);
        }

        // 重置音频数据
        voiceState.audioChunks = [];

        // 请求麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        console.log('✅ [Voice] 麦克风权限已获取');

        // 创建 MediaRecorder
        voiceState.mediaRecorder = new MediaRecorder(stream);
        voiceState.audioChunks = [];
        voiceState.isRecording = true;
        voiceState.startTime = Date.now();

        // 监听数据
        voiceState.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                voiceState.audioChunks.push(event.data);
            }
        };

        // 监听停止
        voiceState.mediaRecorder.onstop = async () => {
            console.log('🎤 [Voice] 录音停止');
            await processRecording();
        };

        // 开始录音
        voiceState.mediaRecorder.start();

        console.log('🎤 [Voice] 开始录音');

        // 更新按钮状态
        updateVoiceButton(true);

        // 启动计时器（最长60秒）
        startTimer();

    } catch (error) {
        console.error('❌ [Voice] 录音失败:', error);
        showToast('无法访问麦克风，请检查权限设置', 'error');
    }
}

/**
 * 停止录音
 */
function stopRecording() {
    if (voiceState.mediaRecorder && voiceState.isRecording) {
        voiceState.mediaRecorder.stop();
        voiceState.isRecording = false;

        // 停止所有音轨
        voiceState.mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // 停止计时器
        if (voiceState.timerInterval) {
            clearInterval(voiceState.timerInterval);
            voiceState.timerInterval = null;
        }

        // 更新按钮状态
        updateVoiceButton(false);
    }
}

/**
 * 启动计时器
 */
function startTimer() {
    const maxDuration = CONFIG.VOICE_RECORDING.MAX_DURATION * 1000; // 60秒

    voiceState.timerInterval = setInterval(() => {
        const elapsed = Date.now() - voiceState.startTime;

        // 更新按钮文字显示倒计时
        const remaining = Math.ceil((maxDuration - elapsed) / 1000);
        const btn = document.getElementById('voicePromptBtn');
        if (btn) {
            btn.textContent = `⏹️ 停止录音 (${remaining}s)`;
        }

        // 达到最大时长，自动停止
        if (elapsed >= maxDuration) {
            console.log('⏱️ [Voice] 达到最大录音时长');
            stopRecording();
        }
    }, 100);
}

/**
 * 更新语音按钮状态
 *
 * @param {boolean} isRecording - 是否正在录音
 */
function updateVoiceButton(isRecording) {
    const btn = document.getElementById('voicePromptBtn');
    if (!btn) return;

    if (isRecording) {
        btn.textContent = '⏹️ 停止录音 (60s)';
        btn.classList.add('recording');
        document.getElementById('recordingWaveform')?.classList.remove('hidden');
    } else {
        btn.textContent = '🎤 语音提示词';
        btn.classList.remove('recording');
        document.getElementById('recordingWaveform')?.classList.add('hidden');
    }
}

/**
 * 处理录音数据
 */
async function processRecording() {
    try {
        console.log('🎤 [Voice] 处理录音数据');

        // 合并音频数据
        const audioBlob = new Blob(voiceState.audioChunks, { type: 'audio/wav' });

        console.log('📦 [Voice] 音频大小:', (audioBlob.size / 1024).toFixed(2), 'KB');

        // 上传音频文件
        showLoading(CONFIG.LOADING_TEXT.UPLOADING);
        const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
        const uploadResult = await uploadFile(audioFile);

        console.log('✅ [Voice] 音频上传成功:', uploadResult.url);

        // 调用语音转文字API
        showLoading(CONFIG.LOADING_TEXT.VOICE_CONVERTING);
        const text = await callVoiceToText(uploadResult.url);

        console.log('✅ [Voice] 语音转文字成功');

        // 1. 立即保存初始识别结果
        showLoading('正在保存初始提示词...');
        await performVoiceUpdate(text);

        hideLoading();

        // 2. 显示转换结果弹窗供用户修改
        showVoiceResultModal(text);

    } catch (error) {
        console.error('❌ [Voice] 处理失败:', error);
        hideLoading();
        showToast(error.message || CONFIG.ERROR_TEXT.VOICE_FAILED, 'error');
    }
}

/**
 * 显示语音转文字结果弹窗
 *
 * @param {string} text - 转换的文字
 */
function showVoiceResultModal(text) {
    const modal = document.getElementById('voiceResultModal');
    const textArea = document.getElementById('voiceResultText');

    if (modal && textArea) {
        textArea.value = text;
        textArea.disabled = true;
        modal.classList.remove('hidden');

        // 绑定编辑按钮
        document.getElementById('voiceEditBtn').onclick = () => {
            textArea.disabled = false;
            textArea.focus();
        };

        // 绑定确认按钮
        document.getElementById('voiceConfirmBtn').onclick = () => {
            saveVoicePrompt(textArea.value);
        };

        // 绑定取消按钮
        document.getElementById('voiceCancelBtn').onclick = () => {
            modal.classList.add('hidden');
            showToast('已取消', 'warning');
        };
    }
}

/**
 * 执行语音提示词更新 (核心逻辑)
 * @param {string} prompt 
 */
async function performVoiceUpdate(prompt) {
    if (!currentEssayId) {
        throw new Error('未找到关联的作文ID');
    }

    console.log('💾 [Voice] 更新数据库 prompt, ID:', currentEssayId);

    const result = await db.updateRecord(CONFIG.DATABASE.TABLES.ESSAYS, currentEssayId, {
        prompt: prompt
    });

    // ID同步
    if (result && result.id && result.id !== currentEssayId) {
        console.warn('⚠️ [Voice] ID变更:', currentEssayId, '->', result.id);
        currentEssayId = result.id;
    }
    return result;
}

/**
 * 保存语音提示词 (用户确认后)
 *
 * @param {string} prompt - 提示词内容
 */
async function saveVoicePrompt(prompt) {
    try {
        showLoading('正在保存提示词...');

        await performVoiceUpdate(prompt);

        hideLoading();

        // 关闭弹窗
        document.getElementById('voiceResultModal').classList.add('hidden');

        showToast(CONFIG.SUCCESS_TEXT.PROMPT_SAVED, 'success');

        console.log('✅ [Voice] 提示词最终保存成功, ID:', currentEssayId);

    } catch (error) {
        console.error('❌ [Voice] 保存失败:', error);
        hideLoading();
        showToast('保存失败: ' + error.message, 'error');
    }
}

/**
 * 调用语音转文字API
 *
 * @param {string} audioUrl - 音频URL
 * @returns {Promise<string>} 转换的文字
 */
async function callVoiceToText(audioUrl) {
    const url = CONFIG.API.VOICE.FULL_URL;
    console.log('📡 [Voice] 调用转换API:', url);

    if (typeof CONFIG.getCommonHeaders !== 'function') {
        throw new Error('CONFIG.getCommonHeaders is not a function');
    }

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: CONFIG.getCommonHeaders(),
            body: JSON.stringify({
                content: audioUrl
            })
        });
    } catch (networkError) {
        console.error('❌ [Voice] 网络请求失败 (可能原因: CORS跨域/证书问题/网络断开):', networkError);
        throw new Error('网络连接失败，请检查网络或HTTPS证书是否已信任');
    }

    if (!response.ok) {
        let errorText = '';
        try {
            errorText = await response.text();
        } catch (e) {
            errorText = '无法读取错误响应';
        }
        console.error('❌ [Voice] API错误响应:', errorText);
        throw new Error(`语音转文字失败 (${response.status}): ${errorText.substring(0, 100)}`);
    }

    let rawText = '';
    try {
        rawText = await response.text();
        const result = JSON.parse(rawText);
        return result.content || '';
    } catch (parseError) {
        console.error('❌ [Voice] JSON解析失败:', parseError);
        console.error('❌ [Voice] 原始响应内容:', rawText.substring(0, 200));
        throw new Error('API返回格式错误，无法解析');
    }
}

// ========== 工具函数 ==========

/**
 * 上传文件到服务器
 *
 * @param {File} file - 文件对象
 * @returns {Promise<object>} 上传结果
 */
async function uploadFile(file) {
    const formData = new FormData();
    formData.append(CONFIG.UPLOAD.FORM_FIELD_NAME, file);

    console.log('📡 [Upload] 开始上传:', file.name, (file.size / 1024).toFixed(2), 'KB');

    // 设置 60 秒超时（上传可能较慢）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(CONFIG.UPLOAD.FULL_URL, {
            method: 'POST',
            headers: CONFIG.getUploadHeaders(),
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [Upload] 接口返回错误:', response.status, errorText);
            throw new Error(`上传失败: HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.url) {
            console.error('❌ [Upload] 返回数据无URL:', result);
            throw new Error('服务器返回数据格式错误');
        }

        return result;

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('❌ [Upload] 上传超时');
            throw new Error('文件上传超时，网络环境可能不稳定，请尝试再次操作。');
        }
        console.error('❌ [Upload] Fetch错误:', error);
        throw error;
    }
}

/**
 * 调用OCR接口
 *
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<string>} 识别的文字
 */
async function callOCR(imageUrl) {
    console.log('📡 [OCR] 开始识别:', imageUrl);

    // 设置 30 秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(CONFIG.API.OCR.FULL_URL, {
            method: 'POST',
            headers: CONFIG.getCommonHeaders(),
            body: JSON.stringify({
                url: imageUrl,
                isToHtml: false
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [OCR] 接口返回错误:', response.status, errorText);
            throw new Error(`OCR识别失败: HTTP ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ [OCR] 接口响应成功');
        return result.markdown || result.text || '';

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('❌ [OCR] 请求超时');
            throw new Error('OCR识别超时，图片可能过大或网络响应缓慢，请尝试选择更小的图片或重试。');
        }
        console.error('❌ [OCR] Fetch错误:', error);
        throw error;
    }
}

/**
 * 递归压缩图片直到满足大小限制
 * 
 * @param {File} file - 原始文件
 * @param {number} maxSize - 最大字节数
 * @param {number} quality - 当前压缩质量 (0.1 - 1.0)
 * @param {number} scale - 当前缩放比例 (0.1 - 1.0)
 * @returns {Promise<File>} 压缩后的文件
 */
async function compressImage(file, maxSize, quality = 0.9, scale = 0.9) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const width = img.width * scale;
                const height = img.height * scale;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        reject(new Error('图片压缩失败'));
                        return;
                    }

                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });

                    // 如果压缩后还是太大，递归继续压缩（每次缩小比例和质量）
                    if (compressedFile.size > maxSize && (scale > 0.3 || quality > 0.3)) {
                        console.log(`📉 [Compress] 依然过大 (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)，继续压缩...`);
                        const nextScale = scale > 0.5 ? scale * 0.9 : scale; // 进一步缩放
                        const nextQuality = quality > 0.5 ? quality * 0.9 : quality; // 进一步降低质量
                        resolve(await compressImage(file, maxSize, nextQuality, nextScale));
                    } else {
                        resolve(compressedFile);
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// 初始化
initMobile();
