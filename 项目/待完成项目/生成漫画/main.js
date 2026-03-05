/**
 * AI 漫画生成器 - 核心逻辑 v2
 * 基于 ai-comic-factory 预设体系 + 码码乐 API (DeepSeek & 即梦)
 */

// ─── 配置 ──────────────────────────────────────────────
const AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI2NzU5NzMsImV4cCI6MTgwNDIxMTk3MywiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiMTM5ZGNhMzktNDcwYi0yYjAwLWZkMGEtM2ExNjg5NmUwYTE4IiwiYXV0aF90aW1lIjoxNzcyNjc1OTcyLCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6ImxpY2tpZXNAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJGYWxzZSIsIm5hbWUiOiJsaWNraWVzIiwiaWF0IjoxNzcyNjc1OTczLCJzY29wZSI6WyJhZGRyZXNzIiwiQ29kZUFCQyIsImVtYWlsIiwib3BlbmlkIiwicGhvbmUiLCJwcm9maWxlIiwicm9sZSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.sdvH0tAiTEg-NvRt_q0fgKNvul2bTA-e_kZ2e859VnQJRcG20l6DhlHKBMGwJErpFqynZj-JOwZKoqBhQdLsSd8zMQVmbqx7VqWBKelZEAQ9Pii1RE1WuKC1OpOlZhOpN8v5UZprhwEQmd_K_ssMI6TATi4ir7zX8lgEd_ATmce9a0CnlvD1p6OAUMdjefaHn6fnkZRWcwRzRJB1_wIuTs28u9lGbs7Z2MIQ50bqqH3XXIIEEDOjiqgZMgzw9QSHzFsMnUJ7BupoHM6kxCUhOLfWjmfsN62XwPcTqYAal8zSki-byJkoAkTd-s_LHL7872QCPTivgpFV8QUOGu8nbg";

