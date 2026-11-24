import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { providerKeyEnvVar, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  const adminPassword = await storeJson
    .read((s) => s.adminPassword)
    .const(effects)

  if (!adminPassword) {
    throw new Error('The admin password has not been set')
  }

  // Reactive: saving a provider with an API key changes this map, which rebuilds
  // the daemon spec and restarts the server so it gains the `OPENCODE_KEY_*`
  // variables the provider entries in OpenCode's own config refer to. Provider
  // entries themselves need no restart — OpenCode reloads that file live.
  const providerKeys =
    (await storeJson.read((s) => s.providerKeys).const(effects)) ?? {}
  const providerEnv = Object.fromEntries(
    Object.entries(providerKeys)
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      )
      .map(([id, key]) => [providerKeyEnvVar(id), key]),
  )

  return sdk.Daemons.of(effects).addDaemon('opencode', {
    subcontainer: sdk.SubContainer.of(
      effects,
      { imageId: 'opencode' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/root',
        readonly: false,
      }),
      'opencode-sub',
    ),
    exec: {
      command: sdk.useEntrypoint([
        'serve',
        '--hostname',
        '0.0.0.0',
        '--port',
        String(uiPort),
      ]),
      env: {
        OPENCODE_PASSWORD: adminPassword,
        OPENCODE_DISABLE_AUTOUPDATE: '1',
        ...providerEnv,
      },
    },
    ready: {
      display: i18n('Web Interface'),
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, uiPort, {
          successMessage: i18n('The web interface is ready'),
          errorMessage: i18n('The web interface is not ready'),
        }),
    },
    requires: [],
  })
})
