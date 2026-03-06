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
  SelectGroup,
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


  // Simplified to a single prompt
  const [draftPrompt, setDraftPrompt] = useState(lastDraftPromptB || lastDraftPromptA || "")
  const [draftPreset, setDraftPreset] = useState<PresetName>(requestedPreset)
  const [draftLayout, setDraftLayout] = useState<LayoutName>(requestedLayout)

  const { isLoggedIn, enableOAuthWall } = useOAuth({ debug: false })

  const [hasGeneratedAtLeastOnce, setHasGeneratedAtLeastOnce] = useLocalStorage<boolean>(
    localStorageKeys.hasGeneratedAtLeastOnce,
    defaultSettings.hasGeneratedAtLeastOnce
  )

  const [showAuthWall, setShowAuthWall] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // we synchronize the draft prompt with the local storage (using draftPromptB as the primary story container)
  useEffect(() => { if (lastDraftPromptB !== draftPrompt) { setLastDraftPromptB(draftPrompt) } }, [draftPrompt])
  useEffect(() => { if (lastDraftPromptB !== draftPrompt) { setDraftPrompt(lastDraftPromptB) } }, [lastDraftPromptB])

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
      `z-20 fixed top-8 left-8 right-8 mx-auto max-w-[95vw]`,
      `flex flex-col xl:flex-row justify-between items-center`,
      `glass-card backdrop-blur-3xl`,
      `transition-all duration-300 ease-in-out`,
      `px-10 py-6 rounded-[40px] border border-white/50 shadow-[0_25px_60px_rgba(0,0,0,0.15)]`,
      `space-y-6 xl:space-y-0 xl:space-x-10`,
      `font-[var(--font-main)]`
    )}>
      <div className="flex flex-row items-center space-x-6 shrink-0">
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center w-14 h-14 glass-input hover:bg-white/40 text-slate-700 rounded-full shadow-md transition-all active:scale-90"
          title="返回主页"
        >
          <span className="text-2xl">←</span>
        </button>
        <div className="flex flex-row items-center font-[var(--font-heading)] font-bold text-3xl tracking-tight mr-4">
          <span className="text-slate-800 text-2xl xl:text-3xl">码码乐</span>
          <span className="bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent ml-2 text-2xl xl:text-3xl">AI</span>
        </div>
      </div>
      {/* Middle Controls: Style, Layout, Toggles */}
      <div className="flex flex-row items-center gap-4 w-full xl:w-auto overflow-x-auto no-scrollbar py-2 px-1">
        {/* Style and Layout Group */}
        <div className="flex flex-row items-center p-1 bg-white/20 backdrop-blur-md rounded-[24px] border border-white/30 shadow-inner shrink-0">
          <div className="w-32 xl:w-40">
            <Select
              defaultValue={defaultPreset}
              onValueChange={(value) => { setDraftPreset(value as PresetName) }}
              disabled={isBusy}
            >
              <SelectTrigger className="h-10 xl:h-12 bg-transparent text-[var(--text-main)] border-none shadow-none focus:ring-0 px-4">
                <SelectValue placeholder="风格" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/40 min-w-[180px]">
                <SelectItem value="random" className="py-2.5 text-blue-600 font-bold italic">🎲 随机风格</SelectItem>
                <div className="h-px bg-white/10 my-1"></div>
                {nonRandomPresets.map(key =>
                  <SelectItem key={key} value={key} className="py-2.5">{presets[key].label}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[1px] h-6 bg-white/20 mx-1"></div>
          <div className="w-36 xl:w-44">
            <SelectLayout
              defaultValue={defaultLayout}
              onLayoutChange={setDraftLayout}
              disabled={isBusy}
              layouts={["random", ...nonRandomLayouts]}
              className="h-10 xl:h-12 bg-transparent border-none shadow-none focus:ring-0 px-4"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center gap-4 p-1 px-4 xl:px-6 bg-white/20 backdrop-blur-md rounded-[24px] border border-white/30 shadow-inner h-12 xl:h-14 shrink-0">
        <div className="flex flex-row items-center gap-2">
          <Switch
            className="scale-90 xl:scale-100 data-[state=checked]:bg-blue-500"
            checked={showCaptions}
            onCheckedChange={setShowCaptions}
          />
          <Label className="text-xs xl:text-sm font-bold text-slate-700 whitespace-nowrap cursor-pointer">
            说明文字
          </Label>
        </div>
        <div className="w-[1px] h-5 bg-white/20"></div>
        <div className="flex flex-row items-center gap-2">
          <Switch
            className="scale-90 xl:scale-100 data-[state=checked]:bg-indigo-500"
            checked={showSpeeches}
            onCheckedChange={setShowSpeeches}
            defaultChecked={showSpeeches}
          />
          <Label className="text-xs xl:text-sm font-bold text-slate-700 whitespace-nowrap cursor-pointer">
            对话气泡
          </Label>
        </div>
      </div>
      <div className={cn(
        `transition-all duration-200 ease-in-out`,
        `flex flex-grow flex-row items-center w-full xl:max-w-4xl space-x-4`
      )}>
        <div className="flex flex-row flex-grow w-full relative group h-16 xl:h-20">
          <div className="absolute inset-0 bg-blue-500/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[32px] xl:rounded-[40px]"></div>
          <Input
            id="top-menu-input-story-prompt"
            placeholder="输入您的故事具体内容（如：在月球上野餐的小狗）"
            className={cn(
              `w-full h-full pl-10 pr-64 text-lg xl:text-xl font-medium`,
              `glass-input text-[var(--text-main)] border-white/30 shadow-xl`,
              `focus:bg-white/95 focus:ring-4 focus:ring-blue-400/20 rounded-[32px] xl:rounded-[40px]`,
              `placeholder:text-slate-400 border-2`
            )}
            onChange={(e) => {
              setDraftPrompt(e.target.value)
            }}
            onKeyDown={({ key }) => {
              if (key === 'Enter') {
                handleSubmit()
              }
            }}
            value={draftPrompt}
          />
          <div className="absolute right-56 top-0 bottom-0 flex items-center h-full">
            <Button
              className="w-12 h-12 bg-white/30 hover:bg-white/50 text-slate-700 rounded-full flex items-center justify-center transition-all p-0 shadow-sm"
              onClick={() => {
                // Add fixed random prompts or clear
                const randomPrompts = [
                  "太空中的恐龙在吃披萨",
                  "在月球上野餐的小狗",
                  "森林里的精灵在跳舞",
                  "水下城市的猫咪市长",
                  "乘着筋斗云的孙悟空",
                  "在云端开派对的机器人"
                ]
                const rand = randomPrompts[Math.floor(Math.random() * randomPrompts.length)]
                setDraftPrompt(rand)
              }}
              title="随机灵感"
              disabled={isBusy}
            >
              <span className="text-xl">🎲</span>
            </Button>
          </div>
          <div className="absolute right-2 top-0 bottom-0 flex items-center h-full">
            <Button
              className={cn(
                `h-[80%] xl:h-[84%] px-8 xl:px-12 cursor-pointer !h-auto min-h-[50px]`,
                `transition-all duration-300 ease-in-out`,
                `font-bold text-lg xl:text-xl rounded-[26px] xl:rounded-[34px]`,
                `bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:to-purple-700`,
                `text-white shadow-[0_5px_15px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_30px_rgba(79,70,229,0.6)] hover:scale-[1.02] active:scale-95`,
                isBusy && `animate-jelly`
              )}
              onClick={() => {
                handleSubmit()
              }}
              disabled={!isMounted || !draftPrompt?.trim().length || isBusy}
            >
              {isBusy ? "生成中" : "立即生成"}
            </Button>
          </div>

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
    </div >
  )
}