const config = {
    apiBase: "https://3w-api.mamale.vip/api/app",
    tenant: "c1863285-25d1-44fe-805c-5ddf611f83d3",

    getApiUrl(path) {
        const sep = path.includes('?') ? '&' : '?';
        return `${this.apiBase}/${path}${sep}__tenant=${this.tenant}`;
    },

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`,
        };
    }
};

// ─── 数据库配置 ────────────────────────────────────────────
const dbConfig = {
    apiBase: "https://data.520ai.cc/api/bases",
    baseId: "bsekddalnVrgIAiZYmM",
    tableId: "gaHY0ruUUs",

    getRecordsUrl() {
        return `${this.apiBase}/${this.baseId}/tables/${this.tableId}/records`;
    },

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-bm-token': AUTH_TOKEN,
        };
    }
};

// ─── 生图引擎 ──────────────────────────────────────────
const IMAGE_ENGINES = {
    jimeng: {
        id: "jimeng",
        label: "即梦 AI",
        icon: "🎨",
        apiPath: "aiJimeng3/myTextToImage",
        buildBody: (prompt) => ({
            prompt: prompt,
            size: "1024*1024"
        }),
        parseResult: (result) => result.data?.[0]?.url || result.url || result.result,
    },
    chatgptten: {
        id: "chatgptten",
        label: "Chatgptten",
        icon: "🤖",
        apiPath: "aiChatgptten/myTextToImage",
        buildBody: (prompt) => ({
            prompt: prompt,
            model: "nano-banana-2-hd",
            size: "1024*1024"
        }),
        parseResult: (result) => result.data?.[0]?.url || result.url || result.result,
    }
};

// ─── 画风预设体系 (移植自 ai-comic-factory) ────────────
const PRESETS = {
    // ── 随机 ──
    random: {
        id: "random", label: "🎲 随机风格", family: "special", color: "color",
        llmPrompt: "",
        imagePrompt: (p) => [],
        negativePrompt: () => [],
    },
    // ── 亚洲 ──
    japanese_manga: {
        id: "japanese_manga", label: "日式漫画", family: "asian", color: "grayscale",
        llmPrompt: "japanese manga",
        imagePrompt: (p) => ["grayscale", "detailed drawing", "japanese manga", p],
        negativePrompt: () => ["franco-belgian comic", "color album", "color", "american comic", "photo", "painting", "3D render"],
    },
    nihonga: {
        id: "nihonga", label: "日本画", family: "asian", color: "color",
        llmPrompt: "japanese manga",
        imagePrompt: (p) => [`japanese nihonga painting about ${p}`, "Nihonga", "ancient japanese painting", "intricate", "detailed", "detailed painting"],
        negativePrompt: () => ["franco-belgian comic", "color album", "manga", "comic", "american comic", "photo", "painting", "3D render"],
    },
    // ── 美式 ──
    neutral: {
        id: "neutral", label: "自然 (无风格)", family: "american", color: "color",
        llmPrompt: "",
        imagePrompt: (p) => [p],
        negativePrompt: () => [],
    },
    american_comic_90: {
        id: "american_comic_90", label: "现代美漫", family: "american", color: "color",
        llmPrompt: "american comic",
        imagePrompt: (p) => ["digital color comicbook style", "modern american comic", p, "detailed drawing"],
        negativePrompt: () => ["manga", "anime", "grayscale", "monochrome", "photo", "painting", "3D render"],
    },
    american_comic_50: {
        id: "american_comic_50", label: "复古美漫", family: "american", color: "color",
        llmPrompt: "american comic",
        imagePrompt: (p) => ["1950", "50s", "vintage american color comic", p, "detailed drawing"],
        negativePrompt: () => ["manga", "anime", "grayscale", "monochrome", "photo", "painting", "3D render"],
    },
    // ── 欧洲 ──
    franco_belgian: {
        id: "franco_belgian", label: "法比漫", family: "european", color: "color",
        llmPrompt: "Franco-Belgian comic (bande dessinée), in the style of Franquin, Moebius",
        imagePrompt: (p) => ["bande dessinée", "franco-belgian comic", p, "comic album", "detailed drawing"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "photo", "painting", "3D render"],
    },
    flying_saucer: {
        id: "flying_saucer", label: "经典科幻", family: "european", color: "color",
        llmPrompt: "new pulp science fiction",
        imagePrompt: (p) => ["vintage science fiction", "color pulp comic panel", "1940", p, "detailed drawing"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "photo", "painting", "3D render"],
    },
    humanoid: {
        id: "humanoid", label: "人形生物", family: "european", color: "color",
        llmPrompt: "comic books by Moebius",
        imagePrompt: (p) => ["color comic panel", "style of Moebius", p, "detailed drawing", "french comic panel", "franco-belgian style", "bande dessinée", "single panel"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "photo", "painting", "3D render"],
    },
    haddock: {
        id: "haddock", label: "哈多克", family: "european", color: "color",
        llmPrompt: "writing Tintin comic books",
        imagePrompt: (p) => ["color comic panel", "style of Hergé", "tintin style", p, "by Hergé", "french comic panel", "franco-belgian style"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "photo", "painting", "3D render"],
    },
    armorican: {
        id: "armorican", label: "阿莫里卡 (高卢英雄)", family: "european", color: "monochrome",
        llmPrompt: "french style comic books set in ancient Rome and Gaul",
        imagePrompt: (p) => ["color comic panel", "romans", "gauls", "french comic panel", "franco-belgian style", `about ${p}`, "bande dessinée", "single panel"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "photo", "painting", "3D render"],
    },
    render: {
        id: "render", label: "3D 渲染", family: "european", color: "color",
        llmPrompt: "new movie",
        imagePrompt: (p) => ["3D render animation", "Pixar", "cute", "funny", "Unreal engine", p, "crisp", "sharp"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "painting"],
    },
    klimt: {
        id: "klimt", label: "克里姆特", family: "european", color: "color",
        llmPrompt: "Gustav Klimt art pieces",
        imagePrompt: (p) => ["golden", "patchwork", "style of Gustav Klimt", "Gustav Klimt painting", p, "detailed painting", "intricate details"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "painting"],
    },
    medieval: {
        id: "medieval", label: "中世纪插画", family: "european", color: "color",
        llmPrompt: "medieval story (write in this style)",
        imagePrompt: (p) => ["medieval illuminated manuscript", "illuminated manuscript of", "medieval", p, "intricate details"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "painting"],
    },
    egyptian: {
        id: "egyptian", label: "古埃及壁画", family: "european", color: "color",
        llmPrompt: "ancient egyptian stories",
        imagePrompt: (p) => ["ancient egyptian wall painting", "ancient egypt", p],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "painting"],
    },
    photonovel: {
        id: "photonovel", label: "复古相片小说", family: "european", color: "color",
        llmPrompt: "new movie",
        imagePrompt: (p) => ["vintage photo", "1950", "1960", "french new wave", "faded colors", "color movie screencap", p],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "painting"],
    },
    stockphoto: {
        id: "stockphoto", label: "写实摄影", family: "european", color: "color",
        llmPrompt: "new movie",
        imagePrompt: (p) => ["cinematic", "hyperrealistic", "footage", "sharp 8k", "analog", "instagram", "photoshoot", p, "crisp details"],
        negativePrompt: () => ["manga", "anime", "american comic", "grayscale", "monochrome", "painting"],
    },
};

// 预设分组（按区域）
const PRESET_GROUPS = {
    "🌸 亚洲": Object.values(PRESETS).filter(p => p.family === "asian"),
    "🦅 美式": Object.values(PRESETS).filter(p => p.family === "american"),
    "🏰 欧洲": Object.values(PRESETS).filter(p => p.family === "european"),
};

// ─── 应用状态 ──────────────────────────────────────────
const state = {
    currentPreset: PRESETS.japanese_manga,
    currentEngine: IMAGE_ENGINES.jimeng,
    isGenerating: false,
    panels: [],
};

// ─── 初始化 ────────────────────────────────────────────
function init() {
    renderPresets();
    setupEventListeners();
}

function renderPresets() {
    const container = document.getElementById('stylePresets');
    container.innerHTML = '';

    // 先添加"随机"
    const randomChip = createChip(PRESETS.random);
    container.appendChild(randomChip);

    // 分组渲染
    for (const [groupName, presets] of Object.entries(PRESET_GROUPS)) {
        const separator = document.createElement('div');
        separator.className = 'chip-group-label';
        separator.textContent = groupName;
        container.appendChild(separator);

        presets.forEach(preset => {
            container.appendChild(createChip(preset));
        });
    }
}

function createChip(preset) {
    const chip = document.createElement('div');
    chip.className = `chip ${state.currentPreset.id === preset.id ? 'active' : ''}`;
    chip.textContent = preset.label;
    chip.onclick = () => {
        document.querySelectorAll('#stylePresets .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.currentPreset = preset;
    };
    return chip;
}

// 生图引擎按优先级排序：即梦 > Chatgptten，默认使用第一个
const ENGINE_PRIORITY = [IMAGE_ENGINES.jimeng, IMAGE_ENGINES.chatgptten];

function setupEventListeners() {
    document.getElementById('generateBtn').onclick = startGeneration;
}

// ─── 生成流程 ──────────────────────────────────────────
async function startGeneration() {
    const prompt = document.getElementById('promptInput').value.trim();
    if (!prompt || state.isGenerating) return;

    state.isGenerating = true;
    showStatus(true, "与码码乐 AI 通讯中...");

    // 处理"随机风格"
    let activePreset = state.currentPreset;
    if (activePreset.id === "random") {
        const allKeys = Object.keys(PRESETS).filter(k => k !== "random");
        const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
        activePreset = PRESETS[randomKey];
    }

    try {
        const storyData = await predictPanels(prompt, activePreset);
        renderComicSkeleton(storyData);

        // 保存分镜到数据库
        const dbRecordId = await saveToDb(prompt, activePreset.id, storyData);

        showStatus(true, `分镜构思完毕，正在用即梦 AI 绘制...`);
        const imageUrls = await drawPanels(storyData, activePreset);

        // 更新数据库：写入图片 URL 和状态
        await updateDbRecord(dbRecordId, imageUrls);

        showStatus(false);
    } catch (error) {
        console.error("生成流程中断:", error);

        let errorMsg = "生成失败: " + error.message;
        if (error.message.includes("fetch") || error.message.includes("CORS")) {
            errorMsg = "🛑 跨域拦截 (CORS 错误)\n\n由于是在本地运行，浏览器拒绝了 API 请求。\n请确保：\n1. 已开启 'Allow CORS' 插件并激活为 ON。\n2. 服务器正常开启。";
        }

        alert(errorMsg);
        showStatus(false);
    } finally {
        state.isGenerating = false;
    }
}

// ─── DeepSeek 分镜生成 ────────────────────────────────
async function predictPanels(userPrompt, preset) {
    const styleHint = preset.llmPrompt ? `specialized in ${preset.llmPrompt}` : "";
    const systemPrompt = `You are a writer ${styleHint}.
Please write 4 panels for a new story based on the user prompt.
Give your response as a VALID JSON array like this: Array<{ panel: number; instructions: string; speech: string; caption: string; }>.
The "instructions" field should be a detailed description in English for image generation.
Only return the JSON array, no other text. Write Chinese for speech and captions.`;

    const apiUrl = config.getApiUrl('zjAi/myUnifiedOpenAiStream');

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: config.getHeaders(),
        body: JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `核心故事: ${userPrompt}` }
            ],
            model: "DeepSeek-V3",
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`远程 API 返回状态 ${response.status}`);
    }

    const text = await response.text();
    if (!text.trim()) {
        throw new Error("API 返回了空内容，请检查网络连接或 API 状态。");
    }

    // 健壮性处理：SSE 流式格式
    let rawContent = "";
    if (text.includes('data: ')) {
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const jsonPart = trimmed.replace('data: ', '').trim();
                if (jsonPart === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(jsonPart);
                    const part = parsed.choices?.[0]?.delta?.content ||
                        parsed.choices?.[0]?.message?.content ||
                        parsed.result || parsed.content || "";
                    rawContent += part;
                } catch (e) { }
            }
        }
    }

    if (!rawContent.trim()) {
        try {
            const data = JSON.parse(text);
            rawContent = data.choices?.[0]?.message?.content ||
                data.result || data.content || text;
        } catch (e) {
            rawContent = text;
        }
    }

    return parsePanelJson(rawContent);
}

/**
 * 从混合文本中提取并解析 JSON 数组
 */
function parsePanelJson(text) {
    let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleanText);
    } catch (e) {
        const match = cleanText.match(/\[[\s\S]*\]/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (innerE) { }
        }
        const sample = cleanText ? cleanText.slice(0, 100) : "空内容";
        throw new Error("模型输出内容解析失败。内容预览: " + sample);
    }
}

// ─── UI 渲染 ──────────────────────────────────────────
function renderComicSkeleton(panels) {
    const grid = document.getElementById('comicGrid');
    grid.innerHTML = '';

    panels.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'panel-card';
        card.id = `panel-${idx}`;
        card.innerHTML = `
            <div class="panel-image-container">
                <div class="panel-loader" style="position: absolute; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.8); color: #64748b; font-size: 0.9rem;">🎨 绘制中...</div>
                <img class="panel-image hidden" src="">
            </div>
            <div class="panel-content">
                <p class="panel-caption">${p.caption || ''}</p>
                <div class="panel-speech">"${p.speech || ''}"</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ─── 图片生成 (支持多引擎) ─────────────────────────────
async function drawPanels(panels, preset) {
    const engine = state.currentEngine;
    const apiUrl = config.getApiUrl(engine.apiPath);
    const imageUrls = new Array(panels.length).fill(null);

    const drawTasks = panels.map(async (p, idx) => {
        const positiveTokens = preset.imagePrompt(p.instructions);
        const fullPrompt = positiveTokens.join(", ");

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: config.getHeaders(),
                body: JSON.stringify(engine.buildBody(fullPrompt))
            });

            if (!response.ok) throw new Error(`生图 API 错误: ${response.status}`);

            const result = await response.json();
            const imageUrl = engine.parseResult(result);

            if (imageUrl) {
                imageUrls[idx] = imageUrl;
                const img = document.querySelector(`#panel-${idx} .panel-image`);
                const loader = document.querySelector(`#panel-${idx} .panel-loader`);
                img.src = imageUrl;
                img.onload = () => {
                    img.classList.remove('hidden');
                    loader.classList.add('hidden');
                };
            }
        } catch (err) {
            console.error(`绘制分镜 ${idx} 失败:`, err);
            const loader = document.querySelector(`#panel-${idx} .panel-loader`);
            if (loader) loader.textContent = "绘制失败";
        }
    });

    await Promise.all(drawTasks);
    return imageUrls;
}

