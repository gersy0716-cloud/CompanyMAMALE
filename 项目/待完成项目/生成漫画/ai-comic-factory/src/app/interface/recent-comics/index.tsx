"use client"

import { useEffect, useState } from "react"
import { getComicRecords } from "@/app/queries/getComicRecords"
import { cn } from "@/lib/utils"
import { useStore } from "@/app/store"
import { getPreset, PresetName, presets } from "@/app/engine/presets"
import { RenderedScene } from "@/types"

import { Play, Calendar, Layers, Clock } from "lucide-react"

import { useRouter } from "next/navigation"

export function RecentComics({ isPage = false, onDataLoaded }: { isPage?: boolean; onDataLoaded?: (count: number) => void }) {
    const router = useRouter()
    const [records, setRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const data = await getComicRecords()
                setRecords(data)
                onDataLoaded?.(data.length)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchRecords()
    }, [])

    const handleLoadComic = (record: any) => {
        try {
            const setDbRecordId = useStore.getState().setDbRecordId

            const images = typeof record.panel_images === 'string' ? JSON.parse(record.panel_images || "[]") : (record.panel_images || [])
            const panelsJsonRaw = typeof record.panels_json === 'string' ? JSON.parse(record.panels_json || "{}") : (record.panels_json || {})

            let panelsData = []
            let savedLayouts: string[] = []

            if (Array.isArray(panelsJsonRaw)) {
                panelsData = panelsJsonRaw
            } else if (panelsJsonRaw.panels) {
                panelsData = panelsJsonRaw.panels
                savedLayouts = panelsJsonRaw.layouts || []
            }

            if (!panelsData.length) return

            const panels = panelsData.map((p: any) => p.instructions || "")
            const speeches = panelsData.map((p: any) => p.speech || "")
            const captions = panelsData.map((p: any) => p.caption || "")

            const renderedScenes: Record<string, RenderedScene> = {}

            images.forEach((url: string, i: number) => {
                if (!url) return
                renderedScenes[`${i}`] = {
                    renderId: `history_${record.id || record.Id}_${i}`,
                    status: "pregenerated",
                    assetUrl: url,
                    alt: panels[i] || "",
                    error: "",
                    maskUrl: "",
                    segments: []
                }
            })

            const nbPanels = panelsData.length

            useStore.setState({
                prompt: record.prompt || "",
                preset: getPreset(record.style),
                panels,
                speeches,
                captions,
                renderedScenes,
                currentNbPanels: nbPanels,
                currentNbPages: Math.ceil(nbPanels / 4),
                layouts: savedLayouts.length ? (savedLayouts as any[]) : useStore.getState().layouts,
                layout: savedLayouts.length ? (savedLayouts[0] as any) : useStore.getState().layout,
                previousNbPanels: 0,
                isGeneratingStory: false,
                isGeneratingText: false,
            })

            setDbRecordId(record.id || record.Id)

            if (isPage) {
                router.push('/')
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch (e) {
            console.error("Failed to load comic:", e)
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-[1700px] mx-auto py-12 px-4 md:px-8 text-center text-slate-500">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>正在加载漫画历史记录...</p>
                </div>
            </div>
        )
    }

    if (records.length === 0) return null

    return (
        <div className={cn("w-full max-w-[1700px] mx-auto py-12 px-4 md:px-8 relative z-10", isPage ? "pt-4" : "")}>
            {!isPage && (
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                    <span className="text-3xl">📚</span>
                    最新生成的漫画故事
                </h2>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
                {records.map((record, index) => {
                    const recordId = record.id || record.Id
                    const uniqueKey = recordId || `comic_${index}`
                    let images: string[] = []
                    try {
                        images = typeof record.panel_images === 'string' ? JSON.parse(record.panel_images) : record.panel_images
                    } catch (e) { }

                    const hasImages = images && images.length > 0
                    const coverImage = hasImages ? images[0] : null

                    return (
                        <div
                            key={uniqueKey}
                            onClick={() => handleLoadComic(record)}
                            className="group relative cursor-pointer"
                        >
                            <div className="relative aspect-[3/4] mb-4">
                                <div className="absolute inset-0 bg-white rounded-lg shadow-sm translate-x-1.5 translate-y-1.5 border border-slate-200/60" />
                                <div className="absolute inset-0 bg-white rounded-lg shadow-sm translate-x-0.75 translate-y-0.75 border border-slate-200/60" />
                                <div className="absolute inset-0 bg-white rounded-lg overflow-hidden border border-slate-200 shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500">
                                    {coverImage ? (
                                        <div className="w-full h-full relative overflow-hidden">
                                            <img src={coverImage} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-all duration-500" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6 gap-3">
                                            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                                            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">拼命绘图中...</span>
                                        </div>
                                    )}

                                    <div className="absolute top-3 left-3">
                                        <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-white/50">
                                            风格：{presets[record.style as PresetName]?.label || record.style || '默认'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 px-0.5 transition-colors group-hover:text-slate-900">
                                <h3 className="font-bold text-slate-700 text-sm line-clamp-2 leading-snug tracking-tight">
                                    {record.prompt || "未命名故事"}
                                </h3>
                                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-semibold">
                                    {record.status !== "已完成" && (
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Clock className="w-3 h-3" />
                                            <span>制作中</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
