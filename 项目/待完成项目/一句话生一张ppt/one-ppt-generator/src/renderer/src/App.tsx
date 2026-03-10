import React from 'react'
import { InputView } from './components/InputView'
import { ResultView } from './components/ResultView'
import { HistoryView } from './components/HistoryView'
import { useStore } from './store'

const App: React.FC = () => {
    const view = useStore((state) => state.view)

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
            {/* 背景装饰 - 保持 consistent 的视觉风格 */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px] pointer-events-none" />

            <main className="flex-1 relative z-10 flex flex-col items-center justify-center">
                {view === 'input' && <InputView />}
                {view === 'result' && <ResultView />}
                {view === 'history' && <HistoryView />}
            </main>

            {/* 页脚 - 以后可以加版本号等 */}
            <footer className="p-4 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
                One Sentence One PPT • Generative Design System
            </footer>
        </div>
    )
}

export default App
