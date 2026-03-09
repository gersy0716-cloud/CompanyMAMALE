"use client"

import { useEffect, useRef } from "react"

import { allLayoutAspectRatios, allLayouts } from "@/app/layouts"
import { useStore } from "@/app/store"
import { cn } from "@/lib/utils"

export function Page({ page }: { page: number }) {
  const zoomLevel = useStore(s => s.zoomLevel)
  const layouts = useStore(s => s.layouts)

  // attention: here we use a fallback to layouts[0]
  // if no predetermined layout exists for this page number
  const layout = layouts[page] || layouts[0]

  const LayoutElement = (allLayouts as any)[layout]
  const aspectRatio = ((allLayoutAspectRatios as any)[layout] as string) || "aspect-[250/297]"

  const currentNbPages = useStore(s => s.currentNbPages)
  const maxNbPages = useStore(s => s.maxNbPages)
  const currentNbPanelsPerPage = useStore(s => s.currentNbPanelsPerPage)

  // in the future, different layouts might have different numbers of panels
  const allLayoutsNbPanels = {
    Layout0: currentNbPanelsPerPage,
    Layout1: currentNbPanelsPerPage,
    Layout2: currentNbPanelsPerPage,
    Layout3: currentNbPanelsPerPage,
    // Layout4: currentNbPanelsPerPage
  }

  // it's a bit confusing and too rigid we can't change the layouts for each panel,
  // I should refactor this
  const panelsPerPage = ((allLayoutsNbPanels as any)[layout] as number) || currentNbPanelsPerPage


  // I think we should deprecate this part
  // this was used to keep track of the page HTML element,
  // for use with a HTML-to-bitmap library
  // but the CSS layout wasn't followed properly and it depended on the zoom level
  //
  // update: in the future if we want a good html to image convertion
  /*

  const setPage = useStore(s => s.setPage)
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = pageRef.current
    if (!element) { return }
    setPage(element)
  }, [pageRef.current])
  */


  return (
    <div
      className={cn(
        `relative flex items-center justify-center h-full w-full min-h-0 min-w-0`,
        `print:w-screen`,
        `print:break-after-all`
      )}
      style={{
        padding: `4px`
      }}
    >
      <div
        className={cn(
          aspectRatio,
          `transition-all duration-300 ease-in-out`,
          `bg-white rounded-[var(--radius-lg)]`,
          `border border-white/40 shadow-xl`,
          `print:shadow-none`,
          `print:border-0`,
          `flex flex-col max-h-full max-w-full relative shrink-0`
        )}
        style={{
          padding: `clamp(2px, 0.5vh, 4px)`,
          aspectRatio: `297 / 210`,
          height: `100%`,
          width: `auto`
        }}
      >
        <LayoutElement page={page} nbPanels={panelsPerPage} />
      </div>
      {currentNbPages > 1 &&
        <p className="w-full text-center pt-6 font-[var(--font-heading)] text-xs font-bold text-[var(--text-muted)]">
          第 {page + 1} 页 / 共 {maxNbPages} 页
        </p>}
    </div>
  )
}