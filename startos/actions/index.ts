import { sdk } from '../sdk'
import { configureProviders } from './configureProviders'
import { setAdminPassword } from './setAdminPassword'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(configureProviders)
