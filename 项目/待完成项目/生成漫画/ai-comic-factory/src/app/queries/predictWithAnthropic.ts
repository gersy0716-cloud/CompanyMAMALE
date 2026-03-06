
import { LLMPredictionFunctionParams } from '@/types';
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources';

export async function predict({
  systemPrompt,
  userPrompt,
  nbMaxNewTokens,
  llmVendorConfig
}: LLMPredictionFunctionParams): Promise<string> {
  const anthropicApiKey = llmVendorConfig.apiKey || ""
  const anthropicApiModel = llmVendorConfig.modelId || "claude-3-opus-20240229"
  if (!anthropicApiKey) { throw new Error(`cannot call Anthropic without an API key`) }

  const anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  })

  const messages: MessageParam[] = [
    { role: "user", content: userPrompt },
  ]

  try {
    const res = await anthropic.messages.create({
      messages: messages,
      // stream: false,
      system: systemPrompt,
      model: anthropicApiModel,
      // temperature: 0.8,
      max_tokens: nbMaxNewTokens,
    })

    return (res.content[0] as any)?.text || ""
  } catch (err) {
    console.error(`error during generation: ${err}`)
    return ""
  }
}