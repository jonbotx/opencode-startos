import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const setAdminPassword = sdk.Action.withoutInput(
  // id
  'set-admin-password',

  // metadata
  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      'Generate a new random password for the OpenCode web interface. Replaces any existing password.',
    ),
    warning: (await storeJson.read((s) => s.adminPassword).const(effects))
      ? i18n('Replaces the current admin password.')
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // execution
  async ({ effects }) => {
    const adminPassword = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    })
    await storeJson.merge(effects, { adminPassword })

    return {
      version: '1',
      title: i18n('Login Credentials'),
      message: i18n('Use these credentials to sign in to the web interface.'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: 'opencode',
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: adminPassword,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
