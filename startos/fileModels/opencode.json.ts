import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// OpenCode's global configuration, at the path OpenCode itself reads it on the
// `main` volume (which is mounted at `/root`). The package models it so the
// Configure Model Providers action can add providers without a shell.
//
// `providers` and `model` are deliberately left unvalidated beyond their
// top-level type: `providers` is a map the action rebuilds, and `model` is
// either `"provider/model"` or the object OpenCode resolves it to. Validating
// their contents would let one hand-edited entry make `merge()` throw, which
// fails the action rather than repairing the file.
const shape = z.looseObject({
  $schema: z.string().optional().catch(undefined),
  model: z.unknown().optional().catch(undefined),
  providers: z.record(z.string(), z.unknown()).optional().catch(undefined),
})

export const opencodeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '.config/opencode/opencode.json' },
  shape,
)

export type OpencodeProvider = {
  name?: unknown
  package?: unknown
  settings?: unknown
  models?: unknown
}

export type OpencodeConfig = z.infer<typeof shape>
