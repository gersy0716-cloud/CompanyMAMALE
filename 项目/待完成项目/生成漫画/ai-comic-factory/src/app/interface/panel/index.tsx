"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { RxReload, RxPencil2 } from "react-icons/rx"
import { useLocalStorage } from "usehooks-ts"

import { RenderedScene, RenderingModelVendor } from "@/types"
import { getRender, newRender } from "@/app/engine/render"
import { useStore } from "@/app/store"
import { injectSpeechBubbleInTheBackground } from "@/lib/bubble/injectSpeechBubbleInTheBackground"
import { cn } from "@/lib/utils"
import { getInitialRenderedScene } from "@/lib/getInitialRenderedScene"
import { Progress } from "@/app/interface/progress"
import { Button } from "@/components/ui/button"

import { EditModal } from "../edit-modal"
import { getSettings } from "../settings-dialog/getSettings"
import { localStorageKeys } from "../settings-dialog/localStorageKeys"
import { defaultSettings } from "../settings-dialog/defaultSettings"

import { Bubble } from "./bubble"

export function Panel({
  page,
  nbPanels,
  panel,
  className = "",
  width = 1,
  height = 1,
}: {
  // page number of which the panel is
  page: number

  // the number of panels should be unique to each layout
  nbPanels: number

  // panel id, between 0 and (nbPanels - 1)
  panel: number

  className?: string
  width?: number
  height?: number
}) {
  // index of the panel in the whole app
  const panelIndex = page * nbPanels + panel

  // the panel Id must be unique across all pages
  const panelId = `${panelIndex}`

  const [mouseOver, setMouseOver] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  const font = useStore(s => s.font)
  const preset = useStore(s => s.preset)

  const setGeneratingImages = useStore(s => s.setGeneratingImages)

  const panels = useStore(s => s.panels)
  const prompt = panels[panelIndex] || ""

  const setPanelPrompt = useStore(s => s.setPanelPrompt)

  const showSpeeches = useStore(s => s.showSpeeches)

  const speeches = useStore(s => s.speeches)
  const speech = speeches[panelIndex] || ""
  const setPanelSpeech = useStore(s => s.setPanelSpeech)

  const captions = useStore(s => s.captions)
  const caption = captions[panelIndex] || ""
  const setPanelCaption = useStore(s => s.setPanelCaption)

  const zoomLevel = useStore(s => s.zoomLevel)

  const addToUpscaleQueue = useStore(s => s.addToUpscaleQueue)
  const dbRecordId = useStore(s => s.dbRecordId)

  const [_isPending, startTransition] = useTransition()
  const renderedScenes = useStore(s => s.renderedScenes)
  const setRendered = useStore(s => s.setRendered)

  const rendered = renderedScenes[panelIndex] || getInitialRenderedScene()

  const [revision, setRevision] = useState(0)

  // keep a ref in sync
  const renderedRef = useRef<RenderedScene>()
  const renderedKey = JSON.stringify(rendered)
  useEffect(() => { renderedRef.current = rendered }, [renderedKey])

  const timeoutRef = useRef<any>(null)

  const enableRateLimiter = true

  const [renderingModelVendor] = useLocalStorage<RenderingModelVendor>(
    localStorageKeys.renderingModelVendor,
    defaultSettings.renderingModelVendor
  )

  let delay = enableRateLimiter ? (2000 * panelIndex) : 1000

  if (renderingModelVendor === "REPLICATE") {
    delay += 8000
  }

  const nbFrames = preset.id.startsWith("video")
    ? 16
    : 1

  const startImageGeneration = ({ prompt, width, height, nbFrames, revision }: {
    prompt: string
    width: number
    height: number
    nbFrames: number
    revision: number
  }) => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    if (!prompt?.length) { return }

    setGeneratingImages(panelId, true)
    setRendered(panelId, getInitialRenderedScene())

    setTimeout(() => {
      startTransition(async () => {
        const withCache = revision === 0
        let cacheInvalidationHack = ""
        const nbMaxRevisions = 20
        for (let i = 0; i < revision && revision < nbMaxRevisions; i++) {
          const j = Math.random()
          cacheInvalidationHack += j < 0.3 ? "_" : j < 0.6 ? "," : "-"
        }

        let newRendered: RenderedScene
        try {
          newRendered = await newRender({
            prompt: cacheInvalidationHack + " " + prompt,
            width,
            height,
            nbFrames,
            withCache: revision === 0,
            settings: getSettings(),
          })
          if (!newRendered.status || newRendered.status === "error") {
            throw new Error(newRendered.error || "invalid status")
          }
        } catch (err) {
          await sleep(3000 + Math.random() * 3000)
          try {
            newRendered = await newRender({
              prompt: cacheInvalidationHack + "   " + prompt,
              width,
              height,
              nbFrames,
              withCache,
              settings: getSettings(),
            })
            if (!newRendered.status || newRendered.status === "error") {
              throw new Error(newRendered.error || "invalid status")
            }
          } catch (err2) {
            newRendered = {
              renderId: "",
              status: "error",
              assetUrl: "",
              alt: prompt,
              maskUrl: "",
              error: `${err2 instanceof Error ? err2.message : String(err2)}`,
              segments: []
            }
          }
        }

        if (newRendered) {
          setRendered(panelId, newRendered)
          if (newRendered.status === "completed") {
            setGeneratingImages(panelId, false)
            addToUpscaleQueue(panelId, newRendered)
          } else if (newRendered.status === "error") {
            setGeneratingImages(panelId, false)
          }
        } else {
          setRendered(panelId, {
            renderId: "",
            status: "error",
            assetUrl: "",
            alt: prompt,
            maskUrl: "",
            error: "empty newRendered",
            segments: []
          })
          setGeneratingImages(panelId, false)
        }
      })
    }, enableRateLimiter ? 1000 * panel : 0)
  }

  const checkStatus = () => {
    startTransition(async () => {
      clearTimeout(timeoutRef.current)
      if (!renderedRef.current?.renderId || renderedRef.current?.status !== "pending") {
        timeoutRef.current = setTimeout(checkStatus, delay)
        return
      }
      try {
        setGeneratingImages(panelId, true)
        const newRendered = await getRender(renderedRef.current.renderId, getSettings())
        if (JSON.stringify(renderedRef.current) !== JSON.stringify(newRendered)) {
          setRendered(panelId, renderedRef.current = newRendered)
          setGeneratingImages(panelId, true)
        }
        if (newRendered.status === "pending") {
          timeoutRef.current = setTimeout(checkStatus, delay)
        } else if (newRendered.status === "error" || (newRendered.status === "completed" && !newRendered.assetUrl?.length)) {
          console.error("Panel generation failed, aborting status check")
          setGeneratingImages(panelId, false)
        } else {
          setGeneratingImages(panelId, false)
          addToUpscaleQueue(panelId, newRendered)
        }
      } catch (err) {
        console.error(err)
        timeoutRef.current = setTimeout(checkStatus, delay)
      }
    })
  }

  useEffect(() => {
    if (!prompt.length) { return }
    const renderedScene = useStore.getState().renderedScenes[panelIndex]
    if (renderedScene && renderedScene.status === "pregenerated" && renderedScene.assetUrl) {
      return
    }
    startImageGeneration({ prompt, width, height, nbFrames, revision })
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(checkStatus, delay)
    return () => { clearTimeout(timeoutRef.current) }
  }, [prompt, width, height, nbFrames, revision])

  const frameClassName = cn(
    `relative w-full h-full bg-white/80 transition-all duration-300 ease-in-out shadow-xl hover:shadow-2xl hover:scale-[1.01] overflow-hidden border border-white/40 print:border-[1.5px] print:shadow-none`,
    zoomLevel > 140 ? `rounded-3xl` :
      zoomLevel > 120 ? `rounded-2xl` :
        zoomLevel > 90 ? `rounded-xl` :
          zoomLevel > 40 ? `rounded-lg` : `rounded-none`,
  )

  const handleReload = () => setRevision(revision + 1)
  const handleSavePrompt = (newPrompt: string) => setPanelPrompt(newPrompt, panelIndex)
  const handleSaveSpeech = (newSpeech: string) => setPanelSpeech(newSpeech, panelIndex)
  const handleSaveCaption = (newCaption: string) => setPanelCaption(newCaption, panelIndex)

  if (prompt && !rendered.assetUrl) {
    return (
      <div className={cn(frameClassName, `flex flex-col items-center justify-center p-8 text-center`, className)}>
        {rendered.status === "error" ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="text-4xl text-slate-300 mb-2">⚠️</div>
            <div className="text-slate-500 font-bold text-sm text-slate-600">
              {rendered.error?.includes("Limit") ? "绘图接口并发已达上限" : "生成出错了"}
            </div>
            {rendered.error?.includes("Limit") ? (
              <p className="text-slate-400 text-xs mt-1 px-4 leading-relaxed">
                码码乐的绘图服务器目前正忙<br />请等待约 10-30 秒后再次尝试
              </p>
            ) : null}
            <Button
              variant="outline" size="sm" onClick={handleReload}
              className="mt-2 rounded-full border-slate-200 text-slate-500 hover:bg-slate-50 font-bold px-6 shadow-sm"
            >
              再试一次
            </Button>
          </div>
        ) : (
          <Progress isLoading />
        )}
      </div>
    )
  }

  const hasSucceededOrFailed =
    rendered.status === "completed" ||
    rendered.status === "error" ||
    rendered.status === "pregenerated"

  return (
    <div className={cn(frameClassName, { "grayscale": preset.color === "grayscale" }, className)}
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => setMouseOver(false)}
    >
      {(prompt && rendered.assetUrl && speech) ? <Bubble variant="speech" onChange={handleSaveSpeech}>{speech}</Bubble> : null}
      {(prompt && rendered.assetUrl && caption) ? <Bubble variant="caption" onChange={handleSaveCaption}>{caption}</Bubble> : null}
      <div className={cn(`absolute top-0 w-full flex justify-between p-2 space-x-2 print:hidden`)}>
        {!dbRecordId && (
          <>
            <div onClick={hasSucceededOrFailed ? handleReload : undefined}
              className={cn(
                `glass-card border-none flex flex-row space-x-2 items-center py-1.5 px-4 md:py-2 md:px-5 transition-all duration-200 ease-in-out shadow-lg`,
                hasSucceededOrFailed ? "opacity-95 cursor-pointer hover:bg-white hover:scale-105" : "opacity-50 cursor-wait",
                mouseOver && hasSucceededOrFailed ? `scale-100 opacity-100` : `scale-0`
              )}>
              <RxReload className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              <span className={cn(zoomLevel > 80 ? `text-xs md:text-sm lg:text-base` : zoomLevel > 40 ? `text-2xs md:text-xs lg:text-sm` : `text-3xs md:text-2xs lg:text-xs`)}>Redraw</span>
            </div>
            <EditModal isEnabled={hasSucceededOrFailed} existingPrompt={prompt} onSave={handleSavePrompt}>
              <div className={cn(
                `glass-card border-none flex flex-row space-x-2 items-center py-1.5 px-4 md:py-2 md:px-5 cursor-pointer transition-all duration-200 ease-in-out shadow-lg`,
                hasSucceededOrFailed ? "opacity-95 hover:bg-white hover:scale-105" : "opacity-50",
                mouseOver && hasSucceededOrFailed ? `scale-100 opacity-100` : `scale-0`
              )}>
                <RxPencil2 className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:w-5" />
                <span className={cn(zoomLevel > 80 ? `text-xs md:text-sm lg:text-base` : zoomLevel > 40 ? `text-2xs md:text-xs lg:text-sm` : `text-3xs md:text-2xs lg:text-xs`)}>Edit</span>
              </div>
            </EditModal>
          </>
        )}
      </div>
      {rendered.assetUrl && (
        <img ref={ref} src={rendered.assetUrl} width={width} height={height} alt={rendered.alt} className="comic-panel w-full h-full object-cover" />
      )}
    </div>
  )
}