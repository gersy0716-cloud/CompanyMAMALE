"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const VerticalSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative w-4 h-full grow overflow-hidden rounded-full bg-stone-300/50 dark:bg-stone-700/50 backdrop-blur-sm border border-white/20">
      <SliderPrimitive.Range className="absolute w-full bg-[var(--primary)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block -ml-[12px] h-10 w-10 rounded-full border-4 border-white bg-white shadow-xl ring-offset-white transition-all hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-stone-50 dark:bg-stone-700 dark:ring-offset-stone-950 dark:focus-visible:ring-stone-300 cursor-pointer" />
  </SliderPrimitive.Root>
))
VerticalSlider.displayName = "VerticalSlider"
export { VerticalSlider }
