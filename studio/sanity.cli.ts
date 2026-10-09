import {defineCliConfig} from 'sanity/cli'
import {linkLocalCms} from '@stasiosdesign/sanity-cms/cli'

export default defineCliConfig({
  api: {
    projectId: 'xqa8b0u9',
    // The dataset the Studio edits. The live site's is `production`, written
    // only by the Studio's Publish Live (see the README, "Content").
    dataset: 'staging',
  },
  deployment: {
    /** The hosted Studio, https://addd.sanity.studio (`npm run deploy`) */
    appId: 'campstx5kpldkmfbyd04u2d5',
    /**
     * Off: the hosted Studio runs exactly the Sanity version package-lock.json
     * pins, the one the CMS package was tested with, not whatever Sanity
     * publishes next. Sanity upgrades are deliberate (CLAUDE.md, "The CMS").
     */
    autoUpdates: false,
  },
  /**
   * `npm run dev:linked` runs the Studio on a local checkout of the CMS
   * package (../../../1 - HQ/shared-sanity-cms) instead of its installed
   * release, to work on a change that needs both sides. `npm run dev`, builds
   * and deploys always use the release package-lock.json pins.
   */
  vite: linkLocalCms({scripts: ['dev:linked'], path: '../../../1 - HQ/shared-sanity-cms'}),
})
