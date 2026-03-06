"use client"

import { Suspense, useEffect, useRef, useState, useTransition } from "react"
import { useLocalStorage } from "usehooks-ts"

import { cn } from "@/lib/utils"
import { fonts } from "@/lib/fonts"
import { GeneratedPanel } from "@/types"
import { joinWords } from "@/lib/joinWords"
import { useDynamicConfig } from "@/lib/useDynamicConfig"
import { Button } from "@/components/ui/button"

import { HeroSection } from "./interface/hero-section"
import { useStore } from "./store"
import { Zoom } from "./interface/zoom"
import { BottomBar } from "./interface/bottom-bar"
import { Page } from "./interface/page"
import { getStoryContinuation } from "./queries/getStoryContinuation"
import { localStorageKeys } from "./interface/settings-dialog/localStorageKeys"
import { defaultSettings } from "./interface/settings-dialog/defaultSettings"
import { useLLMVendorConfig } from "@/lib/useLLMVendorConfig"
import { saveComicRecord, updateComicRecord } from "./queries/saveComicRecord"
import { getSettings } from "./interface/settings-dialog/getSettings"

export default function Main() {
  const [_isPending, startTransition] = useTransition()

  const llmVendorConfig = useLLMVendorConfig()
  const { config, isConfigReady } = useDynamicConfig()
  const isGeneratingStory = useStore(s => s.isGeneratingStory)
  const setGeneratingStory = useStore(s => s.setGeneratingStory)

  const font = useStore(s => s.font)
  const preset = useStore(s => s.preset)
  const prompt = useStore(s => s.prompt)

  const currentNbPages = useStore(s => s.currentNbPages)
  const maxNbPages = useStore(s => s.maxNbPages)
  const previousNbPanels = useStore(s => s.previousNbPanels)
  const currentNbPanels = useStore(s => s.currentNbPanels)
  const maxNbPanels = useStore(s => s.maxNbPanels)

  const setCurrentNbPanelsPerPage = useStore(s => s.setCurrentNbPanelsPerPage)
  const setMaxNbPanelsPerPage = useStore(s => s.setMaxNbPanelsPerPage)
  const setCurrentNbPages = useStore(s => s.setCurrentNbPages)
  const setMaxNbPages = useStore(s => s.setMaxNbPages)

  const panels = useStore(s => s.panels)
  const setPanels = useStore(s => s.setPanels)

  // do we need those?
  const renderedScenes = useStore(s => s.renderedScenes)

  const speeches = useStore(s => s.speeches)
  const setSpeeches = useStore(s => s.setSpeeches)

  const captions = useStore(s => s.captions)
  const setCaptions = useStore(s => s.setCaptions)

  const zoomLevel = useStore(s => s.zoomLevel)

  const [waitABitMore, setWaitABitMore] = useState(false)

  const [userDefinedMaxNumberOfPages, setUserDefinedMaxNumberOfPages] = useLocalStorage<number>(
    localStorageKeys.userDefinedMaxNumberOfPages,
    defaultSettings.userDefinedMaxNumberOfPages
  )

  const [dbRecordId, setDbRecordId] = useState<number | null>(null)

  const numberOfPanels = Object.keys(panels).length
  const panelGenerationStatus = useStore(s => s.panelGenerationStatus)
  const allStatus = Object.values(panelGenerationStatus)
  const numberOfPendingGenerations = allStatus.reduce((acc, s) => (acc + (s ? 1 : 0)), 0)

  const hasAtLeastOnePage = numberOfPanels > 0

  const hasNoPendingGeneration =
    numberOfPendingGenerations === 0

  const hasStillMorePagesToGenerate =
    currentNbPages < maxNbPages

  const showNextPageButton =
    hasAtLeastOnePage &&
    hasNoPendingGeneration &&
    hasStillMorePagesToGenerate

  /*
  console.log("<Main>: " + JSON.stringify({
    currentNbPages,
    hasAtLeastOnePage,
    numberOfPendingGenerations,
    hasNoPendingGeneration,
    hasStillMorePagesToGenerate,
    showNextPageButton
  }, null, 2))
  */

  useEffect(() => {
    if (maxNbPages !== userDefinedMaxNumberOfPages) {
      setMaxNbPages(userDefinedMaxNumberOfPages)
    }
  }, [maxNbPages, userDefinedMaxNumberOfPages])

  // self-repair: clear old corrupted or mismatched keys
  useEffect(() => {
    try {
      const keysToClear = [
        "AI_COMIC_FACTORY_MAMALE_API_KEY",
        "AI_COMIC_FACTORY_MAMALE_API_KEY_V2",
        "AI_COMIC_FACTORY_MAMALE_API_KEY_V3"
      ]
      let reloaded = false
      keysToClear.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`Cleaning up old key: ${key}`)
          localStorage.removeItem(key)
          reloaded = true
        }
      })
      if (reloaded) window.location.reload()
    } catch (e) { }
  }, [])


  const ref = useRef({
    existingPanels: [] as GeneratedPanel[],
    newPanelsPrompts: [] as string[],
    newSpeeches: [] as string[],
    newCaptions: [] as string[],
    prompt: "",
    preset: "",
  })

  useEffect(() => {
    if (isConfigReady) {

      // note: this has very low impact at the moment as we are always using the value 4
      // however I would like to progressively evolve the code to make it dynamic
      setCurrentNbPanelsPerPage(config.nbPanelsPerPage)
      setMaxNbPanelsPerPage(config.nbPanelsPerPage)
    }
  }, [JSON.stringify(config), isConfigReady])

  // react to prompt changes
  useEffect(() => {
    // console.log(`main.tsx: asked to re-generate!!`)
    if (!prompt) { return }


    // a quick and dirty hack to skip prompt regeneration,
    // unless the prompt has really changed
    if (
      prompt === useStore.getState().currentClap?.meta.description
    ) {
      console.log(`loading a pre-generated comic, so skipping prompt regeneration..`)
      return
    }

    // if the prompt or preset changed, we clear the cache
    // this part is important, otherwise when trying to change the prompt
    // we wouldn't still have remnants of the previous comic
    // in the data sent to the LLM (also the page cursor would be wrong)
    if (
      prompt !== ref.current.prompt ||
      preset?.label !== ref.current.preset) {
      // console.log("overwriting ref.current!")
      ref.current = {
        existingPanels: [],
        newPanelsPrompts: [],
        newSpeeches: [],
        newCaptions: [],
        prompt,
        preset: preset?.label || "",
      }
    }

    startTransition(async () => {
      setWaitABitMore(false)
      setGeneratingStory(true)

      let stylePrompt = ""
      let userStoryPrompt = prompt

      if (prompt.includes("||")) {
        const parts = prompt.split("||").map(x => x.trim())
        stylePrompt = parts[0]
        userStoryPrompt = parts[1]
      }

      // we have to limit the size of the prompt, otherwise the rest of the style won't be followed

      let limitedStylePrompt = stylePrompt.trim().slice(0, 77).trim()
      if (limitedStylePrompt.length !== stylePrompt.length) {
        console.log("Sorry folks, the style prompt was cut to:", limitedStylePrompt)
      }

      // new experimental prompt: let's drop the user prompt, and only use the style
      const lightPanelPromptPrefix: string = joinWords(preset.imagePrompt(limitedStylePrompt))

      // this prompt will be used if the LLM generation failed
      const degradedPanelPromptPrefix: string = joinWords([
        ...preset.imagePrompt(limitedStylePrompt),

        // we re-inject the story, then
        userStoryPrompt
      ])

      // we always generate panels 2 by 2
      const nbPanelsToGenerate = 2

      /*
      console.log("going to call getStoryContinuation based on: " + JSON.stringify({
        previousNbPanels,
        currentNbPanels,
        nbPanelsToGenerate,
        "ref.current:": ref.current,
      }, null, 2))
      */

      for (
        let currentPanel = previousNbPanels;
        currentPanel < currentNbPanels;
        currentPanel += nbPanelsToGenerate
      ) {
        try {
          const candidatePanels = await getStoryContinuation({
            preset,
            stylePrompt,
            userStoryPrompt,
            nbPanelsToGenerate,
            maxNbPanels,

            // existing panels are critical here: this is how we can
            // continue over an existing story
            existingPanels: ref.current.existingPanels,

            llmVendorConfig,
          })
          // console.log("LLM generated some new panels:", candidatePanels)

          ref.current.existingPanels.push(...candidatePanels)
          // console.log("ref.current.existingPanels.push(...candidatePanels) successful, now we have ref.current.existingPanels = ", ref.current.existingPanels)

          // console.log(`main.tsx: converting the ${nbPanelsToGenerate} new panels into image prompts..`)

          const startAt = currentPanel
          const endAt = currentPanel + nbPanelsToGenerate
          for (let p = startAt; p < endAt; p++) {
            ref.current.newCaptions.push(ref.current.existingPanels[p]?.caption.trim() || "...")
            ref.current.newSpeeches.push(ref.current.existingPanels[p]?.speech.trim() || "...")
            const newPanel = joinWords([

              // what we do here is that ideally we give full control to the LLM for prompting,
              // unless there was a catastrophic failure, in that case we preserve the original prompt
              ref.current.existingPanels[p]?.instructions
                ? lightPanelPromptPrefix
                : degradedPanelPromptPrefix,

              ref.current.existingPanels[p]?.instructions || ""
            ])
            ref.current.newPanelsPrompts.push(newPanel)

            console.log(`main.tsx: image prompt for panel ${p} => "${newPanel}"`)
          }

          // update the frontend
          // console.log("updating the frontend..")
          setSpeeches(ref.current.newSpeeches)
          setCaptions(ref.current.newCaptions)
          setPanels(ref.current.newPanelsPrompts)
          setGeneratingStory(false)

          // Save to database
          const settings = getSettings()
          const recordId = await saveComicRecord({
            prompt: prompt,
            styleId: preset.id,
            panelsData: ref.current.existingPanels,
            token: settings.mamaleApiKey,
            tenantId: "c1863285-25d1-44fe-805c-5ddf611f83d3"
          })
          setDbRecordId(recordId)

          // TODO generate the clap here

        } catch (err) {
          console.log("main.tsx: LLM generation failed:", err)
          setGeneratingStory(false)
          break
        }

        if (currentPanel > (currentNbPanels / 2)) {
          console.log("main.tsx: we are halfway there, hold tight!")
          // setWaitABitMore(true)
        }

        // we could sleep here if we want to
        // await sleep(1000)
      }

      /*
      setTimeout(() => {
        setGeneratingStory(false)
        setWaitABitMore(false)
      }, enableRateLimiter ? 12000 : 0)
      */

    })
  }, [
    prompt,
    preset?.label,
    previousNbPanels,
    currentNbPanels,
    maxNbPanels
  ]) // important: we need to react to preset changes too

  // Update record when images are ready
  useEffect(() => {
    if (!dbRecordId) return

    const settings = getSettings()
    const imageUrls = panels.map((_, i) => renderedScenes[i]?.assetUrl || "")
    const allFinished = imageUrls.every(url => !!url) || (numberOfPendingGenerations === 0 && panels.length > 0)

    if (panels.length > 0) {
      updateComicRecord({
        recordId: dbRecordId,
        imageUrls,
        token: settings.mamaleApiKey
      })
    }
  }, [JSON.stringify(renderedScenes), dbRecordId])

  return (
    <Suspense>
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/4 w-[600px] h-[600px] bg-cyan-400/15 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '10s' }}></div>
      </div>

      {/* Hero Section Header */}
      <div className="w-full flex flex-col items-center pt-20 pb-8 z-10 relative">
        <h1 className="font-[var(--font-heading)] font-extrabold text-5xl tracking-tight mb-4 text-slate-800">
          AI 生漫画
        </h1>
        <p className="text-xl text-slate-600 mb-10 font-medium">一句话，开启你的漫画宇宙</p>
        <HeroSection />
      </div>

      <div className={cn(
        `flex flex-col items-center`,
        `transition-all duration-500 ease-in-out`,
        `px-4 md:px-8 pb-32`,
        `min-h-screen w-full`,
        `relative z-0`
      )}>
        <div className={cn(
          `glass-card`,
          `w-full max-w-[1700px]`,
          `rounded-[var(--radius-lg)]`,
          `shadow-2xl shadow-blue-500/10`,
          `p-6 md:p-10 lg:p-16`,
          `transition-all duration-500`,
          zoomLevel > 105 ? `px-0` : ``
        )}>
          <div className={cn(
            `flex flex-col`,
            `space-y-12`
          )}>
            <div className={cn(
              `comic-page`,
              `grid grid-cols-1`,
              currentNbPages > 1 ? `lg:grid-cols-2` : ``,
              `gap-12 md:gap-16 lg:gap-24`,
              `items-start justify-center`,
              `mx-auto w-full`,
              `print:grid-cols-1 print:gap-4`
            )}
              style={{
                width: `${zoomLevel}%`
              }}>
              {Array(currentNbPages).fill(0).map((_, i) => (
                <Page key={i} page={i} />
              ))}
            </div>

            {showNextPageButton && (
              <div className={cn(
                `flex flex-col items-center space-y-4 pt-8 pb-12`,
                `print:hidden`
              )}>
                <div className="text-[var(--text-muted)] font-medium">对当前故事满意吗？</div>
                <Button
                  className="bg-[var(--secondary)] hover:scale-105 transition-transform rounded-full px-8 h-12"
                  onClick={() => {
                    setCurrentNbPages(currentNbPages + 1)
                  }}
                >
                  继续生成第 {currentNbPages + 1} 页 👀
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Zoom />
      <BottomBar />

      {/* Loading Overlay */}
      <div className={cn(
        `print:hidden`,
        `z-50 fixed inset-0`,
        `flex flex-row items-center justify-center`,
        `transition-all duration-500 ease-in-out`,
        isGeneratingStory
          ? `bg-white/40 backdrop-blur-xl`
          : `opacity-0 pointer-events-none`,
        `font-[var(--font-heading)]`
      )}>
        <div className={cn(
          `text-center p-12 bg-white/80 rounded-[var(--radius-lg)] shadow-2xl border border-white/50`,
          `transition-all duration-500 ease-in-out transform`,
          isGeneratingStory ? `scale-100 opacity-100` : `scale-90 opacity-0`,
        )}>
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent mb-2">
            {waitABitMore ? `正在努力加载中...` : '正在构思精彩分镜...'}
          </div>
          <div className="text-[var(--text-muted)]">
            {waitABitMore ? `请求较多，请稍候片刻...` : '码码乐 AI 正在为您排版布局'}
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="fixed bottom-6 right-8 z-30 flex flex-col items-end space-y-2 pointer-events-none">
        <div className="glass-card px-4 py-2 rounded-full text-xs font-bold text-slate-600 shadow-sm pointer-events-auto">
          码码乐 AI 漫画工厂 v1.2.3
        </div>
      </div>
    </Suspense>
  )
}
