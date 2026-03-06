import { startTransition, useEffect, useState } from "react"
import { useFilePicker } from 'use-file-picker'

import { useStore } from "@/app/store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { upscaleImage } from "@/app/engine/render"
import { sleep } from "@/lib/sleep"

import { useLocalStorage } from "usehooks-ts"
import { localStorageKeys } from "../settings-dialog/localStorageKeys"
import { defaultSettings } from "../settings-dialog/defaultSettings"
import { getParam } from "@/lib/getParam"
import { Advert } from "../advert"


function BottomBar() {
  // deprecated, as HTML-to-bitmap didn't work that well for us
  // const page = useStore(s => s.page)
  // const download = useStore(s => s.download)
  // const pageToImage = useStore(s => s.pageToImage)

  const isGeneratingStory = useStore(s => s.isGeneratingStory)
  const prompt = useStore(s => s.prompt)
  const panelGenerationStatus = useStore(s => s.panelGenerationStatus)

  const preset = useStore(s => s.preset)

  const canSeeBetaFeatures = false // getParam<boolean>("beta", false)

  const allStatus = Object.values(panelGenerationStatus)
  const remainingImages = allStatus.reduce((acc, s) => (acc + (s ? 1 : 0)), 0)

  const currentClap = useStore(s => s.currentClap)

  const upscaleQueue = useStore(s => s.upscaleQueue)
  const renderedScenes = useStore(s => s.renderedScenes)
  const removeFromUpscaleQueue = useStore(s => s.removeFromUpscaleQueue)
  const setRendered = useStore(s => s.setRendered)
  const [isUpscaling, setUpscaling] = useState(false)

  const loadClap = useStore(s => s.loadClap)
  const downloadClap = useStore(s => s.downloadClap)

  const [hasGeneratedAtLeastOnce, setHasGeneratedAtLeastOnce] = useLocalStorage<boolean>(
    localStorageKeys.hasGeneratedAtLeastOnce,
    defaultSettings.hasGeneratedAtLeastOnce
  )

  const handleUpscale = () => {
    setUpscaling(true)
    startTransition(() => {
      const fn = async () => {
        for (let [panelId, renderedScene] of Object.entries(upscaleQueue)) {
          try {
            console.log(`upscaling panel ${panelId} (${renderedScene.renderId})`)
            const result = await upscaleImage(renderedScene.assetUrl)
            await sleep(1000)
            if (result.assetUrl) {
              console.log(`upscale successful, removing ${panelId} (${renderedScene.renderId}) from upscale queue`)
              setRendered(panelId, {
                ...renderedScene,
                assetUrl: result.assetUrl
              })
              removeFromUpscaleQueue(panelId)
            }

          } catch (err) {
            console.error(`failed to upscale: ${err}`)
          }
        }

        setUpscaling(false)
      }

      fn()
    })
  }

  const handlePrint = () => {
    window.print()
  }
  const hasFinishedGeneratingImages = allStatus.length > 0 && (allStatus.length - remainingImages) === allStatus.length

  // keep track of the first generation, independently of the login status
  useEffect(() => {
    if (hasFinishedGeneratingImages && !hasGeneratedAtLeastOnce) {
      setHasGeneratedAtLeastOnce(true)
    }
  }, [hasFinishedGeneratingImages, hasGeneratedAtLeastOnce])

  const { openFilePicker, filesContent } = useFilePicker({
    accept: '.clap',
    readAs: "ArrayBuffer"
  })
  const fileData = filesContent[0]

  useEffect(() => {
    const fn = async () => {
      if (fileData?.name) {
        try {
          const blob = new Blob([fileData.content])
          await loadClap(blob)
        } catch (err) {
          console.error("failed to load the Clap file:", err)
        }
      }
    }
    fn()
  }, [fileData?.name])


  const handleSave = () => {
    console.log("Saving work to database... (Logic to be implemented in InteractiveDisplay integration)")
    alert("作品保存逻辑已触发（请查阅开发文档了解集成说明）")
  }

  return (
    <div className={cn(
      `print:hidden`,
      `fixed bottom-10 left-1/2 -translate-x-1/2`,
      `flex flex-row items-center px-12 py-6`,
      `bg-white/80 backdrop-blur-3xl border border-white/50 shadow-2xl rounded-full`,
      `space-x-8 pointer-events-auto`,
      isGeneratingStory ? `scale-0 opacity-0` : `scale-100 opacity-100`,
      `transition-all duration-500 ease-in-out`
    )}>
      <Button
        onClick={handleSave}
        disabled={!prompt?.length || remainingImages > 0}
        className="h-16 xl:h-18 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:scale-105 active:scale-90 transition-all rounded-full px-12 xl:px-16 font-bold text-xl xl:text-2xl shadow-xl shadow-blue-500/30 text-white"
      >
        {remainingImages ? `正在生成...` : `保存作品`}
      </Button>
    </div>
  )
}

export default BottomBar