import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  // The password the OpenCode server requires for the web interface and HTTP
  // API. Cleartext because the server reads it from the environment unchanged,
  // so it cannot be stored as a hash. It lives on the `startos` volume, which no
  // subcontainer mounts, so the service never sees the file itself.
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
