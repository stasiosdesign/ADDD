/* The Contact page's own words (src/pages/contact.astro), as the Contact page
   document is shaped (studio/schemaTypes/pages/contact.ts): the pass on the
   lanyard and the enquiry form, its labels, prompts, topics and messages
   (since 2026-11-16). */
export const contactPage = {
  seo: {
    title: 'Contact — ADDD',
    description: 'Send your enquiry to ADDD. Tell us what you need.',
  },
  hero: {
    tagline: 'Enquire',
    heading: 'Send your enquiry',
    // the two rows' headings (2026-11-16): Allister's details, and the form
    contactHeading: 'Contact',
    formHeading: 'Contact Form',
    lede: 'Tell us what you need',
    email: 'allister@addd.io',
    phone: '+44 (0) 207 183 3675',
    address: '123 Sample St, Sydney NSW 2000 AU',
    button: 'Send enquiry',
  },
  // the pass on the lanyard: its label, Allister's portrait, name and role,
  // and the labels over his email and telephone (hero.email, hero.phone);
  // its button is the free call's (the Home page's Booking section)
  pass: {
    label: 'ADDD Pass',
    portrait: { path: '/assets/images/allister-headshot-bw-crop.webp', alt: '', width: 560, height: 700 },
    name: 'Allister Lewis',
    role: 'Architect & technology strategist',
    emailLabel: 'Email',
    phoneLabel: 'Telephone',
  },
  // the enquiry form: each field's label, the words in it before anything
  // is typed and what it says when it is missed; what an enquiry can be
  // about; and the messages the form gives ({n} a number, {email} the
  // address on the pass)
  form: {
    nameLabel: 'Name',
    namePlaceholder: 'Your name',
    nameError: 'Please enter your name.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@practice.com',
    emailError: 'Please enter a valid email address.',
    topicLabel: 'What is your enquiry about?',
    topicPlaceholder: 'Select an option',
    topics: ['Workflow Workshop', 'Early Stage Design', 'Technology Blueprint', 'Ongoing Advisory', 'AEC Tech Partners', 'Reports and research', 'Something else'],
    topicError: 'Please choose what your enquiry is about.',
    messageLabel: 'Message',
    messagePlaceholder: 'Tell us more about your enquiry',
    messageError: 'Please add a short message.',
    oneError: 'One field needs your attention.',
    manyErrors: '{n} fields need your attention.',
    notConnected: 'Thank you. The form isn’t connected yet, so nothing has been sent: please email {email} and we’ll reply.',
    sending: 'Sending…',
    sent: 'Thank you. Your enquiry has been sent, and we’ll be in touch soon.',
    failed: 'Sorry, that didn’t go through. Please try again, or email {email}.',
    // reached from an AEC Tech Partners button: the topic it chooses, and
    // the message's opening line, for a partnership in general or a named
    // one ({offer} its name)
    partnerTopic: 'AEC Tech Partners',
    partnerMessage: 'I’d like to discuss a partnership with ADDD.',
    offerMessage: 'I’m interested in: {offer}.',
  },
};
