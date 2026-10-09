import {defineCmsStudio} from '@stasiosdesign/sanity-cms'
import {project} from './project'

// The ADDD Studio: the shared CMS package (@stasiosdesign/sanity-cms, the
// sanity-cms repository) set up for this website (project.ts: its pages,
// collections, brand, sites and integrations; schemaTypes/: its content
// model). See CLAUDE.md, "The CMS".

if (!project.sites.preview) {
  throw new Error('SANITY_STUDIO_PREVIEW_ORIGIN is not set: see studio/.env.production and .env.development')
}

export default defineCmsStudio(project)
