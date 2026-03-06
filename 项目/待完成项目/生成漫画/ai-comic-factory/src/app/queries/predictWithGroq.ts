
import { LLMPredictionFunctionParams } from "@/types"
import Groq from "groq-sdk"

export async function predict({
  systemPrompt,
  userPrompt,
  nbMaxNewTokens,
  llmVendorConfig
}: LLMPredictionFunctionParams): Promise<string> {
  const groqApiKey = llmVendorConfig.apiKey || ""
  const groqApiModel = llmVendorConfig.modelId || "mixtral-8x7b-32768"

  if (!groqApiKey) { throw new Error(`cannot call Groq without an API key`) }

  const groq = new Groq({
    apiKey: groqApiKey,
    dangerouslyAllowBrowser: true
  })

  const messages: Groq.Chat.Completions.CompletionCreateParams.Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]

  try {
    const res = await groq.chat.completions.create({
      messages: messages,
      model: groqApiModel,
      stream: false,
      temperature: 0.5,
      max_tokens: nbMaxNewTokens,
    })

    return res.choices[0].message.content || ""
  } catch (err) {
    console.error(`error during generation: ${err}`)
    return ""
  }
}