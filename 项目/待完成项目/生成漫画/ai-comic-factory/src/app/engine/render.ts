
import { v4 as uuidv4 } from "uuid"
import { RenderedScene, Settings } from "@/types"

/**
 * Image Generation Fallback Configuration
 * Prioritized sequence: gemini-3.1-flash-image-preview -> gemini-3-pro-image-preview-2k -> nano-banana-2
 */

const serverImageApiUrl = "https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream"
const serverImageApiToken = "c1863285-25d1-44fe-805c-5ddf611f83d3"

const FALLBACK_MODELS = [
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview-2k",
  "nano-banana-2"
]

export async function newRender({
  prompt,
  width,
  height,
  nbFrames,
  withCache,
  settings,
}: {
  prompt: string
  width: number
  height: number
  nbFrames: number
  withCache: boolean
  settings: Settings
}) {
  if (!prompt) {
    throw new Error("cannot call the rendering API without a prompt")
  }

  console.log(`[Render] Starting image generation for: "${prompt.substring(0, 50)}..."`)

  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`[Render] Attempting with model: ${model}`)

      const res = await fetch(`${serverImageApiUrl}?__tenant=${serverImageApiToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          prompt,
          size: "1024*1024",
          n: 1,
          stream: false
        }),
        cache: "no-store"
      })

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`)
      }

      const result = await res.json()

      // Handle both OpenAI standard format and internal Mamale formats
      let imageUrl = ""
      if (result.data && Array.isArray(result.data) && result.data[0]?.url) {
        imageUrl = result.data[0].url
      } else if (result.url) {
        imageUrl = result.url
      } else if (result.result) {
        imageUrl = result.result
      } else if (result.images && Array.isArray(result.images) && result.images[0]) {
        imageUrl = result.images[0]
      }

      if (imageUrl) {
        console.log(`[Render] Successfully generated image with model: ${model}`)
        return {
          renderId: uuidv4(),
          status: "completed",
          assetUrl: imageUrl,
          alt: prompt,
          error: "",
          maskUrl: "",
          segments: []
        } as RenderedScene
      }

      throw new Error(`Model ${model} returned no image URL`)
    } catch (err) {
      console.error(`[Render] Fallback: Model ${model} failed -`, err instanceof Error ? err.message : String(err))
      // Continue to next model in the list
    }
  }

  const finalError = "All image generation models failed after trying the entire fallback chain."
  console.error(`[Render] ${finalError}`)

  return {
    renderId: "",
    status: "error",
    assetUrl: "",
    alt: prompt,
    error: finalError,
    maskUrl: "",
    segments: []
  } as RenderedScene
}

/**
 * Polling function kept for interface compatibility.
 * Since we use a synchronous unified API, this usually won't be called for long-running tasks.
 */
export async function getRender(renderId: string, settings: Settings) {
  if (!renderId) {
    return {
      renderId: "",
      status: "error",
      error: "Missing renderId",
      assetUrl: "",
      alt: "",
      maskUrl: "",
      segments: []
    } as RenderedScene
  }

  // Compatibility return
  return {
    renderId,
    status: "completed",
    assetUrl: "",
    alt: "",
    error: "Direct image URL provided in newRender",
    maskUrl: "",
    segments: []
  } as RenderedScene
}

/**
 * Upscale function placeholder.
 */
export async function upscaleImage(image: string): Promise<{
  assetUrl: string
  error: string
}> {
  return {
    assetUrl: image,
    error: ""
  }
}
