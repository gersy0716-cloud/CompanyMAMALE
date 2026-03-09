"use client"

import { ReactNode, useRef } from "react"

// import Draggable from "react-draggable"
import ContentEditable, { ContentEditableEvent } from "react-contenteditable"

import { useStore } from "@/app/store"
import { cn } from "@/lib/utils"

export function Bubble({ children, onChange, variant = "caption" }: {
  children: ReactNode;
  onChange: (newCaption: string) => void;
  variant?: "caption" | "speech"
}) {

  const ref = useRef<HTMLDivElement>(null)
  const zoomLevel = useStore(s => s.zoomLevel)
  const showSpeeches = useStore(s => s.showSpeeches)
  const showCaptions = useStore(s => s.showCaptions)

  const text = useRef(`${children || ''}`)

  const handleChange = (evt: ContentEditableEvent) => {
    // hmm no, this returns us some rich HTML - but it's too early for that
    // text.current = evt.target.value

    text.current = `${ref.current?.innerText || ''}`
  };

  const handleBlur = () => {
    onChange(text.current)
  };

  const isVisible = variant === "speech" ? showSpeeches : showCaptions

  // we can wrap this bubble in a <Draggable>
  // but the zoom will break it, so we will need to figure out something
  return (
    <div className={cn(
      variant === "speech" ? "top-4 md:top-6" : "bottom-2 md:bottom-4",
      `absolute flex w-full items-center justify-center pointer-events-none`,
      zoomLevel > 140 ? `px-12` : `px-6`,
      `print:p-2`
    )}>
      <div
        ref={ref}
        className={cn(
          `relative pointer-events-auto`,
          `transition-all duration-300 ease-in-out`,
          `shadow-xl`,

          // Border logic
          zoomLevel > 140 ? `border-[2px] md:border-[3px]` :
            zoomLevel > 120 ? `border-[1.5px] md:border-[2px]` :
              zoomLevel > 90 ? `border-[1px] md:border-[1.5px]` :
                `border-[0.5px]`,
          `border-slate-900`,

          // Padding logic
          zoomLevel > 180 ? `p-6 md:p-8` :
            zoomLevel > 140 ? `p-4 md:p-6` :
              zoomLevel > 100 ? `p-2 md:p-4` :
                `p-1.5 md:p-2`,

          // Font size logic (further enlarged for readability)
          zoomLevel > 220 ? `text-2xl md:text-3xl lg:text-4xl` :
            zoomLevel > 200 ? `text-xl md:text-2xl lg:text-3xl` :
              zoomLevel > 180 ? `text-lg md:text-xl lg:text-2xl` :
                zoomLevel > 140 ? `text-base md:text-lg lg:text-xl` :
                  zoomLevel > 120 ? `text-sm md:text-base lg:text-lg` :
                    zoomLevel > 100 ? `text-xs md:text-sm` :
                      `text-2xs md:text-xs`,

          // Variant specific styling
          variant === "speech"
            ? "rounded-[100px] bg-white text-slate-900 italic font-medium max-w-[85%]"
            : "rounded-none bg-transparent text-white font-bold border-none shadow-none max-w-[95%] [text-shadow:0_2px_4px_rgba(0,0,0,0.8),0_0_10px_rgba(0,0,0,0.5)]",

          isVisible ? `block animate-in fade-in zoom-in duration-500` : `hidden`,
          `text-center leading-tight`
        )}>

        {/* Speech Bubble Tail */}
        {variant === "speech" && (
          <div className={cn(
            "absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8",
            "bg-white border-r-[3px] border-b-[3px] border-slate-900 transform rotate-45 skew-x-10",
            "z-[-1]"
          )} />
        )}

        <ContentEditable
          html={text.current}
          className={cn(
            "line-clamp-3 select-text",
            variant === "caption" ? "text-xl md:text-2xl lg:text-3xl" : ""
          )}
          onBlur={handleBlur}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}