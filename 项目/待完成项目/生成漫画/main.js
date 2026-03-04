/**
 * AI 漫画生成器 - 核心逻辑 (生产环境联调版)
 * 集成 ai-comic-factory 分镜逻辑 + 码码乐 API (DeepSeek & 即梦)
 */

const config = {
    // 固化的 API 基础路径
    apiBase: "https://3w-api.mamale.vip/api/app",

    getApiUrl(path) {
        return `${this.apiBase}/${path}`;
    },

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            // 内嵌默认租户标头，确保在无 URL 参数时依然能通过后端校验
            '__tenant': 'c1863285-25d1-44fe-805c-5ddf611f83d3'
        };
    }
};

const PRESETS = {
    japanese_manga: {
        id: "japanese_manga",
        label: "日漫风",
        llmPrompt: "japanese manga",
        imagePrompt: (p) => ["grayscale", "detailed drawing", "japanese manga", p],
    },
    american_comic_90: {
        id: "american_comic_90",
        label: "现代美漫",
        llmPrompt: "american comic",
        imagePrompt: (p) => ["digital color comicbook style", "modern american comic", p, "detailed drawing"],
    },
    franco_belgian: {
        id: "franco_belgian",
        label: "法漫风",
        llmPrompt: "Franco-Belgian comic (bande dessinée), in the style of Moebius",
        imagePrompt: (p) => ["bande dessinée", "franco-belgian comic", p, "detailed drawing"],
    },
    nihonga: {
        id: "nihonga",
        label: "浮世绘",
        llmPrompt: "japanese nihonga painting",
        imagePrompt: (p) => [`japanese nihonga painting about ${p}`, "ancient japanese painting", "intricate"],
    },
    pixel: {
        id: "pixel",
        label: "像素风",
        llmPrompt: "pixel art story",
        imagePrompt: (p) => ["pixelart", "isometric", "low res", p],
    },
    medieval: {
        id: "medieval",
        label: "中世纪插画",
        llmPrompt: "medieval illuminated manuscript style",
        imagePrompt: (p) => ["medieval illuminated manuscript", p, "intricate details"],
    },
    render_3d: {
        id: "render_3d",
        label: "3D 渲染",
        llmPrompt: "3D animated movie style (Pixar like)",
        imagePrompt: (p) => ["3D render animation", "Pixar style", "cute", "Unreal engine", p],
    }
};

const state = {
    currentPreset: PRESETS.japanese_manga,
    isGenerating: false,
    panels: []
};

function init() {
    renderPresets();
    setupEventListeners();
}

function renderPresets() {
    const container = document.getElementById('stylePresets');
    Object.values(PRESETS).forEach(preset => {
        const chip = document.createElement('div');
        chip.className = `chip ${state.currentPreset.id === preset.id ? 'active' : ''}`;
        chip.textContent = preset.label;
        chip.onclick = () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.currentPreset = preset;
        };
        container.appendChild(chip);
    });
}

function setupEventListeners() {
    document.getElementById('generateBtn').onclick = startGeneration;
}

async function startGeneration() {
    const prompt = document.getElementById('promptInput').value.trim();
    if (!prompt || state.isGenerating) return;

    state.isGenerating = true;
    showStatus(true, "与码码乐 AI 通讯中...");

    try {
        const storyData = await predictPanels(prompt);
        renderComicSkeleton(storyData);

        showStatus(true, "分镜构思完毕，正在绘制图中...");
        await drawPanels(storyData);

        showStatus(false);
    } catch (error) {
        console.error("生成流程中断:", error);

        let errorMsg = "生成失败: " + error.message;
        if (error.message.includes("fetch") || error.message.includes("CORS")) {
            errorMsg = "🛑 跨域拦截 (CORS 错误)\n\n由于是在本地运行，浏览器拒绝了 API 请求。\n请确保：\n1. 已开启 'Allow CORS' 插件并激活为 ON。\n2. 访问链接包含 ?type=3w 参数。\n3. 服务器正常开启。";
        }

        alert(errorMsg);
        showStatus(false);
    } finally {
        state.isGenerating = false;
    }
}

async function predictPanels(userPrompt) {
    const systemPrompt = `You are a writer specialized in ${state.currentPreset.llmPrompt}.
Please write 4 panels for a new story based on the user prompt.
Give your response as a VALID JSON array like this: Array<{ panel: number; instructions: string; speech: string; caption: string; }>.
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
            stream: false // 尽管设置为 false，部分代理层仍可能返回 SSE 格式
        })
    });

    if (!response.ok) {
        throw new Error(`远程 API 返回状态 ${response.status}`);
    }

    const text = await response.text();
    if (!text.trim()) {
        throw new Error("API 返回了空内容，请检查网络连接或 API 状态。");
    }

    // 健壮性处理：处理可能出现的 SSE 流式格式数据 (data: {JSON}...)
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
                    // 兼容 OpenAI 消息格式、百度/阿里等其他格式
                    const part = parsed.choices?.[0]?.delta?.content ||
                        parsed.choices?.[0]?.message?.content ||
                        parsed.result ||
                        parsed.content ||
                        "";
                    rawContent += part;
                } catch (e) { }
            }
        }
    }

    // 如果 SSE 解析后依然为空，或者根本不是 SSE，则尝试直接解析原文本
    if (!rawContent.trim()) {
        try {
            const data = JSON.parse(text);
            rawContent = data.choices?.[0]?.message?.content ||
                data.result ||
                data.content ||
                text;
        } catch (e) {
            rawContent = text;
        }
    }

    // 提取并解析 JSON 内容
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
        // 备选方案：尝试正则匹配提取第一个数组
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

function renderComicSkeleton(panels) {
    const grid = document.getElementById('comicGrid');
    grid.innerHTML = '';

    panels.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'card panel-card';
        card.id = `panel-${idx}`;
        card.innerHTML = `
            <div class="panel-image-container" style="position: relative; aspect-ratio: 1; background: #e2e8f0; border-radius: 12px 12px 0 0; overflow: hidden;">
                <div class="panel-loader" style="position: absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#64748b; background: rgba(255,255,255,0.5); font-size: 0.9rem;">🎨 绘制中...</div>
                <img class="panel-image hidden" src="" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="panel-content" style="padding: 1.25rem;">
                <p class="panel-caption" style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem; line-height: 1.4;">${p.caption || ''}</p>
                <div class="panel-speech" style="font-weight: 700; color: #1e293b; font-size: 1rem;">“${p.speech || ''}”</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function drawPanels(panels) {
    const apiUrl = config.getApiUrl('aiJimeng3/myTextToImage');
    const drawTasks = panels.map(async (p, idx) => {
        const fullPrompt = state.currentPreset.imagePrompt(p.instructions).join(", ");

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: config.getHeaders(),
                body: JSON.stringify({
                    prompt: fullPrompt,
                    size: "1024*1024"
                })
            });

            if (!response.ok) throw new Error(`生图 API 错误: ${response.status}`);

            const result = await response.json();
            const imageUrl = result.data?.[0]?.url || result.url || result.result;

            if (imageUrl) {
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
            loader.textContent = "绘制失败";
        }
    });

    await Promise.all(drawTasks);
}

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
