import { useStore } from "@/app/store"
import { VerticalSlider } from "@/components/ui/vertical-slider"
import { cn } from "@/lib/utils"

export function Zoom() {
  const zoomLevel = useStore((state) => state.zoomLevel)
  const setZoomLevel = useStore((state) => state.setZoomLevel)
  const isGeneratingStory = useStore((state) => state.isGeneratingStory)

  return (
    <div className={cn(
      `print:hidden`,
      `fixed flex flex-col items-center bottom-44 right-8 z-10`,
      `transition-all duration-300 ease-in-out font-[var(--font-main)]`,
      isGeneratingStory ? `scale-0 opacity-0` : ``,
    )}>
      <div className="font-bold text-base mb-6 px-6 py-3 backdrop-blur-xl bg-white/70 border border-white/50 text-slate-800 rounded-full shadow-xl">
        页面缩放
      </div>
      <div className="w-8 h-96 flex justify-center">
        <VerticalSlider
          defaultValue={[zoomLevel]}
          min={30}
          max={250}
          step={1}
          onValueChange={value => setZoomLevel(value[0] || 10)}
          value={[zoomLevel]}
          className="h-full w-full"
          orientation="vertical"
        />
      </div>
    </div>
  )
}