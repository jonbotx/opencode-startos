import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { providerKeyEnvVar, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  // Reactive: when the password changes (set or rotated by the action), the
  // daemon spec is rebuilt and the server restarts with the new value.
  //
  // A missing password is unreachable in normal operation: `watchCredentials`
  // raises a critical task on a fresh install or a restore that brought back
  // `main` without `startos`, and a critical task blocks the service from
  // starting. Throwing rather than substituting a value keeps the failure
  // visible and, unlike a generated fallback, produces no restart loop.
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
        // The image's HOME is /root, and OpenCode keeps everything — sessions
        // database, provider credentials, cloned repositories and the user's
        // own projects — under it. Mounting the whole home persists it all.
        mountpoint: '/root',
        readonly: false,
      }),
      'opencode-sub',
    ),
    exec: {
      // The image's entrypoint is the `opencode` binary itself; override only
      // the command so it runs the server rather than the interactive TUI.
      command: sdk.useEntrypoint([
        'serve',
        '--hostname',
        '0.0.0.0',
        '--port',
        String(uiPort),
      ]),
      env: {
        OPENCODE_PASSWORD: adminPassword,
        // Never let the container try to replace its own binary.
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
