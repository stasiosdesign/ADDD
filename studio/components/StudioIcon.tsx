/* The Studio's icon: the ADDD mark (the site's favicon, public/assets/logo.svg),
   served from studio/static. The top bar shows it beside "CMS" and in the
   project menu (the CMS package's StudioNavbar); Sanity, wherever it shows the
   Studio's icon (project.ts, brand.icon). */
const SITE_ICON = '/static/site-icon.svg'

export function StudioIcon() {
  return <img src={SITE_ICON} alt="" style={{display: 'block', width: '100%', height: '100%', objectFit: 'contain'}} />
}
