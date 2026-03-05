import { fonts } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export function Maintenance() {
  return (
    <div className="z-20 fixed inset-0 w-screen h-screen bg-white text-stone-800 flex flex-col items-center justify-center">
      <div className="text-center font-[var(--font-main)] p-8">
        <p className="text-4xl font-bold text-[var(--primary)]">🚧 系统维护中 🚧</p>
        <p className="text-2xl mt-8 mb-6 text-[var(--text-main)]">我们正在进行系统优化升级</p>
        <p className="text-lg text-[var(--text-muted)]">请稍候再试，感谢您的理解与支持！</p>
      </div>
    </div>
  )
}