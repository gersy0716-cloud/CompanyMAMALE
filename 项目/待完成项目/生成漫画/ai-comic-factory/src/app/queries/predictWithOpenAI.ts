
import type { ChatCompletionMessageParam } from "openai/resources/chat"
import OpenAI from "openai"
import { LLMPredictionFunctionParams } from "@/types"

export async function predict({
  systemPrompt,
  userPrompt,
  nbMaxNewTokens,
  llmVendorConfig
}: LLMPredictionFunctionParams): Promise<string> {
  const openaiApiKey = llmVendorConfig.apiKey || "sk-bfsoBhqtsjZ1x5sqbKrA4mFg0DH7aUQMlToVykNJ5IGnww7r"
  const openaiApiModel = llmVendorConfig.modelId || "gemini-3-pro-preview"
  const openaiApiBaseUrl = "https://dalu.chatgptten.com/v1"

  const openai = new OpenAI({
    apiKey: openaiApiKey,
    baseURL: openaiApiBaseUrl,
  })

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]

  try {
    const res = await openai.chat.completions.create({
      messages: messages,
      stream: false,
      model: openaiApiModel,
      temperature: 0.8,
      max_tokens: nbMaxNewTokens,

      // TODO: use the nbPanels to define a max token limit
    })

    return res.choices[0].message.content || ""
  } catch (err) {
    console.error(`error during generation: ${err}`)
    return ""
  }
}