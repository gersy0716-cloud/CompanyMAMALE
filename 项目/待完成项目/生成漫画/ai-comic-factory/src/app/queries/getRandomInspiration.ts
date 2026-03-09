
import { getSettings } from "../interface/settings-dialog/getSettings"

export async function getRandomInspiration(): Promise<string> {
    const settings = getSettings()
    const apiUrl = "https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream"
    const tenant = "c1863285-25d1-44fe-805c-5ddf611f83d3"
    // Use the same token logic as predictWithMamale
    const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODUsImV4cCI6MTgwNDI5NjE4NSwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiMTM5ZGNhMzktNDcwYi0yYjAwLWZkMGEtM2ExNjg5NmUwYTE4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg0LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6ImxpY2tpZXNAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJGYWxzZSIsIm5hbWUiOiJsaWNraWVzIiwiaWF0IjoxNzcyNzYwMTg1LCJzY29wZSI6WyJhZGRyZXNzIiwiQ29kZUFCQyIsImVtYWlsIiwib3BlbmlkIiwicGhvbmUiLCJwcm9maWxlIiwicm9sZSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.rLKKF6SlZ7KrnF_0qszH07ZJphbHw2J-Vh1NFIA5qxpODh7xiGakUo6OLRwqVbCHwqLLLLs5iNrlMfpdgZ81BJehoTK4OnZHgImn354cPzpREjocKU85W7xcIWM9cAE23chIP3U9AygJBMsV6Yap82Np7uSlleR_CTG-3HBflF3V1E3a3-djOCItV99ty-CQ0QIt9kV1CRlRfk2_zRH_W4GRqhRGifG1rk7zdahm7tk8E5e3NCKzSwistSQhxIHl7oQMValeSneghuYh7S7s8hVNmSD0SDxDEgtu8yMD_XtN18egCpqo1y4VGjoBmVrjXlATjpYvfeXAyilrMbRlkg"
    const teachertoken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODgsImV4cCI6MTgwNDI5NjE4OCwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiNjQzNmY2OGEtZTU1Ni1mYWVmLWExYjUtM2ExNjg5N2I3NjU4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg4LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6IjE4ODU5NzczOTk5QHFxLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjoiRmFsc2UiLCJuYW1lIjoiMTg4NTk3NzM5OTkiLCJpYXQiOjE3NzI3NjAxODgsInNjb3BlIjpbImFkZHJlc3MiLCJDb2RlQUJDIiwiZW1haWwiLCJvcGVuaWQiLCJwaG9uZSIsInByb2ZpbGUiLCJyb2xlIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbInB3ZCJdfQ.MWVQ3IocjB3a3juC0Girt7X2cnzbBt98LX54glQ5PTlKmDI_sN5t8n3BcTNeOtsJK8BRPDgpyvJiOo5WkT9aZhykk5psxnQjDIwhq4Ys5K_0UrMpvmISkAYxelz8F-WD0YDQ2FyNoeDdj5d77zW9fPjXK-4_uM-LsK4BNiF3Ak6ilbxYQMqV5SDNbAs3nHK25h98gTAfr0Z6Xt4nsngZKE62m7l-zen6zWMwQ3DCd5caz1fFYlMllbvOfyrkZO7PHL6NmPJz-jtJqp-TAM18qPxvgxzg0wa39yl4-lMzOuMnt3Rw3GxnUQ8K3iYm3L2O0V1n9LEccIWGXi2PeXYKPA"
    const author = "官方"
    const userid = "139dca39-470b-2b00-fd0a-3a16896e0a18"

    const fullUrl = `${apiUrl}?type=3w-api&__tenant=${tenant}&author=${encodeURIComponent(author)}&userid=${userid}&username=${encodeURIComponent("雷君")}&token=${token}&teachertoken=${teachertoken}`;

    const systemPrompt = "你是一个充满温情和想象力的顶级儿童漫画编剧。请为6-15岁的孩子提供一个【温馨、阳光、幽默且富有童趣】的漫画故事开头。\n要求：\n1. **绝对禁止诡异/恐怖**：绝对不要出现'物体爬行'、'超现实怪异画面'或任何可能让孩子感到不安、诡异、阴冷的设定（禁止如'拉面爬进月亮'这类诡异构思）。\n2. **转向正面情绪**：侧重于友谊、自然探索、科学小妙招、宠物趣事或勇敢的冒险。文字要充满正能量和色彩感。\n3. **文字风格**：直接切入主题。严控在25字以内。符合核心价值观，严禁暴力、血腥内容。\n4. **禁止解释**：只输出故事本身，不要有任何多余的开头或结尾。"

    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "请生成一个随机灵感。" }
            ],
            model: "doubao-seed-1-6-250615",
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Mamale API returned status ${response.status}`);
    }

    const text = await response.text();
    let rawContent = "";

    // Robust handling of SSE format
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
                        parsed.content ||
                        "";
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

    return rawContent.trim().replace(/^"|"$/g, '');
}
