/* The legal pages' own words (2026-11-25): the Privacy Policy
   (src/pages/privacy-policy.astro) and the Terms and Conditions
   (src/pages/terms.astro), both drawn by src/components/LegalPage.astro and
   shaped as their documents are (studio/schemaTypes/pages/legal.ts). The
   text is a starting draft for ADDD to review and complete; once it is in
   the Studio, the Studio's copy is the one the site shows.

   The body is Portable Text, as the Studio's text editor writes it: one
   block per paragraph, heading or list item, each with a stable _key. */

type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
type MarkDef = { _type: 'link'; _key: string; href: string };
type TextBlock = {
  _type: 'block';
  _key: string;
  style: 'normal' | 'h2' | 'h3';
  listItem?: 'bullet' | 'number';
  level?: number;
  markDefs: MarkDef[];
  children: Span[];
};
type Run = string | { text: string; href?: string; bold?: boolean };

/** A body, written as a list of paragraphs, headings and list items, keyed "<name>-1", "<name>-2"… */
function body(name: string, parts: ((key: string) => TextBlock)[]): TextBlock[] {
  return parts.map((part, i) => part(`${name}-${i + 1}`));
}

const block = (style: TextBlock['style'], runs: Run[], listItem?: TextBlock['listItem']) => (key: string): TextBlock => {
  const markDefs: MarkDef[] = [];
  const children = runs.map((run, i): Span => {
    const { text, href, bold } = typeof run === 'string' ? { text: run } : run;
    const marks: string[] = [];
    if (bold) marks.push('strong');
    if (href) {
      const mark = `${key}-link-${markDefs.length + 1}`;
      markDefs.push({ _type: 'link', _key: mark, href });
      marks.push(mark);
    }
    return { _type: 'span', _key: `${key}-${i + 1}`, text, marks };
  });
  return { _type: 'block', _key: key, style, ...(listItem ? { listItem, level: 1 } : {}), markDefs, children };
};

const h2 = (text: string) => block('h2', [text]);
const p = (...runs: Run[]) => block('normal', runs);
const bullet = (...runs: Run[]) => block('normal', runs, 'bullet');

const EMAIL = 'allister@addd.io';
const email = { text: EMAIL, href: `mailto:${EMAIL}` };

export const privacyPage = {
  seo: {
    title: 'Privacy Policy — ADDD',
    description: 'How ADDD collects, uses and looks after your personal information, and the rights you have over it.',
  },
  hero: {
    tagline: 'Legal',
    heading: 'Privacy Policy',
    lede: 'How we collect, use and look after your personal information when you visit this website, sign up for our newsletter or get in touch.',
    updated: 'Last updated 25 November 2026',
  },
  content: {
    body: body('privacy', [
      h2('Who we are'),
      p('This website is run by ADDD (“we”, “us”, “our”), an independent technology strategy consultancy for architecture practices. We are the controller of the personal information described in this policy. If you have any questions about it, email us at ', email, '.'),
      h2('What we collect'),
      p('We only collect what we need to answer you, send you what you asked for and run the website:'),
      bullet({ text: 'Contact details', bold: true }, ': your name, email address and anything else you include when you email us, book a call or send an enquiry.'),
      bullet({ text: 'Newsletter and downloads', bold: true }, ': your email address and whether you work in a practice or sell to practices, when you subscribe to ADDDitive or request a report or guide.'),
      bullet({ text: 'Technical information', bold: true }, ': your browser’s standard request details, such as your IP address and the pages you visit, which our hosting provider records to keep the website secure and working.'),
      h2('How we use it'),
      p('We use your information to reply to your enquiries, deliver the reports and newsletter you asked for, arrange calls and work with you, and keep the website running safely. We never sell your information.'),
      p('Under UK data protection law we rely on your consent for the newsletter and marketing emails, on taking steps at your request before or under a contract for enquiries and engagements, and on our legitimate interests for running and securing the website.'),
      h2('Services we use'),
      p('Some of the services that help us run ADDD process personal information on our behalf:'),
      bullet({ text: 'beehiiv', bold: true }, ', which sends the ADDDitive newsletter and stores its subscribers.'),
      bullet({ text: 'HubSpot', bold: true }, ', which runs the sign-up forms on some of our report pages.'),
      bullet({ text: 'Vercel', bold: true }, ', which hosts this website.'),
      bullet({ text: 'Adobe Fonts', bold: true }, ', which serves the website’s typefaces.'),
      p('Some of these providers may store information outside the UK. Where they do, they use safeguards recognised under UK data protection law.'),
      h2('Cookies'),
      p('This website does not use advertising or analytics cookies. Sign-up forms provided by beehiiv or HubSpot may set their own cookies when you use them; their privacy policies explain how.'),
      h2('How long we keep it'),
      p('We keep your information only for as long as we need it: newsletter details until you unsubscribe, and enquiry and client records for as long as we are working together and for the period the law requires afterwards.'),
      h2('Your rights'),
      p('You can ask us at any time to see the information we hold about you, correct it, delete it, restrict or object to how we use it, or receive a copy of it. You can unsubscribe from the newsletter using the link in any issue. To make a request, email ', email, '.'),
      p('If you are unhappy with how we have handled your information, you can complain to the Information Commissioner’s Office at ', { text: 'ico.org.uk', href: 'https://ico.org.uk' }, '.'),
      h2('Changes to this policy'),
      p('We may update this policy from time to time. The date at the top of the page shows when it last changed.'),
    ]),
  },
};

