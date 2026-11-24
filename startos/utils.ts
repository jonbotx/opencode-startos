export const uiPort = 4096

// The upstream package OpenCode uses for any OpenAI-compatible endpoint — a
// self-hosted vLLM, LM Studio, or Ollama server, or a hosted gateway.
export const openAiCompatiblePackage =
  '@opencode/ai/providers/openai-compatible'

// The variable a provider's API key is passed to the server in, derived from the
// provider id the user chose. Those ids are restricted to `[a-z0-9-]` by the
// configure-providers form, so two ids can never collide on one variable.
export const providerKeyEnvVar = (providerId: string) =>
  `OPENCODE_KEY_${providerId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
