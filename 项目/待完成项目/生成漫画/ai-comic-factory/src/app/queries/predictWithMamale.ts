
import { LLMPredictionFunctionParams } from "@/types"

export async function predict({
    systemPrompt,
    userPrompt,
    // nbMaxNewTokens
}: LLMPredictionFunctionParams): Promise<string> {
    const apiBase = "https://3w-api.mamale.vip/api/app"
    const apiUrl = "https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream"
    const tenant = "c1863285-25d1-44fe-805c-5ddf611f83d3"

    const response = await fetch(`${apiUrl}?__tenant=${tenant}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "DeepSeek-V3",
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Mamale API returned status ${response.status}`);
    }

    const text = await response.text();
    if (!text.trim()) {
        throw new Error("Mamale API returned empty content.");
    }

    let rawContent = "";
    // Robust handling of potential SSE format even if stream=false
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
                        parsed.result ||
                        parsed.content ||
                        "";
                    rawContent += part;
                } catch (e) { }
            }
        }
    }

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

    return rawContent;
}
