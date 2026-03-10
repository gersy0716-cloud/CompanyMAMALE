import React from 'react'
import { useStore } from '../store'
import { ArrowLeft, RefreshCw, Share2 } from 'lucide-react'

export const ResultView: React.FC = () => {
    const { result, reset } = useStore()

    if (!result) return null

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-8 p-12">
            <div className="relative aspect-video w-[85vw] max-w-[1200px] bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                {result.bg_image_url ? (
                    <img
                        src={result.bg_image_url}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-white/20 text-lg font-bold">
                        <div className="flex flex-col items-center gap-4">
                            <RefreshCw className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
                            <span>正在绘制惊艳配图...</span>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 p-16 flex flex-col justify-center bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10">
                    <h2 className="text-6xl font-black text-white tracking-tight leading-tight max-w-[70%]">
                        {result.title}
                    </h2>
                    <div className="h-2 w-24 bg-indigo-500 my-8 rounded-full" />
                    <p className="text-2xl text-white/80 font-medium max-w-[60%] leading-relaxed">
                        {result.content}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button onClick={reset} className="h-16 px-8 rounded-full bg-white/60 backdrop-blur-xl border border-white text-slate-600 font-bold flex items-center gap-3 hover:bg-white transition-all shadow-xl">
                    <ArrowLeft className="w-5 h-5" />
                    <span>退出</span>
                </button>
                <button className="h-16 px-12 rounded-full bg-indigo-500 text-white font-black flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-indigo-500/40">
                    <Share2 className="w-6 h-6" />
                    <span>扫码拿走</span>
                </button>
            </div>
        </div>
    )
}
