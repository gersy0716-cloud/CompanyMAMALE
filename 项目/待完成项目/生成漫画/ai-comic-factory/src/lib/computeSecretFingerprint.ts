import { computeSha256 } from "./computeSha256"

const secretFingerprint = ""

export function computeSecretFingerprint(input: string) {
  return computeSha256(`${secretFingerprint}_${input}`)
}