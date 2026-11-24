import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  adminPassword: z.string().optional().catch(undefined),
  // API keys for configured model providers, keyed by the provider id. `main.ts`
  // passes each one to the server as `OPENCODE_KEY_<ID>`, which is the variable
  // the generated entry in OpenCode's own config refers to — so the key reaches
  // the server without ever being written to the config file on `main`.
  providerKeys: z.record(z.string(), z.unknown()).optional().catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
