"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useLocalStorage } from "usehooks-ts"

import { cn } from "@/lib/utils"
import { PresetName, defaultPreset, presets } from "@/app/engine/presets"
import { useStore } from "@/app/store"
import { Button } from "@/components/ui/button"
import { useOAuth } from "@/lib/useOAuth"
import { useIsBusy } from "@/lib/useIsBusy"

import { localStorageKeys } from "../settings-dialog/localStorageKeys"
import { defaultSettings } from "../settings-dialog/defaultSettings"
import { AuthWall } from "../auth-wall"
import { getLocalStorageShowSpeeches } from "@/lib/getLocalStorageShowSpeeches"

// 预设分组（按区域），与原项目对齐
const PRESET_GROUPS = {
    "🌸 亚洲": Object.values(presets).filter(p => p.family === "asian"),
    "🦅 美式": Object.values(presets).filter(p => p.family === "american"),
    "🏰 欧洲": Object.values(presets).filter(p => p.family === "european"),
}

export function HeroSection() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const requestedPreset = (searchParams?.get('preset') as PresetName) || defaultPreset
    const requestedStoryPrompt = (searchParams?.get('storyPrompt') as string) || ""

    const preset = useStore(s => s.preset)
    const prompt = useStore(s => s.prompt)

    const setShowSpeeches = useStore(s => s.setShowSpeeches)
    const showSpeeches = useStore(s => s.showSpeeches)
    const setShowCaptions = useStore(s => s.setShowCaptions)
    const showCaptions = useStore(s => s.showCaptions)

    const generate = useStore(s => s.generate)
    const isBusy = useIsBusy()

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
    const [isMounted, setIsMounted] = useState(false)

    // 语音识别状态
    const [isRecording, setIsRecording] = useState(false)
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

    return (
        <div className={cn(
            "w-full max-w-[1100px] mx-auto",
            "bg-white/90 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),_0_10px_10px_-5px_rgba(0,0,0,0.04)]",
            "p-6 md:p-10 mb-12",
            "relative z-20"
        )}>
            <div className="flex flex-col gap-6">

                {/* 输入框区域 */}
                <div className="relative group">
                    <textarea
                        className={cn(
                            "w-full min-h-[140px] p-6 text-lg md:text-xl",
                            "bg-slate-50 border-2 border-slate-100 rounded-2xl",
                            "focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all resize-y",
                            "placeholder:text-slate-400 text-slate-800 font-medium"
                        )}
                        placeholder="描述你的故事场景... (例如：宇航员在火星发现一只发光的猫咪)"
                        value={draftPrompt}
                        onChange={(e) => setDraftPrompt(e.target.value)}
                        disabled={isBusy}
                    />

                    {/* 右下角的操作按钮 */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                "w-12 h-12 rounded-full border-2 transition-all shadow-sm bg-white hover:bg-slate-50",
                                isRecording ? "border-red-500 text-red-500 animate-pulse bg-red-50" : "border-slate-200 text-slate-500 hover:text-slate-700"
                            )}
                            onClick={toggleRecording}
                            title={isRecording ? "停止录音" : "语音输入"}
                            disabled={isBusy}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                            </svg>
                        </Button>

                        <Button
                            className={cn(
                                "h-12 px-8 text-lg font-bold rounded-xl transition-all",
                                "bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white shadow-lg shadow-green-500/30",
                                "hover:scale-105 active:scale-95",
                                isBusy && "animate-jelly opacity-80 cursor-not-allowed"
                            )}
                            onClick={handleSubmit}
                            disabled={!isMounted || !draftPrompt?.trim().length || isBusy}
                        >
                            {isBusy ? "生成中..." : "立即生成"}
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
