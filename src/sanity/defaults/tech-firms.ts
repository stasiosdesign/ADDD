import { keyed } from './types';

/* The For AEC Tech Firms page's own words and pictures
   (src/pages/tech-firms.astro), section by section, as the page's document is
   shaped (studio/schemaTypes/pages/tech-firms.ts). The cards' tone and crop
   stay in the page, by position; so does where every button leads. */
export const techFirmsPage = {
  hero: {
    tagline: 'For AEC tech firms',
    heading: 'Reach architecture practices through ADDD',
    lede: 'Sponsorship and partnerships that give technology companies access to ADDD’s architecture audience, through its content, the ADDDitive newsletter, research and events.',
    primaryButton: 'Partnership Enquiry',
    secondaryButton: 'Request the Fee Sheet',
  },
  opportunities: {
    items: keyed('opportunity', [
      {
        title: 'Content sponsorship',
        text: 'Sponsor workflow content and episodes that show how technology actually gets used to make architecture, across people, process and projects.',
        image: { path: 'assets/images/allister-podium-portrait.jpg', alt: '' },
      },
      {
        title: 'Newsletter placement',
        text: 'A placement in ADDDitive, the ADDD newsletter for people who run and work in architecture practices.',
        image: { path: 'assets/images/allister-gesture-close.jpg', alt: '' },
      },
      {
        title: 'Intelligence and research',
        text: 'ADDD research into how architecture practices choose, adopt and use software across their workflows.',
        image: { path: 'assets/images/allister-keynote-stage.jpg', alt: '' },
      },
      {
        title: 'Events and content',
        text: 'Relevant events and content opportunities that put your product in front of the architecture audience. Nobody pays for recommendations or rankings.',
        image: { path: 'assets/images/allister-gesture-warm.jpg', alt: '' },
      },
    ]),
  },
  closingCta: {
    label: 'For technology companies',
    heading: 'Talk to us about partnering with ADDD',
    primaryButton: 'Partnership Enquiry',
    secondaryButton: 'Request the Fee Sheet',
  },
};
