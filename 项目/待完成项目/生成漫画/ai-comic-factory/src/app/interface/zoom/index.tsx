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
      <div className="font-bold text-sm mb-4 px-4 py-2 backdrop-blur-md bg-white/60 border border-white/40 text-[var(--text-main)] rounded-full shadow-lg">
        页面缩放
      </div>
      <div className="w-4 h-80">
        <VerticalSlider
          defaultValue={[zoomLevel]}
          min={30}
          max={250}
          step={1}
          onValueChange={value => setZoomLevel(value[0] || 10)}
          value={[zoomLevel]}
          className="h-full"
          orientation="vertical"
        />
      </div>
    </div>
  )
}