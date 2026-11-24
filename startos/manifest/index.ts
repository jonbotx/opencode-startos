import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'opencode',
  title: 'OpenCode',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9-Community/opencode-startos',
  upstreamRepo: 'https://github.com/anomalyco/opencode',
  marketingUrl: 'https://opencode.ai',
  donationUrl: null,
  description: { short, long },
  // `startos` holds the login password and is never mounted into the container.
  volumes: ['main', 'startos'],
  images: {
    opencode: {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
