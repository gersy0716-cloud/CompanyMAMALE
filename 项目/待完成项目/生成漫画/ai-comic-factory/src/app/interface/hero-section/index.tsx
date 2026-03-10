"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useLocalStorage } from "usehooks-ts"
import { Mic, Dices, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { PresetName, defaultPreset, presets } from "@/app/engine/presets"
import { useStore } from "@/app/store"
import { Button } from "@/components/ui/button"
import { useOAuth } from "@/lib/useOAuth"
import { useIsBusy } from "@/lib/useIsBusy"
import { getRandomInspiration } from "@/app/queries/getRandomInspiration"

import { localStorageKeys } from "../settings-dialog/localStorageKeys"
import { defaultSettings } from "../settings-dialog/defaultSettings"
import { AuthWall } from "../auth-wall"
import { getLocalStorageShowSpeeches } from "@/lib/getLocalStorageShowSpeeches"

// 预设分组（按区域），与原项目对齐
const PRESET_GROUPS = {
    "🌸 亚洲": Object.values(presets).filter(p => p.family === "asian"),
    "🦅 美式": Object.values(presets).filter(p => p.family === "american"),
    "🏰 欧洲": Object.values(presets).filter(p => p.family === "european" && p.id !== "random"),
}

const RANDOM_PROMPTS = [
    "宇航员在火星发现了一只发光的赛博朋克流浪猫",
    "一只背着双肩包的柴犬在东京街头当侦探调查骨头失踪案",
    "魔法学院里，一个不会用魔力的小男孩竟然用科学实验打败了巨龙",
    "未来2080年的夜之城，送货员小明驾驶飞车遭遇了黑客幽灵的袭击",
    "童话森林里，大灰狼决定金盆洗手开了一家素食面包店",
    "三国时期的诸葛亮意外穿越到了现代的电竞总决赛现场并且成为了指挥",
    "一只在故宫里迷路的神兽饕餮遇到了一群拿着相机的外国游客",
    "沉睡百年的吸血鬼醒来后发现自己竟然对WiFi信号过敏",
    "深海里的人鱼公主不仅不开演唱会了，还成了一个狂热的机械工程师",
    "在世界末日后的一片废墟中，一个小女孩和一台老旧的服务机器人一起种出了一朵向日葵",
]

export function HeroSection() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const requestedPreset = (searchParams?.get('preset') as PresetName) || "random"
    const requestedStoryPrompt = (searchParams?.get('storyPrompt') as string) || ""

    const preset = useStore(s => s.preset)
    const prompt = useStore(s => s.prompt)

    const setShowSpeeches = useStore(s => s.setShowSpeeches)
    const showSpeeches = useStore(s => s.showSpeeches)
    const setShowCaptions = useStore(s => s.setShowCaptions)
    const showCaptions = useStore(s => s.showCaptions)

    const generate = useStore(s => s.generate)
    const isBusy = useIsBusy()

    const [isMounted, setIsMounted] = useState(false)

    const [lastDraftPromptB, setLastDraftPromptB] = useLocalStorage<string>(
        "AI_COMIC_FACTORY_LAST_DRAFT_PROMPT_B",
        requestedStoryPrompt
    )

    const [draftPrompt, setDraftPrompt] = useState(lastDraftPromptB || "")
    const [draftPreset, setDraftPreset] = useState<PresetName>(requestedPreset)

    const { isLoggedIn, enableOAuthWall } = useOAuth({ debug: false })

    const [hasGeneratedAtLeastOnce, setHasGeneratedAtLeastOnce] = useLocalStorage<boolean>(
        localStorageKeys.hasGeneratedAtLeastOnce,
        defaultSettings.hasGeneratedAtLeastOnce
    )

    const [showAuthWall, setShowAuthWall] = useState(false)

    // 语音识别状态
    const [isRecording, setIsRecording] = useState(false)
    const [isInspirationLoading, setIsInspirationLoading] = useState(false)
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        setIsMounted(true)
        setShowSpeeches(getLocalStorageShowSpeeches(true))
        setShowCaptions(true) // 默认开启说明文字

        // 初始化 Speech Recognition
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition()
                recognitionRef.current.continuous = false
                recognitionRef.current.interimResults = true
                recognitionRef.current.lang = 'zh-CN'

                recognitionRef.current.onresult = (event: any) => {
                    let interimTranscript = ''
                    let finalTranscript = ''

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript
                        } else {
                            interimTranscript += event.results[i][0].transcript
                        }
                    }

                    if (finalTranscript) {
                        setDraftPrompt((prev) => prev ? prev + ' ' + finalTranscript : finalTranscript)
                    }
                }

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error)
                    setIsRecording(false)
                }

                recognitionRef.current.onend = () => {
                    setIsRecording(false)
                }
            }
        }
    }, [])

    useEffect(() => { if (lastDraftPromptB !== draftPrompt) { setLastDraftPromptB(draftPrompt) } }, [draftPrompt])

    const handleSubmit = () => {
        if (enableOAuthWall && hasGeneratedAtLeastOnce && !isLoggedIn) {
            setShowAuthWall(true)
            return
        }

        const promptChanged = draftPrompt.trim() !== prompt.trim()
        const presetChanged = draftPreset !== preset.id
        if (!isBusy && (promptChanged || presetChanged || !prompt)) { // if no prompt yet, allow generate
            // 这里的布局默认先用 random
            generate(draftPrompt, draftPreset, "random")
        }
    }

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("您的浏览器不支持语音识别功能，请使用 Chrome 等现代浏览器。")
            return
        }

        if (isRecording) {
            recognitionRef.current.stop()
            setIsRecording(false)
        } else {
            recognitionRef.current.start()
            setIsRecording(true)
        }
    }

    const setRandomPrompt = async () => {
        if (isInspirationLoading) return
        setIsInspirationLoading(true)
        try {
            const newPrompt = await getRandomInspiration()
            if (newPrompt) {
                setDraftPrompt(newPrompt)
            }
        } catch (e) {
            console.error("Failed to get inspiration:", e)
            // fallback to local if needed
            const randomIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length)
            setDraftPrompt(RANDOM_PROMPTS[randomIndex])
        } finally {
            setIsInspirationLoading(false)
        }
    }

    return (
        <div className={cn(
            "w-full max-w-[1100px] mx-auto",
            "bg-white/90 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),_0_10px_10px_-5px_rgba(0,0,0,0.04)]",
            "p-4 md:p-6 mb-8",
            "relative z-20"
        )}>
            <div className="flex flex-col gap-6">

                {/* 输入框与操作区复合容器 */}
                <div className="bg-slate-50 border-2 border-slate-100 rounded-[28px] overflow-hidden focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-inner">
                    <textarea
                        className={cn(
                            "w-full min-h-[160px] p-8 text-xl md:text-2xl outline-none bg-transparent",
                            "placeholder:text-slate-300 text-slate-800 font-medium resize-none"
                        )}
                        placeholder="描述你的故事场景... (例如：宇航员在火星发现一只发光的猫咪)"
                        value={draftPrompt}
                        onChange={(e) => setDraftPrompt(e.target.value)}
                        disabled={isBusy}
                    />

                    {/* 一体化操作工具栏 */}
                    <div className="px-6 py-4 bg-white/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 px-5 rounded-xl transition-all font-bold text-base flex items-center gap-2",
                                    isRecording
                                        ? "bg-red-50 text-red-500 border-red-200 border animate-pulse"
                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80"
                                )}
                                onClick={toggleRecording}
                                disabled={isBusy}
                            >
                                {isMounted && <Mic className={cn("w-5 h-5", isRecording ? "animate-pulse" : "")} />}
                                <span>{isRecording ? "正在倾听..." : "语音输入"}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 px-5 rounded-xl text-amber-600 hover:bg-amber-50 font-bold text-base flex items-center gap-2",
                                    isInspirationLoading && "opacity-70 cursor-not-allowed"
                                )}
                                onClick={setRandomPrompt}
                                disabled={isBusy || isInspirationLoading}
                            >
                                {isInspirationLoading ? (
                                    <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                                ) : (
                                    isMounted && <Dices className="w-5 h-5" />
                                )}
                                <span>{isInspirationLoading ? "正在寻找灵感..." : "随机灵感"}</span>
                            </Button>
                        </div>

                        <Button
                            className={cn(
                                "w-full sm:w-auto h-14 px-10 text-xl font-bold rounded-2xl transition-all flex items-center gap-3",
                                "bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white shadow-lg shadow-green-500/20",
                                "hover:scale-105 active:scale-95",
                                isBusy && "opacity-80 cursor-not-allowed"
                            )}
                            onClick={handleSubmit}
                            disabled={!isMounted || !draftPrompt?.trim().length || isBusy}
                        >
                            {isBusy ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>生成中...</span>
                                </div>
                            ) : (
                                <>
                                    {isMounted && <Sparkles className="w-6 h-6" />}
                                    <span>立即生成漫画</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>


                {/* 画风选择区域 */}
                <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-500 mb-4 tracking-wide">选择风格</h3>

                    <div className="flex flex-col gap-4">
                        {/* 随机风格 */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                key="random"
                                onClick={() => setDraftPreset("random" as PresetName)}
                                className={cn(
                                    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
                                    draftPreset === "random"
                                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                🎲 随机风格
                            </button>
                        </div>

                        {/* 其他分组 */}
                        {Object.entries(PRESET_GROUPS).map(([groupName, groupPresets]) => (
                            <div key={groupName} className="flex gap-4">
                                <div className="w-20 pt-2 text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">
                                    {groupName}
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {groupPresets.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setDraftPreset(p.id as PresetName)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                                                draftPreset === p.id
                                                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/30 font-semibold"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <AuthWall show={showAuthWall} />
        </div>
    )
}
