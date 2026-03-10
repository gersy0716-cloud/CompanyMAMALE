import { STYLE_PRESETS } from './styles'

export interface AIPPTStructure {
    title: string
    content: string
    bg_image_prompt: string
}

// Reuse the token from predictWithMamale.ts and getRandomInspiration.ts
const apiUrl = "https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream"
const tenant = "c1863285-25d1-44fe-805c-5ddf611f83d3"
const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODUsImV4cCI6MTgwNDI5NjE4NSwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiMTM5ZGNhMzktNDcwYi0yYjAwLWZkMGEtM2ExNjg5NmUwYTE4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg0LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6ImxpY2tpZXNAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJGYWxzZSIsIm5hbWUiOiJsaWNraWVzIiwiaWF0IjoxNzcyNzYwMTg1LCJzY29wZSI6WyJhZGRyZXNzIiwiQ29kZUFCQyIsImVtYWlsIiwib3BlbmlkIiwicGhvbmUiLCJwcm9maWxlIiwicm9sZSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.rLKKF6SlZ7KrnF_0qszH07ZJphbHw2J-Vh1NFIA5qxpODh7xiGakUo6OLRwqVbCHwqLLLLs5iNrlMfpdgZ81BJehoTK4OnZHgImn354cPzpREjocKU85W7xcIWM9cAE23chIP3U9AygJBMsV6Yap82Np7uSlleR_CTG-3HBflF3V1E3a3-djOCItV99ty-CQ0QIt9kV1CRlRfk2_zRH_W4GRqhRGifG1rk7zdahm7tk8E5e3NCKzSwistSQhxIHl7oQMValeSneghuYh7S7s8hVNmSD0SDxDEgtu8yMD_XtN18egCpqo1y4VGjoBmVrjXlATjpYvfeXAyilrMbRlkg"
const teachertoken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODgsImV4cCI6MTgwNDI5NjE4OCwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiNjQzNmY2OGEtZTU1Ni1mYWVmLWExYjUtM2ExNjg5N2I3NjU4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg4LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6IjE4ODU5NzczOTk5QHFxLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjoiRmFsc2UiLCJuYW1lIjoiMTg4NTk3NzM5OTkiLCJpYXQiOjE3NzI3NjAxODgsInNjb3BlIjpbImFkZHJlc3MiLCJDb2RlQUJDIiwiZW1haWwiLCJvcGVuaWQiLCJwaG9uZSIsInByb2ZpbGUiLCJyb2xlIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbInB3ZCJdfQ.MWVQ3IocjB3a3juC0Girt7X2cnzbBt98LX54glQ5PTlKmDI_sN5t8n3BcTNeOtsJK8BRPDgpyvJiOo5WkT9aZhykk5psxnQjDIwhq4Ys5K_0UrMpvmISkAYxelz8F-WD0YDQ2FyNoeDdj5d77zW9fPjXK-4_uM-LsK4BNiF3Ak6ilbxYQMqV5SDNbAs3nHK25h98gTAfr0Z6Xt4nsngZKE62m7l-zen6zWMwQ3DCd5caz1fFYlMllbvOfyrkZO7PHL6NmPJz-jtJqp-TAM18qPxvgxzg0wa39yl4-lMzOuMnt3Rw3GxnUQ8K3iYm3L2O0V1n9LEccIWGXi2PeXYKPA"
const author = "官方"
const userid = "139dca39-470b-2b00-fd0a-3a16896e0a18"
const fullUrl = `${apiUrl}?type=3w-api&__tenant=${tenant}&author=${encodeURIComponent(author)}&userid=${userid}&username=${encodeURIComponent("雷君")}&token=${token}&teachertoken=${teachertoken}`;

async function callMamaleApi(body: any): Promise<string> {
    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mamale API returned status ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    let rawContent = "";

    // Parses SSE
    if (text.includes('data: ')) {
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const jsonPart = trimmed.replace('data: ', '').trim();
                if (jsonPart === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(jsonPart);
                    rawContent += parsed.choices?.[0]?.delta?.content ||
                        parsed.choices?.[0]?.message?.content ||
                        parsed.result ||
                        parsed.content || "";
                } catch (e) { }
            }
        }
    }

    if (!rawContent.trim()) {
        try {
            const data = JSON.parse(text);
            rawContent = data.choices?.[0]?.message?.content || data.result || data.content || text;
        } catch (e) {
            rawContent = text;
        }
    }

    return rawContent.trim();
}

export const generatePPTStructure = async (
    userPrompt: string,
    styleId: string
): Promise<AIPPTStructure> => {

    const preset = STYLE_PRESETS.find(s => s.id === styleId);
    const styleDescription = preset?.promptSuffix || "";

    const systemPrompt = "你是一位专业的演示文稿（PPT）设计师。请始终以 JSON 格式返回结果。";
    const userMessage = `请分析以下用户的核心诉求，并创建一个结构清晰的演示文稿结构。

核心诉求: "${userPrompt}"
风格要求: ${styleDescription}

请只返回 JSON 对象，格式如下：
{
  "title": "精简有力的PPT标题",
  "content": "列出3-4个核心要点",
  "bg_image_prompt": "一段用于AI生成背景图片的英文或中文视觉提示词，需包含要求的视觉风格描述和主题元素"
}`;

    const textResult = await callMamaleApi({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ],
        model: "DeepSeek-V3",
        stream: false
    });

    // Clean markdown matching (sometimes model puts json in ```json ... ```)
    let jsonStr = textResult.trim();
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
        return JSON.parse(jsonStr) as AIPPTStructure;
    } catch (e) {
        console.error("Failed to parse AI structure output:", jsonStr);
        throw new Error("模型返回的并不是有效的 JSON 格式");
    }
}

export const generateBgImage = async (
    slide: AIPPTStructure,
    styleId: string
): Promise<string> => {
    const preset = STYLE_PRESETS.find(s => s.id === styleId);
    const styleDescription = preset?.promptSuffix || "";

    const visualPrompt = `设计一张专业的演示文稿幻灯片 (PPT Slide)。
    幻灯片标题: "${slide.title}"
    幻灯片内容: "${slide.content}"

    设计指令:
    ${slide.bg_image_prompt}

    风格要求：
    ${styleDescription}

    重要要求:
    - 图片看起来必须像一张完成度极高的PPT页面，但是不要生成具体的字，主要是生成符合意境的精美背景。
    - 宽高比: 16:9。
    - 确保设计风格与描述严格一致。
  `;

    const textResult = await callMamaleApi({
        provideName: 'TuZi',
        model: 'nano-banana-2',
        messages: [
            { role: "user", content: visualPrompt }
        ]
    });

    let imageUrl = '';
    const match = textResult.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
    if (match && match[1]) {
        imageUrl = match[1];
    } else {
        throw new Error("无法从 AI 响应中提取图片 URL");
    }

    // We can use the mamale image URL directly or convert it if there's a converter endpoint, 
    // but the `s.mamale.vip` URLs work so we can just return it.
    return imageUrl;
}

export const getRandomInspiration = async (): Promise<string> => {
    const systemPrompt = "你是一个充满温情和想象力的演示文稿设计师。请为用户提供一个【惊艳、有洞见且富有吸引力】的演示话题灵感。\n要求：\n1. 结构感强，话题自带故事性。\n2. 直接切入主题。严控在25字以内。\n3. 只输出话题本身，不要有任何多余的开头或结尾。";

    const textResult = await callMamaleApi({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "请生成一个PPT主题灵感。" }
        ],
        model: "doubao-seed-1-6-250615",
        stream: false
    });

    return textResult.replace(/^"|"$/g, '');
}
