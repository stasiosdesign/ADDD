/*
  The Free Tech Stacks page's shared settings (stack-diagnostic.astro,
  StackThumb.astro). The stacks themselves are in tech-stacks.ts
  (2026-11-16: the ten example workflows, which replaced the software
  inventory of 2026-11-04, its categories and the sample stacks made from
  it).
*/

/** The stacks' colour: their cards' ground and the ink on it. Since
    2026-11-04 (sixth pass, at the user's word) one colour for every stack:
    the stacks are told apart by which is being read, the one at the row's
    middle or under the pointer at full strength and the others a little
    faded (stack-space.js), not by a shade of their own. */
export interface Tone {
  ground: string;
  ink: string;
}
export const STACK_TONE: Tone = { ground: "#ffffff", ink: "#0a0a0a" };

/** where a visitor goes to see a whole stack: the ADDD app's sign-up (the
    app enforces the access; the site has no sign-in of its own) */
export const APP_SIGN_UP = "https://app.addd.io/sign-up";
