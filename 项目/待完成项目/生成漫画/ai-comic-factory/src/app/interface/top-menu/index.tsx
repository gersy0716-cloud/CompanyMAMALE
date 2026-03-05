"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { StaticImageData } from "next/image"
import { useLocalStorage } from "usehooks-ts"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { FontName, defaultFont } from "@/lib/fonts"
import { Input } from "@/components/ui/input"
import { PresetName, defaultPreset, nonRandomPresets, presets } from "@/app/engine/presets"
import { useStore } from "@/app/store"
import { Button } from "@/components/ui/button"
import { LayoutName, defaultLayout, nonRandomLayouts } from "@/app/layouts"
import { Switch } from "@/components/ui/switch"
import { useOAuth } from "@/lib/useOAuth"
import { useIsBusy } from "@/lib/useIsBusy"

import { localStorageKeys } from "../settings-dialog/localStorageKeys"
import { defaultSettings } from "../settings-dialog/defaultSettings"
import { AuthWall } from "../auth-wall"
import { SelectLayout } from "../select-layout"
import { getLocalStorageShowSpeeches } from "@/lib/getLocalStorageShowSpeeches"

export function TopMenu() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const requestedPreset = (searchParams?.get('preset') as PresetName) || defaultPreset
  const requestedFont = (searchParams?.get('font') as FontName) || defaultFont
  const requestedStylePrompt = (searchParams?.get('stylePrompt') as string) || ""
  const requestedStoryPrompt = (searchParams?.get('storyPrompt') as string) || ""
  const requestedLayout = (searchParams?.get('layout') as LayoutName) || defaultLayout

  // const font = useStore(s => s.font)
  // const setFont = useStore(s => s.setFont)
  const preset = useStore(s => s.preset)
  const prompt = useStore(s => s.prompt)
  const layout = useStore(s => s.layout)
  const setLayout = useStore(s => s.setLayout)

  const setShowSpeeches = useStore(s => s.setShowSpeeches)
  const showSpeeches = useStore(s => s.showSpeeches)

  const setShowCaptions = useStore(s => s.setShowCaptions)
  const showCaptions = useStore(s => s.showCaptions)

  const currentNbPages = useStore(s => s.currentNbPages)
  const setCurrentNbPages = useStore(s => s.setCurrentNbPages)

  const generate = useStore(s => s.generate)

  const isBusy = useIsBusy()

  const [lastDraftPromptA, setLastDraftPromptA] = useLocalStorage<string>(
    "AI_COMIC_FACTORY_LAST_DRAFT_PROMPT_A",
    requestedStylePrompt
  )

  const [lastDraftPromptB, setLastDraftPromptB] = useLocalStorage<string>(
    "AI_COMIC_FACTORY_LAST_DRAFT_PROMPT_B",
    requestedStoryPrompt
  )


  // TODO should be in the store
  const [draftPromptA, setDraftPromptA] = useState(lastDraftPromptA)
  const [draftPromptB, setDraftPromptB] = useState(lastDraftPromptB)
  const draftPrompt = `${draftPromptA}||${draftPromptB}`

  const [draftPreset, setDraftPreset] = useState<PresetName>(requestedPreset)
  const [draftLayout, setDraftLayout] = useState<LayoutName>(requestedLayout)

  const { isLoggedIn, enableOAuthWall } = useOAuth({ debug: false })

  const [hasGeneratedAtLeastOnce, setHasGeneratedAtLeastOnce] = useLocalStorage<boolean>(
    localStorageKeys.hasGeneratedAtLeastOnce,
    defaultSettings.hasGeneratedAtLeastOnce
  )

  const [showAuthWall, setShowAuthWall] = useState(false)

  // we synchronize the draft prompt with the local storage
  useEffect(() => { if (lastDraftPromptA !== draftPromptA) { setLastDraftPromptA(draftPromptA) } }, [draftPromptA])
  useEffect(() => { if (lastDraftPromptA !== draftPromptA) { setDraftPromptA(lastDraftPromptA) } }, [lastDraftPromptA])
  useEffect(() => { if (lastDraftPromptB !== draftPromptB) { setLastDraftPromptB(draftPromptB) } }, [draftPromptB])
  useEffect(() => { if (lastDraftPromptB !== draftPromptB) { setDraftPromptB(lastDraftPromptB) } }, [lastDraftPromptB])

  // we need a use effect to properly read the local storage
  useEffect(() => {
    setShowSpeeches(getLocalStorageShowSpeeches(true))
  }, [])

  const handleSubmit = () => {
    if (enableOAuthWall && hasGeneratedAtLeastOnce && !isLoggedIn) {
      setShowAuthWall(true)
      return
    }

    const promptChanged = draftPrompt.trim() !== prompt.trim()
    const presetChanged = draftPreset !== preset.id
    const layoutChanged = draftLayout !== layout
    if (!isBusy && (promptChanged || presetChanged || layoutChanged)) {
      generate(draftPrompt, draftPreset, draftLayout)
    }
  }

  useEffect(() => {
    const layoutChanged = draftLayout !== layout
    if (layoutChanged && !isBusy) {
      setLayout(draftLayout)
    }
  }, [layout, draftLayout, isBusy])

  return (
    <div className={cn(
      `print:hidden`,
      `z-20 fixed top-6 left-6 right-6 mx-auto max-w-[95vw]`,
      `flex flex-col xl:flex-row justify-between items-center`,
      `bg-white border border-gray-200`,
      `transition-all duration-300 ease-in-out`,
      `px-8 py-5 rounded-2xl shadow-xl`,
      `space-y-4 xl:space-y-0 xl:space-x-8`,
      `font-[var(--font-main)]`
    )}>
      <div className="flex flex-row items-center space-x-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl shadow-sm transition-all border border-gray-200 active:scale-95"
        >
          <span className="text-xl">←</span>
          <span className="hidden md:inline">返回主页</span>
        </button>
        <div className="flex flex-row items-center font-[var(--font-heading)] font-bold text-3xl tracking-tighter mr-4">
          <span className="text-slate-800">码码乐</span>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-2">AI</span>
        </div>
      </div>
      <div className="flex flex-row items-center space-x-4 md:space-x-6 w-full xl:w-auto">
        <div className={cn(
          `transition-all duration-200 ease-in-out`,
          `flex flex-row items-center justify-start space-x-4`,
          `flex-grow`
        )}>

          {/* <Label className="flex text-2xs md:text-sm md:w-24">Style:</Label> */}

          <Select
            defaultValue={defaultPreset}
            onValueChange={(value) => { setDraftPreset(value as PresetName) }}
            disabled={isBusy}
          >
            <SelectTrigger className="flex-grow h-14 px-6 bg-white/50 text-[var(--text-main)] border-[var(--card-border)] rounded-[var(--radius-md)]">
              <SelectValue className="text-sm md:text-base" placeholder="风格选择" />
            </SelectTrigger>
            <SelectContent>
              {nonRandomPresets.map(key =>
                <SelectItem key={key} value={key}>{presets[key].label}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className={cn(
          `transition-all duration-200 ease-in-out`,
          `flex flex-row items-center justify-start space-x-4`,
          `w-48`
        )}>

          {/* <Label className="flex text-2xs md:text-sm md:w-24">Style:</Label> */}

          <SelectLayout
            defaultValue={defaultLayout}
            onLayoutChange={setDraftLayout}
            disabled={isBusy}
            layouts={nonRandomLayouts}
          />
        </div>
        <div className="flex flex-row items-center space-x-3">
          <Switch
            className="scale-125"
            checked={showCaptions}
            onCheckedChange={setShowCaptions}
          />
          <Label className="text-[var(--text-main)] font-bold text-sm">
            <span className="hidden xl:inline">说明文字</span>
            <span className="inline xl:hidden text-lg">📖</span>
          </Label>
        </div>
        <div className="flex flex-row items-center space-x-3">
          <Switch
            className="scale-125"
            checked={showSpeeches}
            onCheckedChange={setShowSpeeches}
            defaultChecked={showSpeeches}
          />
          <Label className="text-[var(--text-main)] font-bold text-sm">
            <span className="hidden xl:inline">对话气泡</span>
            <span className="inline xl:hidden text-lg">💬</span>
          </Label>
        </div>
        {/*
        <div className={cn(
          `transition-all duration-200 ease-in-out`,
          `flex flex-row items-center space-x-3 w-1/2 md:w-auto md:hidden`
        )}>
          <Label className="flex text-2xs md:text-sm md:w-24">Font:</Label>
          <Select
            defaultValue={fontList.includes(preset.font) ? preset.font : "cartoonist"}
            onValueChange={(value) => { setFont(value as FontName) }}
            disabled={atLeastOnePanelIsBusy}
            >
            <SelectTrigger className="flex-grow">
              <SelectValue className="text-2xs md:text-sm" placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(fonts)
                .map((font) =>
                <SelectItem
                  key={font}
                  value={font}>{
                    font
                  }</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
          */}
      </div>
      <div className={cn(
        `transition-all duration-200 ease-in-out`,
        `flex  flex-grow flex-col space-y-2 md:space-y-0 md:flex-row items-center md:space-x-3 w-full md:w-auto`
      )}>
        <div className="flex flex-row flex-grow w-full">
          <div className="flex flex-row flex-grow w-full">
            <Input
              id="top-menu-input-story-prompt"
              placeholder="1. 故事内容 (如：侦探犬)"
              className={cn(
                `w-1/2 rounded-r-none h-14 text-base px-6`,
                `bg-white/50 text-[var(--text-main)] border-[var(--card-border)]`,
                `focus:bg-white rounded-l-[var(--radius-md)]`
              )}
              // disabled={atLeastOnePanelIsBusy}
              onChange={(e) => {
                setDraftPromptB(e.target.value)
              }}
              onKeyDown={({ key }) => {
                if (key === 'Enter') {
                  handleSubmit()
                }
              }}
              value={draftPromptB}
            />
            <Input
              id="top-menu-input-style-prompt"
              placeholder="2. 画面风格 (如：雨、柴犬)"
              className={cn(
                `w-1/2 rounded-l-none rounded-r-none h-14 text-base px-6`,
                `bg-white/50 text-[var(--text-main)] border-[var(--card-border)] border-l-0`,
                `focus:bg-white`
              )}
              // disabled={atLeastOnePanelIsBusy}
              onChange={(e) => {
                setDraftPromptA(e.target.value)
              }}
              onKeyDown={({ key }) => {
                if (key === 'Enter') {
                  handleSubmit()
                }
              }}
              value={draftPromptA}
            />
          </div>
          <Button
            className={cn(
              `rounded-l-none h-14 px-10 cursor-pointer`,
              `transition-all duration-300 ease-in-out`,
              `font-bold text-lg rounded-r-[var(--radius-md)]`,
              `bg-[var(--primary)] hover:scale-105 active:scale-95 shadow-lg shadow-[var(--primary-glow)]`,
              isBusy && `animate-jelly`
            )}
            onClick={() => {
              handleSubmit()
            }}
            disabled={!draftPrompt?.trim().length || isBusy}
          >
            立即生成
          </Button>

          <AuthWall show={showAuthWall} />
        </div>
      </div>
      {/*
        Let's add this feature later, because right now people
        are confused about why they can't activate it
      <div className={cn(
          `transition-all duration-200 ease-in-out`,
          `hidden md:flex flex-row items-center space-x-3 w-full md:w-auto`
      )}>
        <Label className="flex text-2xs md:text-sm w-24">Font:</Label>
        <Select
          defaultValue={fontList.includes(preset.font) ? preset.font : "actionman"}
          onValueChange={(value) => { setFont(value as FontName) }}
          // disabled={isBusy}
          disabled={true}
          >
          <SelectTrigger className="flex-grow">
            <SelectValue className="text-2xs md:text-sm" placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(fonts)
              .map((font) =>
              <SelectItem
                key={font}
                value={font}>{
                  font
                }</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
              */}
    </div>
  )
}