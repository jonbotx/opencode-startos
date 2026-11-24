import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.4.1:1',
  releaseNotes: {
    en_US:
      'Add a Configure Model Providers action, which connects an OpenAI-compatible provider — your own vLLM, LM Studio, or Ollama server, or a hosted API — without a shell.',
    es_ES:
      'Añade una acción Configurar proveedores de modelos, que conecta un proveedor compatible con OpenAI —tu propio servidor vLLM, LM Studio u Ollama, o una API alojada— sin usar la terminal.',
    de_DE:
      'Fügt die Aktion „Modellanbieter konfigurieren" hinzu, die einen OpenAI-kompatiblen Anbieter verbindet – Ihren eigenen vLLM-, LM-Studio- oder Ollama-Server oder eine gehostete API – ganz ohne Shell.',
    pl_PL:
      'Dodaje akcję „Konfiguruj dostawców modeli", która podłącza dostawcę zgodnego z OpenAI — własny serwer vLLM, LM Studio lub Ollama albo hostowane API — bez użycia terminala.',
    fr_FR:
      "Ajoute l'action « Configurer les fournisseurs de modèles », qui connecte un fournisseur compatible OpenAI — votre propre serveur vLLM, LM Studio ou Ollama, ou une API hébergée — sans passer par le shell.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
