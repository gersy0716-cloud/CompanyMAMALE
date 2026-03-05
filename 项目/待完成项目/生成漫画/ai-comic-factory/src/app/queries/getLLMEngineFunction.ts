import { LLMEngine } from "@/types"
import { predict as predictWithHuggingFace } from "./predictWithHuggingFace"
import { predict as predictWithOpenAI } from "./predictWithOpenAI"
import { predict as predictWithGroq } from "./predictWithGroq"
import { predict as predictWithAnthropic } from "./predictWithAnthropic"
import { predict as predictWithMamale } from "./predictWithMamale"

export const defaultLLMEngineName = "MAMALE" as LLMEngine

export function getLLMEngineFunction(llmEngineName: LLMEngine = defaultLLMEngineName) {
  const llmEngineFunction =
    llmEngineName === "MAMALE" ? predictWithMamale :
      llmEngineName === "GROQ" ? predictWithGroq :
        llmEngineName === "ANTHROPIC" ? predictWithAnthropic :
          llmEngineName === "OPENAI" ? predictWithOpenAI :
            predictWithHuggingFace

  return llmEngineFunction
}

export const defaultLLMEngineFunction = getLLMEngineFunction()