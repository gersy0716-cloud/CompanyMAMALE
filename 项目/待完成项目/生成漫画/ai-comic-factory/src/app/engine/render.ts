
import { v4 as uuidv4 } from "uuid"
import { RenderedScene, Settings } from "@/types"

/**
 * Image Generation Fallback Configuration
 * Prioritized sequence: gemini-3.1-flash-image-preview -> gemini-3-pro-image-preview-2k -> nano-banana-2
 */

const serverImageApiUrl = "https://3w-api.mamale.vip/api/app/aiJimeng3/myTextToImage"
const serverImageApiToken = "c1863285-25d1-44fe-805c-5ddf611f83d3"

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

  console.log(`[Render] Starting image generation (Jimeng) for: "${prompt.substring(0, 50)}..."`)

  try {
    const tenant = "c1863285-25d1-44fe-805c-5ddf611f83d3"
    const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODUsImV4cCI6MTgwNDI5NjE4NSwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiMTM5ZGNhMzktNDcwYi0yYjAwLWZkMGEtM2ExNjg5NmUwYTE4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg0LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6ImxpY2tpZXNAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJGYWxzZSIsIm5hbWUiOiJsaWNraWVzIiwiaWF0IjoxNzcyNzYwMTg1LCJzY29wZSI6WyJhZGRyZXNzIiwiQ29kZUFCQyIsImVtYWlsIiwib3BlbmlkIiwicGhvbmUiLCJwcm9maWxlIiwicm9sZSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.rLKKF6SlZ7KrnF_0qszH07ZJphbHw2J-Vh1NFIA5qxpODh7xiGakUo6OLRwqVbCHwqLLLLs5iNrlMfpdgZ81BJehoTK4OnZHgImn354cPzpREjocKU85W7xcIWM9cAE23chIP3U9AygJBMsV6Yap82Np7uSlleR_CTG-3HBflF3V1E3a3-djOCItV99ty-CQ0QIt9kV1CRlRfk2_zRH_W4GRqhRGifG1rk7zdahm7tk8E5e3NCKzSwistSQhxIHl7oQMValeSneghuYh7S7s8hVNmSD0SDxDEgtu8yMD_XtN18egCpqo1y4VGjoBmVrjXlATjpYvfeXAyilrMbRlkg"
    const teachertoken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NzI3NjAxODgsImV4cCI6MTgwNDI5NjE4OCwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiNjQzNmY2OGEtZTU1Ni1mYWVmLWExYjUtM2ExNjg5N2I3NjU4IiwiYXV0aF90aW1lIjoxNzcyNzYwMTg4LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6IjE4ODU5NzczOTk5QHFxLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjoiRmFsc2UiLCJuYW1lIjoiMTg4NTk3NzM5OTkiLCJpYXQiOjE3NzI3NjAxODgsInNjb3BlIjpbImFkZHJlc3MiLCJDb2RlQUJDIiwiZW1haWwiLCJvcGVuaWQiLCJwaG9uZSIsInByb2ZpbGUiLCJyb2xlIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbInB3ZCJdfQ.MWVQ3IocjB3a3juC0Girt7X2cnzbBt98LX54glQ5PTlKmDI_sN5t8n3BcTNeOtsJK8BRPDgpyvJiOo5WkT9aZhykk5psxnQjDIwhq4Ys5K_0UrMpvmISkAYxelz8F-WD0YDQ2FyNoeDdj5d77zW9fPjXK-4_uM-LsK4BNiF3Ak6ilbxYQMqV5SDNbAs3nHK25h98gTAfr0Z6Xt4nsngZKE62m7l-zen6zWMwQ3DCd5caz1fFYlMllbvOfyrkZO7PHL6NmPJz-jtJqp-TAM18qPxvgxzg0wa39yl4-lMzOuMnt3Rw3GxnUQ8K3iYm3L2O0V1n9LEccIWGXi2PeXYKPA"
    const author = "官方"
    const userid = "139dca39-470b-2b00-fd0a-3a16896e0a18"

    const fullUrl = `${serverImageApiUrl}?type=3w-api&__tenant=${tenant}&author=${encodeURIComponent(author)}&userid=${userid}&username=${encodeURIComponent("雷君")}&token=${token}&teachertoken=${teachertoken}`;

    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt,
        size: "1024*1024",
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`[Render] Jimeng API error body:`, errorText)
      throw new Error(`API returned status ${res.status}: ${errorText}`)
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
      console.log(`[Render] Successfully generated image with Jimeng`)
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

    throw new Error(`Jimeng returned no image URL`)
  } catch (err) {
    console.error(`[Render] Jimeng failed -`, err instanceof Error ? err.message : String(err))

    const finalError = "Jimeng image generation failed."
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
