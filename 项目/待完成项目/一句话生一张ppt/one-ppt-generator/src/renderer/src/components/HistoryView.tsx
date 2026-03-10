import React, { useEffect } from 'react'
import { ArrowLeft, Clock, Layout, ExternalLink } from 'lucide-react'
import { useStore } from '../store'

export function HistoryView(): JSX.Element {
    const { history, fetchHistory, setView, setResult, reset } = useStore()

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    const handleBack = () => {
        setView('input')
    }

    const selectRecord = (record: any) => {
        try {
            const structure = JSON.parse(record.ppt_json)
            setResult({
                ...structure,
                bg_image_url: record.bg_image_url
            })
            setView('result')
        } catch (e) {
            console.error('Failed to parse history record:', e)
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 顶部导航 */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-xl text-slate-600 font-bold transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>返回生成</span>
                </button>
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium text-sm">灵感博物馆</span>
                </div>
            </div>

            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                历史生成记录
            </h2>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40 border-dashed">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Layout className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium">还没有任何灵感记录，快去生成一个吧！</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((record) => (
                        <div
                            key={record.id}
                            onClick={() => selectRecord(record)}
                            className="group relative bg-white/60 hover:bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-5 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 overflow-hidden"
                        >
                            {/* 背景预览图 */}
                            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                                <img
                                    src={record.bg_image_url}
                                    alt=""
                                    className="w-full h-full object-cover grayscale"
                                />
                            </div>

                            <div className="relative space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-wider rounded-lg">
                                        {record.style_id || 'DEFAULT'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {new Date(record.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight">
                                    {record.prompt}
                                </h3>

                                <div className="pt-2 flex items-center gap-2 text-indigo-500 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-3 h-3" />
                                    <span>回溯灵感</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
