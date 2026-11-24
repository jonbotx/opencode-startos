import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, 'ui')
  const uiOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
    preferredExternalPort: 80,
  })

  const ui = sdk.createInterface(effects, {
    name: i18n('Web Interface'),
    id: 'ui',
    description: i18n('The OpenCode web interface and HTTP API'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await uiOrigin.export([ui])]
})
