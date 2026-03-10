import React, { useState } from 'react'
import { Mic, Dices, Sparkles, Book } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'
import { STYLE_PRESETS } from '../lib/styles'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { generatePPTStructure, getRandomInspiration, generateBgImage } from '../lib/ai'

export const InputView: React.FC = () => {
    const { prompt, setPrompt, style, setStyle, isBusy, setIsBusy, setResult, setView } = useStore()
    const [isInspirationLoading, setIsInspirationLoading] = useState(false)

    const { isRecording, toggleRecording } = useSpeechRecognition((text) => {
        setPrompt(prompt + text)
    })

    const handleRandomInspiration = async () => {
        setIsInspirationLoading(true)
        try {
            const text = await getRandomInspiration()
            setPrompt(text)
        } finally {
            setIsInspirationLoading(false)
        }
    }

    const handleGenerate = async () => {
        if (!prompt.trim() || isBusy) return
        setIsBusy(true)
        try {
            // 处理随机风格
            let finalStyle = style
            if (style === 'random') {
                const styles = STYLE_PRESETS.filter(p => p.id !== 'random')
                finalStyle = styles[Math.floor(Math.random() * styles.length)].id
                setStyle(finalStyle) // 反馈给 UI
            }

            const structure = await generatePPTStructure(prompt, finalStyle)
            let resultData = { ...structure, bg_image_url: "" }
            setResult(resultData)

            try {
                const bgUrl = await generateBgImage(structure, finalStyle)
                resultData = { ...resultData, bg_image_url: bgUrl }
                setResult(resultData)
                // 按照用户要求，历史记录暂时只保留按钮，这里暂时不保存数据到 BaaS
            } catch (err) {
                console.error("图片生成或保存失败:", err)
            }

        } catch (error) {
            alert("生成失败，请重试")
        } finally {
            setIsBusy(false)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* 历史记录入口 */}
            <button
                onClick={() => setView('history')}
                className="absolute top-4 right-4 flex items-center justify-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-md rounded-full text-slate-600 hover:bg-white/80 hover:text-slate-900 shadow-sm transition-all z-10 font-medium"
            >
                <Book className="w-4 h-4" />
                <span className="text-sm">查看记录</span>
            </button>
            <div className="text-center space-y-2">
                <h1 className="text-5xl font-black tracking-tighter text-slate-800">
                    一句话生一张<span className="text-indigo-500">PPT</span>
                </h1>
                <p className="text-slate-400 font-medium">输入你的灵感，剩下的交给魔法</p>
            </div>

            <div className={cn(
                "bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[40px] overflow-hidden shadow-2xl transition-all duration-500",
                "focus-within:ring-[12px] focus-within:ring-indigo-500/10 focus-within:border-indigo-500/20"
            )}>
                <textarea
                    className="w-full min-h-[200px] p-10 text-3xl outline-none bg-transparent placeholder:text-slate-300 text-slate-800 font-bold resize-none leading-relaxed"
                    placeholder="描述你的 PPT 核心内容..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isBusy}
                />

                <div className="px-10 py-6 bg-white/40 border-t border-white/60 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={toggleRecording}
                            className={cn(
                                "h-14 px-6 rounded-2xl font-bold flex items-center gap-3 transition-all",
                                isRecording
                                    ? "bg-red-50 text-red-500 border border-red-200 animate-pulse"
                                    : "text-slate-500 bg-white/50 hover:bg-white hover:text-slate-900"
                            )}
                        >
                            <Mic className={cn("w-5 h-5", isRecording && "animate-pulse")} />
                            <span>{isRecording ? "倾听中..." : "语音输入"}</span>
                        </button>

                        <button
                            onClick={handleRandomInspiration}
                            disabled={isBusy || isInspirationLoading}
                            className="h-14 px-6 rounded-2xl font-bold text-amber-600 bg-white/50 hover:bg-white flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isInspirationLoading ? (
                                <div className="w-5 h-5 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                            ) : (
                                <Dices className="w-5 h-5" />
                            )}
                            <span>随机灵感</span>
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isBusy}
                        className={cn(
                            "w-full md:w-auto h-16 px-12 text-xl font-black rounded-3xl transition-all flex items-center justify-center gap-3",
                            "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-xl shadow-green-500/20",
                            "hover:from-emerald-500 hover:to-green-600 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
                        )}
                    >
                        {isBusy ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Sparkles className="w-6 h-6" />
                        )}
                        <span>立即开始创作</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                    <div className="h-px flex-grow bg-slate-200/50" />
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">选择视觉风格</span>
                    <div className="h-px flex-grow bg-slate-200/50" />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {STYLE_PRESETS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setStyle(p.id)}
                            className={cn(
                                "px-8 py-3 rounded-full text-lg font-bold transition-all duration-300",
                                style === p.id
                                    ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/40 scale-105"
                                    : "bg-white/40 text-slate-500 hover:bg-white/80 backdrop-blur-md"
                            )}
                        >
                            <span className="mr-2">{p.icon}</span>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>


        </div>
    )
}
