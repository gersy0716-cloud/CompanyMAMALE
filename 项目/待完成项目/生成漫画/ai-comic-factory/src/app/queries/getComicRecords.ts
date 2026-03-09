import { GeneratedPanel } from "@/types"

const dbConfig = {
    apiBase: "https://data.520ai.cc/api/bases",
    baseId: "bsekddalnVrgIAiZYmM",
    tableId: "gaHY0ruUUs",
    apikey: "LlrO0TdkBt6AMRiE2KN8FYVJ8Ma1z9jZ7svOpvln"
};

export const encodeFilters = (filters: any) => {
    let jsonStr = JSON.stringify(filters)
    jsonStr = jsonStr.replace(/[\u0080-\uFFFF]/g, function (match) {
        return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4)
    })
    return btoa(jsonStr)
}

export async function getComicRecords() {
    try {
        const filters = [
            // Only fetch completed ones if possible, but let's just fetch recent
            ['orderBy', ['Id', 'desc']]
        ];

        const params = new URLSearchParams({
            page: '1',
            pageLimit: '12',
            filters: encodeFilters(filters)
        });

        const response = await fetch(`${dbConfig.apiBase}/${dbConfig.baseId}/tables/${dbConfig.tableId}/records?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-bm-token': dbConfig.apikey,
            }
        });

        if (!response.ok) {
            console.error(`[Database] fetch failed: status: ${response.status}`);
            return [];
        }

        const result = await response.json();
        return result.data || [];
    } catch (err) {
        console.error("[Database] fetch latest records failed", err);
        return [];
    }
}
