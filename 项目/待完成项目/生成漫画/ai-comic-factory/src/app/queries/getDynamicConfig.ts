
import { getValidBoolean } from "@/lib/getValidBoolean"
import { getValidNumber } from "@/lib/getValidNumber"
import { getValidString } from "@/lib/getValidString"
import { DynamicConfig } from "@/types"

export async function getDynamicConfig(): Promise<DynamicConfig> {
  const maxNbPages = 12
  const nbPanelsPerPage = 4 // for now this is static
  const nbTotalPanelsToGenerate = maxNbPages * nbPanelsPerPage

  const config = {
    maxNbPages,
    nbPanelsPerPage,
    nbTotalPanelsToGenerate,
    oauthClientId: "",
    oauthRedirectUrl: "",
    oauthScopes: "openid profile inference-api",
    enableHuggingFaceOAuth: false,
    enableHuggingFaceOAuthWall: false,
  }

  return config
}