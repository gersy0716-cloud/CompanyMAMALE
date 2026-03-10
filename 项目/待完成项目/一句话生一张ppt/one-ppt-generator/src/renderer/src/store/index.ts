import { create } from 'zustand'
import { AIPPTStructure, PPTStyleId } from '../lib/styles'

export type AppView = 'input' | 'result' | 'history'

const BASE_URL = ''
const BASE_ID = 'bsekddalnVrgIAiZYmM'
const TABLE_NAME = 'history_records'
const TOKEN = 'LlrO0TdkBt6AMRiE2KN8FYVJ8Ma1z9jZ7svOpvln'

function encodeFilters(filters: any[]): string {
    const jsonStr = JSON.stringify(filters)
    const escaped = jsonStr.replace(/[\u0080-\uFFFF]/g, (match) => {
        return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4)
    })
    return btoa(escaped)
}

interface AppState {
    // UI 视图状态
    view: AppView
    setView: (view: AppView) => void

    // 生成参数与结果
    prompt: string
    setPrompt: (prompt: string) => void
    style: PPTStyleId
    setStyle: (style: PPTStyleId) => void
    isBusy: boolean
    setIsBusy: (isBusy: boolean) => void
    result: (AIPPTStructure & { bg_image_url: string }) | null
    setResult: (result: (AIPPTStructure & { bg_image_url: string }) | null) => void

    // 历史记录状态
    history: any[]
    setHistory: (history: any[]) => void
    fetchHistory: () => Promise<void>

    // 控制逻辑
    reset: () => void
}

export const useStore = create<AppState>((set) => ({
    view: 'input',
    setView: (view) => set({ view }),

    prompt: '',
    setPrompt: (prompt) => set({ prompt }),
    style: 'random',
    setStyle: (style) => set({ style }),
    isBusy: false,
    setIsBusy: (isBusy) => set({ isBusy }),
    result: null,
    setResult: (result) => set({
        result,
        view: result ? 'result' : 'input'
    }),

    history: [],
    setHistory: (history) => set({ history }),

    fetchHistory: async () => {
        try {
            const filters = [
                ['where', ['module_type', '=', 'one_sentence_ppt']],
                ['orderBy', ['created_at', 'desc']]
            ];
            const encodedFilters = encodeFilters(filters);
            const response = await fetch(`${BASE_URL}/api/bases/${BASE_ID}/tables/${TABLE_NAME}/records?page=1&pageLimit=15&filters=${encodedFilters}`, {
                headers: {
                    'x-bm-token': TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            set({ history: data.records || [] });
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    },

    reset: () => set({
        prompt: '',
        style: 'random',
        result: null,
        isBusy: false,
        view: 'input'
    }),
}))
