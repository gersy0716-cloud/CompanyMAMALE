"use client"

import { History, ArrowLeft } from "lucide-react"
import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { RecentComics } from "../interface/recent-comics"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
    const router = useRouter()
    const [hasContent, setHasContent] = useState<boolean | null>(null)

    return (
        <main className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-[1700px] mx-auto px-6 md:px-12 py-12 md:py-20 flex flex-col gap-10 relative z-10">
                <div className="flex justify-start">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-bold transition-all group w-fit text-lg md:text-xl py-2.5 px-5 rounded-full hover:bg-slate-100/80"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
                        <span>返回创作中心</span>
                    </button>
                </div>

                <div className={cn(
                    "flex flex-col items-center text-center transition-all duration-700",
                    hasContent === false ? "py-20" : "py-0"
                )}>
                    {(hasContent === false || hasContent === null) && (
                        <div className={cn(
                            "flex flex-col items-center gap-4 transition-all duration-1000",
                            hasContent === null ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                        )}>
                            <div className="flex items-center justify-center text-slate-400">
                                <History className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-400">
                                创作历史
                            </h1>
                        </div>
                    )}
                </div>

                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center p-32 text-slate-400 gap-5">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                        <span className="font-medium tracking-tight text-sm uppercase text-slate-400">正在同步云端记录...</span>
                    </div>
                }>
                    <RecentComics
                        isPage={true}
                        onDataLoaded={(count) => setHasContent(count > 0)}
                    />
                </Suspense>
            </div>
        </main>
    )
}