// ─── 数据库操作 ────────────────────────────────────────
async function saveToDb(prompt, styleId, panelsData) {
    if (!dbConfig.token) {
        console.warn("数据库 token 未配置，跳过保存");
        return null;
    }

    try {
        const response = await fetch(dbConfig.getRecordsUrl(), {
            method: 'POST',
            headers: dbConfig.getHeaders(),
            body: JSON.stringify({
                name: prompt.slice(0, 50),
                tenantid: config.tenant,
                prompt: prompt,
                style: styleId,
                panels_json: JSON.stringify(panelsData),
                panel_images: "[]",
                status: "生成中",
            })
        });

        if (!response.ok) {
            console.error("数据库保存失败:", response.status);
            return null;
        }

        const result = await response.json();
        console.log("分镜已保存到数据库, ID:", result.id);
        return result.id;
    } catch (err) {
        console.error("数据库保存异常:", err);
        return null;
    }
}

async function updateDbRecord(recordId, imageUrls) {
    if (!recordId || !dbConfig.token) return;

    try {
        const url = `${dbConfig.getRecordsUrl()}/${recordId}`;
        const hasImages = imageUrls.some(u => u !== null);

        await fetch(url, {
            method: 'PATCH',
            headers: dbConfig.getHeaders(),
            body: JSON.stringify({
                panel_images: JSON.stringify(imageUrls.filter(Boolean)),
                status: hasImages ? "已完成" : "失败",
            })
        });

        console.log("数据库记录已更新, ID:", recordId);
    } catch (err) {
        console.error("数据库更新异常:", err);
    }
}

// ─── 状态控制 ──────────────────────────────────────────
function showStatus(show, text) {
    const overlay = document.getElementById('statusArea');
    const statusText = document.getElementById('statusText');
    if (show) {
        overlay.classList.remove('hidden');
        statusText.textContent = text;
    } else {
        overlay.classList.add('hidden');
    }
}

init();
