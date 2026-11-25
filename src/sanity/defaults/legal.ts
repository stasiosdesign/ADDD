/* The legal pages' own words (2026-11-25): the Privacy Policy
   (src/pages/privacy-policy.astro) and the Terms and Conditions
   (src/pages/terms.astro), both drawn by src/components/LegalPage.astro and
   shaped as their documents are (studio/schemaTypes/pages/legal.ts): an
   opening, then the sections, each a title and its text.

   A starting draft for ADDD to review (ideally with a lawyer) and complete
   with its company details; once it is in the Studio, the Studio's copy is
   the one the site shows.

   A section's text is Portable Text, as the Studio's text editor writes
   it: one block per paragraph, subheading or list item, each with a
   stable _key. */

type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
type MarkDef = { _type: 'link'; _key: string; href: string };
type TextBlock = {
  _type: 'block';
  _key: string;
  style: 'normal' | 'h3';
  listItem?: 'bullet' | 'number';
  level?: number;
  markDefs: MarkDef[];
  children: Span[];
};
type Run = string | { text: string; href?: string; bold?: boolean };
type Part = (key: string) => TextBlock;

const block = (style: TextBlock['style'], runs: Run[], listItem?: TextBlock['listItem']): Part => (key) => {
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

/** A paragraph */
const p = (...runs: Run[]) => block('normal', runs);
/** A subheading inside a section */
const h3 = (text: string) => block('h3', [text]);
/** A bulleted list item */
const li = (...runs: Run[]) => block('normal', runs, 'bullet');
/** A bulleted item that opens with a bold term: "Term: the rest" */
const term = (bold: string, rest: string) => li({ text: bold, bold: true }, rest);

/** The sections, keyed "<name>-1", "<name>-2"…, their blocks "<name>-1-1"… */
const sections = (name: string, list: [heading: string, ...parts: Part[]][]) =>
  list.map(([heading, ...parts], i) => {
    const key = `${name}-${i + 1}`;
    return { _key: key, _type: 'legalSection', heading, text: parts.map((part, j) => part(`${key}-${j + 1}`)) };
  });

const EMAIL = 'allister@addd.io';
const email = { text: EMAIL, href: `mailto:${EMAIL}` };
const UPDATED = '2026-11-25';

export const privacyPage = {
  seo: {
    title: 'Privacy Policy — ADDD',
    description: 'How ADDD collects, uses and looks after your personal information, and the rights you have over it.',
  },
  hero: {
    tagline: 'Legal',
    heading: 'Privacy Policy',
    lede: 'How we collect, use and look after your personal information when you visit this website, read our newsletter, download our research or work with us.',
    updatedLabel: 'Last updated',
    updated: UPDATED,
  },
  content: {
    contentsLabel: 'Contents',
    sections: sections('privacy', [
      [
        'Who we are',
        p('ADDD (“we”, “us”, “our”) is an independent technology strategy consultancy for architecture practices. We help practices understand how their workflows, software, data and teams fit together, and make better decisions about them.'),
        p('We are the controller of the personal information described in this policy, which means we decide how and why it is used. If you have any questions about this policy or how we handle your information, email us at ', email, '.'),
      ],
      [
        'The information we collect',
        p('We only collect the information we need. Depending on how you use the website and our services, that may include:'),
        h3('Information you give us'),
        term('Contact details', ': your name, email address, telephone number, job title and practice or company, when you email us, send an enquiry, book a call or work with us.'),
        term('Newsletter and downloads', ': your email address and whether you work in a practice or sell to practices, when you subscribe to ADDDitive or request a report, guide or other resource.'),
        term('Purchases', ': your name, email address and billing details when you buy a paid resource. Card payments are taken by our payment provider; we never see or store your full card details.'),
        term('Project information', ': information about your practice, its workflows, software and people that you share with us during a workshop, audit or advisory engagement.'),
        h3('Information collected automatically'),
        term('Technical information', ': your IP address, browser and device type, and the pages you visit, recorded by our hosting provider in standard server logs to keep the website secure and working.'),
        term('Email engagement', ': whether newsletter emails are delivered and opened, and which links are clicked, measured by our newsletter provider so we can improve what we send.'),
      ],
      [
        'How we use your information',
        p('We use your information to:'),
        li('reply to your enquiries and arrange calls and meetings;'),
        li('send you the newsletter, reports and resources you asked for;'),
        li('process purchases and keep the records the law requires;'),
        li('plan and deliver our services, and manage our relationship with you;'),
        li('understand which topics are most useful to our readers, so we can improve our research and content;'),
        li('keep the website secure and working properly.'),
        p('We do not sell your personal information, and we do not use it to make automated decisions that have legal or similarly significant effects on you.'),
      ],
      [
        'Our legal reasons for using it',
        p('UK data protection law requires us to have a lawful basis for using your information. We rely on:'),
        term('Consent', ': for the newsletter and other marketing emails. You can withdraw your consent at any time.'),
        term('Contract', ': where we need your information to provide something you have asked for, such as a purchase, a proposal or our services.'),
        term('Legitimate interests', ': to reply to enquiries, run and improve our business and website, and keep them secure, where this does not override your rights.'),
        term('Legal obligation', ': where the law requires us to keep or share information, for example tax and accounting records.'),
      ],
      [
        'The ADDDitive newsletter',
        p('If you subscribe to ADDDitive, we use your email address to send you new issues and occasional related updates from ADDD. We may also ask whether you work in a practice or sell to practices, so we can send you what is most relevant.'),
        p('Every email includes a link to unsubscribe, and you can also ask us to remove you at any time by emailing ', email, '.'),
      ],
      [
        'Who we share it with',
        p('We share your information only with organisations that help us run ADDD, under contracts that require them to keep it secure and use it only on our instructions:'),
        term('beehiiv', ', which sends the ADDDitive newsletter and stores its subscribers.'),
        term('HubSpot', ', which runs the sign-up forms on some of our report pages.'),
        term('Vercel', ', which hosts this website.'),
        term('Adobe Fonts', ', which serves the website’s typefaces and may receive your IP address when a page loads.'),
        term('Payment providers', ', which take payment for paid resources.'),
        p('We may also share information with our professional advisers, such as accountants and lawyers, where we are required to by law, or with a buyer or successor if our business is ever sold or reorganised.'),
      ],
      [
        'International transfers',
        p('Some of our providers store or process information outside the UK, including in the United States and the European Economic Area. Where they do, we make sure your information is protected by safeguards recognised under UK data protection law, such as the UK’s adequacy regulations or the International Data Transfer Agreement.'),
      ],
      [
        'Cookies',
        p('This website does not use advertising or analytics cookies, and it does not track you across other websites.'),
        p('Sign-up forms provided by beehiiv or HubSpot, on some of our report pages, may set their own cookies when you use them; their privacy policies explain how. You can block or delete cookies in your browser’s settings at any time.'),
      ],
      [
        'How long we keep it',
        p('We keep your information only for as long as we need it:'),
        term('Newsletter subscribers', ': until you unsubscribe.'),
        term('Enquiries', ': for up to two years after we last hear from you, unless we go on to work together.'),
        term('Clients and purchases', ': for six years after our work together ends or the purchase is made, as UK tax and accounting rules require.'),
        term('Server logs', ': for a short period set by our hosting provider, usually no more than a few weeks.'),
        p('After that, we delete your information or make it anonymous.'),
      ],
      [
        'Keeping it secure',
        p('We use appropriate technical and organisational measures to protect your information, including encrypted connections, access controls and reputable providers. No system is completely secure, but if a breach affects your information in a way that puts your rights at risk, we will tell you and the Information Commissioner’s Office as the law requires.'),
      ],
      [
        'Your rights',
        p('Under UK data protection law you have the right to:'),
        li('ask for a copy of the information we hold about you;'),
        li('ask us to correct information that is wrong or incomplete;'),
        li('ask us to delete your information;'),
        li('ask us to restrict how we use it, or object to our using it, including for marketing;'),
        li('ask us to send your information to you or another organisation in a portable format;'),
        li('withdraw your consent at any time, where we rely on it.'),
        p('To use any of these rights, email ', email, '. There is no charge, and we will reply within one month.'),
      ],
      [
        'Children',
        p('Our website and services are for professionals and are not intended for children. We do not knowingly collect information from anyone under 18.'),
      ],
      [
        'Changes to this policy',
        p('We may update this policy from time to time, for example when we start using a new service. The date at the top of this page shows when it last changed. If we make a significant change, we will tell our newsletter subscribers.'),
      ],
      [
        'Contact us and complaints',
        p('If you have a question or concern about how we handle your information, please email us first at ', email, ' and we will do our best to help.'),
        p('You also have the right to complain to the Information Commissioner’s Office, the UK’s data protection regulator, at ', { text: 'ico.org.uk', href: 'https://ico.org.uk/make-a-complaint/' }, ' or on 0303 123 1113.'),
      ],
    ]),
  },
};

export const termsPage = {
  seo: {
    title: 'Terms and Conditions — ADDD',
    description: 'The terms that apply when you use the ADDD website and its reports, guides and other resources.',
  },
  hero: {
    tagline: 'Legal',
    heading: 'Terms and Conditions',
    lede: 'The terms that apply when you use this website and the reports, guides and other resources on it. Please read them carefully.',
    updatedLabel: 'Last updated',
    updated: UPDATED,
  },
  content: {
    contentsLabel: 'Contents',
    sections: sections('terms', [
      [
        'About these terms',
        p('This website is run by ADDD (“we”, “us”, “our”), an independent technology strategy consultancy for architecture practices. These terms explain the rules for using the website and the reports, guides and other resources we offer on it.'),
        p('By using the website you agree to these terms. If you do not agree, please do not use it. Our ', { text: 'Privacy Policy', href: '/privacy-policy' }, ' also applies, and explains how we use any personal information you give us.'),
      ],
      [
        'Using our website',
        p('You may use this website to learn about ADDD and our services, and to read, download and buy our resources for your own work. We make the website available free of charge.'),
        p('We may update, change or suspend any part of the website at any time, for example to reflect changes to our services. We do not guarantee that the website, or any content on it, will always be available or uninterrupted.'),
      ],
      [
        'Acceptable use',
        p('When you use the website, you must not:'),
        li('use it in any way that breaks the law or is fraudulent or harmful;'),
        li('try to gain unauthorised access to the website, its servers or any connected system;'),
        li('introduce viruses or other malicious or technologically harmful material;'),
        li('copy or scrape its content in bulk, including to train software or AI models, without our written permission;'),
        li('use our sign-up and contact forms to send spam or unsolicited messages.'),
      ],
      [
        'Our content',
        p('The research, reports, guides, words, graphics and design on this website belong to ADDD or are used with the permission of their owners, and are protected by copyright and other intellectual property laws.'),
        p('You are welcome to share links to our pages and to quote short extracts, as long as you credit ADDD and link back to the source. You must not otherwise copy, republish, sell or adapt our content without our written permission.'),
      ],
      [
        'Reports, guides and other resources',
        p('Our free and paid resources are licensed to you for use within your own practice or organisation. You may share them with your colleagues, but not publish them, sell them or pass them to anyone outside your organisation.'),
        p('Some free resources are sent to you when you sign up with your email address; signing up for a resource does not subscribe you to the newsletter unless you choose to.'),
      ],
      [
        'Buying a paid resource',
        p('Prices are shown on each resource’s page, in pounds sterling. Payment is taken securely by our payment provider at checkout, and your resource is made available to download once payment is complete.'),
        p('If you buy as a consumer, you have the right to cancel within 14 days, but you lose that right once you start downloading the resource, as you agree to at checkout. If a resource is faulty or not as described, contact us at ', email, ' and we will put it right or refund you.'),
      ],
      [
        'Our services',
        p('Workshops, audits, blueprints and advisory memberships are provided under a separate proposal or agreement, which sets out what is included, the fees and the terms of that work. If anything in that agreement differs from these terms, the agreement applies.'),
      ],
      [
        'Not professional advice',
        p('The content on this website, including our reports and guides, is general information to help you think about technology in your practice. It is not advice tailored to your circumstances, and you should not rely on it as such. Take advice that is specific to your practice before acting on it.'),
        p('We work hard to keep our content accurate and up to date, but software, prices and products change quickly, and we cannot guarantee that everything on the website is complete or current.'),
      ],
      [
        'Links to other websites',
        p('This website links to other websites and services, such as the ADDD app, the software database, AEC Jobs and the services that run our forms and newsletter. These links are for your information only. We have no control over those sites and are not responsible for their content or for how they handle your information.'),
      ],
      [
        'Our responsibility to you',
        p('Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot be limited or excluded by law.'),
        h3('If you use the website as a business'),
        p('We exclude all implied conditions, warranties and representations that may apply to the website or its content. We will not be liable for any loss of profits, sales, business, revenue, data, goodwill or anticipated savings, or for any indirect or consequential loss, arising from your use of, or inability to use, the website or its content.'),
        h3('If you use the website as a consumer'),
        p('We only provide the website for domestic and private use. We are responsible for loss or damage you suffer that is a foreseeable result of our breaking these terms or failing to use reasonable care and skill, but not for loss or damage that is not foreseeable.'),
      ],
      [
        'Changes to these terms',
        p('We may update these terms from time to time. The date at the top of this page shows when they last changed, and the version on the website when you use it is the one that applies.'),
      ],
      [
        'Governing law',
        p('These terms are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction over any dispute arising from them. If you are a consumer living in Scotland or Northern Ireland, you may also bring proceedings in your local courts.'),
      ],
      [
        'Contact us',
        p('If you have any questions about these terms, or a problem with the website or a resource, email us at ', email, '.'),
      ],
    ]),
  },
};
