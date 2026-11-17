/* The ADDDitive's template (2026-11-16, at the user's word): what the
   issues have in common, drawn from the archive (archive-posts.json) as one
   issue to write the next from. Listed as the newest issue (archive.ts), at
   /newsletter/addditive-template.

   The running order is the one the issues have settled into since
   September 2026 (the last ten or so follow it closely); the headings are
   theirs, word for word, and so are the lines that recur every week (the
   partner's call to action, the database's introduction, the jobs board,
   the workshop's offer, the sign-off). Everything in [square brackets] is
   the week's own, to be written. */

const BOOK_CALL =
  "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2ObnE6KjaF3yxQZAPe9jOP11R7BPtednSgeC0CqxagmGyI2tyq_vWVoO-GysJILMb6m9pQ8g2h";
const a = (text: string, href = "#") => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
const image = (href = "#") => `${a("<aside>Image</aside>", href)}`;

const html = [
  // 1. the partner, first, with the referral line
  `<h2>This week's partner: [Partner] - [What they give your team, in one line]</h2>`,
  `<p>[The problem the partner solves, in the reader's own words: one or two sentences.] <strong>[Partner] is [what it is, and who it is built for]. </strong>[What it does: three or four concrete things.] [How it fits the tools practices already use, and one line of proof: a certification, a client or a number.]</p>`,
  image(),
  `<p>${a("Book a demo")} and mention it was ADDD who referred you.</p>`,
  // the welcome: the week in a paragraph, then what is inside
  `<p>Hi there,</p>`,
  `<p>[The week in one paragraph: the question this week's posts share, seen from their two ends, and where you come down on it.]</p>`,
  `<p>Below you'll find [both posts], [the live session], [the events worth your time], <strong>[N] new tools in the ADDD Database</strong>, and [the role of the week].</p>`,

  // 2. the week's posts, each by its opening line
  `<h2>What Sparked the Most Discussion This Week</h2>`,
  `<h3><em>[The opening line of the week's most discussed post, as it reads on LinkedIn.]</em></h3>`,
  image(),
  a("<strong>See full post here</strong>"),
  `<h3><em>[The opening line of the second post.]</em></h3>`,
  image(),
  a("<strong>See full post here</strong>"),

  // 3. the featured live session
  `<h2><em>Featured Live Session: [Session title]</em></h2>`,
  `<p><strong>[Day Date], [start] to [end] GMT, [online or the venue].</strong> ${a("Register here")}</p>`,
  `<p>[The everyday moment the session starts from, in one sentence.]</p>`,
  `<p>[The subject in plain terms: what it is, and how practices already come across it.]</p>`,
  `<p>[Why you are running it, and what each speaker will show.]</p>`,
  image(),
  `<h3>Who is speaking</h3>`,
  `<p>-/ <strong>[Name, Company]</strong> - [their work, in one line].</p>`,
  `<p>-/ <strong>[Name, Company]</strong> - [their work, in one line].</p>`,
  `<p>-/ <strong>[Name, Company]</strong> - [their work, in one line].</p>`,
  `<h3>What we will get into</h3>`,
  `<p>[One line leading into the questions:]</p>`,
  `<p>-/ [The first question the session answers.]</p>`,
  `<p>-/ [The second.]</p>`,
  `<p>-/ [The third.]</p>`,
  `<p>[Who the session is built for.]</p>`,

  // 4. news and events
  `<h2>News &amp; Events</h2>`,
  `<h3>[Event, City]</h3>`,
  `<p>[What it is, why you will be there, and who should come and find you.]</p>`,
  `<p><strong>When:</strong> [Day Date, start - end]<br><strong>Where:</strong> [Venue, City]</p>`,
  image(),
  `<h3>[Second event, City]</h3>`,
  `<p>[What it is, and what you will be doing there.]</p>`,
  image(),

  // 5. the database's new tools
  `<h2>New this week: [N] new software added to the ADDD Database</h2>`,
  `<p>Each week I'll continue to share new software added to the ${a("ADDD Database", "https://app.addd.io/")}, plus specific categories, to help you find the right solutions and stay up to date on what's emerging.</p>`,
  `<h3>[N] new tools, from [the first kind] to [the last]</h3>`,
  `<p><strong>[Tool]</strong> - [What it does and who it is for, and its price where that is the point.] ${a("[tool.com]")}</p>`,
  image(),
  `<p><strong>[Tool]</strong> - [What it does and who it is for.] ${a("[tool.com]")}</p>`,
  image(),
  `<p><strong>[Tool]</strong> - [What it does and who it is for.] ${a("[tool.com]")}</p>`,
  image(),

  // 6. videos
  `<h2>Videos You Need to Watch</h2>`,
  `<p><strong>[Video title, speaker]</strong> - [why it is worth the time]. ${a("Watch here")}</p>`,
  image(),

  // 7. the role of the week
  `<h2>One Role Worth Noticing This Week</h2>`,
  `<p><strong>Role:</strong> ${a("[Role title - Company]")}</p>`,
  `<p>[What the company does, what the role owns day to day, and the line from the listing that says the most.]</p>`,
  `<p>→ View role: ${a("Here")}</p>`,
  `<p>See all roles here: ${a("www.aectechjobs.com/search", "http://www.aectechjobs.com/search")} </p>`,
  image(),

  // 8. what it means, the next step, the sign-off
  `<h2>What this issue means for practice leaders</h2>`,
  `<p>[Your reading of the week: the pattern across the posts, and what most practices are doing about it.]</p>`,
  `<p>[How this issue's tools, events and role show the alternative in practice.]</p>`,
  `<p>[The practical step: one thing to find out, and one thing to try, this month.]</p>`,
  `<p><strong>If you would like help making these decisions across the whole practice, that is what the ADDD workshop is for: a half-day session, in person or online, that looks at where technology creates friction across your workflows and ends with a written report on the problems, the priorities and the next steps. The easiest way to start is a </strong>${a("<strong>30-minute call</strong>", BOOK_CALL)}<strong>.</strong></p>`,
  `<p>That's it for this week.</p>`,
  `<p>If something in here landed - or if you disagree - reply and tell me. I read every response.</p>`,
  `<p>Thanks for reading!</p>`,
  `<p>Allister</p>`,
  `<aside>Image</aside>`,
  `<p>[A line about Richard.]</p>`,
].join("");

export const NEWSLETTER_TEMPLATE = {
  id: "addditive-template",
  slug: "addditive-template",
  title: "[Template] The week's one idea, as a plain statement",
  subtitle: "[One sentence on what is inside: the two posts, the live session, the new tools and the role of the week.]",
  date: "2026-11-16T07:30:00.000Z",
  audience: "free",
  hidden: false,
  tags: ["template"],
  author: "Allister Lewis",
  readTime: "6 minutes",
  html,
};