export const termsPage = {
  seo: {
    title: 'Terms and Conditions — ADDD',
    description: 'The terms that apply when you use the ADDD website and its reports, guides and resources.',
  },
  hero: {
    tagline: 'Legal',
    heading: 'Terms and Conditions',
    lede: 'The terms that apply when you use this website and the reports, guides and resources on it.',
    updated: 'Last updated 25 November 2026',
  },
  content: {
    body: body('terms', [
      h2('About these terms'),
      p('This website is run by ADDD (“we”, “us”, “our”). By using it you agree to these terms. If you do not agree, please do not use the website.'),
      h2('Using the website'),
      p('You may use this website for your own information and for your work. You must not misuse it: for example, by trying to gain unauthorised access, interfering with how it works, or using it for anything unlawful.'),
      h2('Our content'),
      p('The words, research, reports, guides, graphics and design on this website belong to ADDD or are used with permission. You may share links to them and quote short extracts with credit to ADDD, but you may not copy, republish or sell them without our written permission.'),
      h2('Reports, guides and downloads'),
      p('Free and paid resources are for use within your own organisation. They give general information to help you make better technology decisions; they are not advice tailored to your practice, and you should take advice on your own circumstances before acting on them.'),
      h2('Our services'),
      p('Workshops, audits, blueprints and advisory work are provided under a separate agreement or proposal, which sets out what is included, the fees and the terms of that work. If anything in it differs from these terms, the agreement applies.'),
      h2('Links to other websites'),
      p('This website links to other websites, such as the ADDD app and AEC Jobs. We are not responsible for their content or how they handle your information.'),
      h2('Our liability'),
      p('We work to keep the website accurate and available, but we cannot guarantee that it will always be complete, up to date or uninterrupted. As far as the law allows, we are not liable for any loss arising from your use of the website or its content. Nothing in these terms limits liability that cannot be limited by law.'),
      h2('Your privacy'),
      p('Our ', { text: 'Privacy Policy', href: '/privacy-policy' }, ' explains how we use any personal information you give us.'),
      h2('Changes to these terms'),
      p('We may update these terms from time to time. The date at the top of the page shows when they last changed.'),
      h2('Governing law'),
      p('These terms are governed by the law of England and Wales, and the courts of England and Wales have jurisdiction over any dispute.'),
      h2('Contact'),
      p('If you have any questions about these terms, email us at ', email, '.'),
    ]),
  },
};
