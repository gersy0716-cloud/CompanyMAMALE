import { GeneratedPanel } from "@/types"

const dbConfig = {
    apiBase: "https://data.520ai.cc/api/bases",
    baseId: "bsekddalnVrgIAiZYmM",
    tableId: "gaHY0ruUUs",
    apikey: "LlrO0TdkBt6AMRiE2KN8FYVJ8Ma1z9jZ7svOpvln"
};

export async function saveComicRecord({
    prompt,
    styleId,
    panelsData,
    layouts,
    token,
    tenantId
}: {
    prompt: string;
    styleId: string;
    panelsData: GeneratedPanel[];
    layouts: string[];
    token: string;
    tenantId: string;
}): Promise<number | null> {
    if (!dbConfig.apikey) {
        console.warn("Database apikey not configured, skipping save");
        return null;
    }

    console.log(`[Database] Attempting save with apikey (len: ${dbConfig.apikey.length}, prefix: ${dbConfig.apikey.substring(0, 5)}...)`);

    try {
        const payload = {
            name: prompt.slice(0, 50),
            tenantid: tenantId,
            prompt: prompt,
            style: styleId,
            panels_json: JSON.stringify({
                panels: panelsData,
                layouts: layouts
            }),
            panel_images: "[]",
            status: "生成中",
        };
        // console.log("[Database] Payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${dbConfig.apiBase}/${dbConfig.baseId}/tables/${dbConfig.tableId}/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bm-token': dbConfig.apikey,
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Database] save failed: status: ${response.status}, body:`, errorText);
            return null;
        }

        const result = await response.json();
        console.log("Panels saved to database, ID:", result.id);
        return result.id;
    } catch (err) {
        console.error("Database save exception:", err);
        return null;
    }
}

export async function updateComicRecord({
    recordId,
    imageUrls,
    token
}: {
    recordId: number;
    imageUrls: string[];
    token: string;
}): Promise<void> {
    if (!recordId || !dbConfig.apikey) return;

    try {
        const url = `${dbConfig.apiBase}/${dbConfig.baseId}/tables/${dbConfig.tableId}/records/${recordId}`;
        const hasImages = imageUrls.some(u => !!u);

        await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-bm-token': dbConfig.apikey,
            },
            body: JSON.stringify({
                panel_images: JSON.stringify(imageUrls),
                status: hasImages ? "已完成" : "失败",
            })
        });

        console.log("Database record updated, ID:", recordId);
    } catch (err) {
        console.error("Database update exception:", err);
    }
}
