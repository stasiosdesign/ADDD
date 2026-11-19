/* api/subscribe.js, tested with no network at all: beehiiv and Sanity are
   stand-ins (fake), recording every call, so nothing reaches the real
   beehiiv account. `npm run test:site`. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../api/subscribe.js";

const ON = { BEEHIIV_SIGNUPS: "on", BEEHIIV_API_KEY: "test-key", BEEHIIV_PUBLICATION_ID: "pub_test", VERCEL_ENV: "preview" };
const REPORT = { method: "beehiiv", automation: "aut_report", href: "https://example.com/report.pdf" };

/** A stand-in for fetch: Sanity answers with `report`, beehiiv with the given answers, in order */
function fake({ report = REPORT, subscription = { status: 201, body: { data: { status: "active" } } }, journey = { status: 201, body: { data: {} } }, sanityStatus = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers });
    const answer = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    if (String(url).includes("sanity.io")) return answer(sanityStatus, { result: report });
    if (String(url).endsWith("/subscriptions")) return answer(subscription.status, subscription.body);
    if (String(url).includes("/journeys")) return answer(journey.status, journey.body);
    throw new Error(`unexpected ${url}`);
  };
  return { calls, fetchImpl, beehiiv: () => calls.filter((call) => call.url.startsWith("https://api.beehiiv.com/")) };
}
const read = async (response) => ({ status: response.status, body: await response.json() });

test("an invalid email is refused, and nothing is called", async () => {
  const f = fake();
  const { status, body } = await read(await handle({ kind: "newsletter", email: "not-an-email" }, ON, f.fetchImpl));
  assert.equal(status, 400);
  assert.equal(body.code, "invalid-email");
  assert.equal(f.calls.length, 0);
});

test("a bot (the hidden field filled) is refused, and nothing is called", async () => {
  const f = fake();
  const { body } = await read(await handle({ kind: "newsletter", email: "a@b.co", website: "spam" }, ON, f.fetchImpl));
  assert.equal(body.code, "rejected");
  assert.equal(f.calls.length, 0);
});

test("switched off (no BEEHIIV_SIGNUPS): nothing is sent to beehiiv, and the form is told so", async () => {
  const f = fake();
  const { status, body } = await read(await handle({ kind: "newsletter", email: "a@b.co" }, { ...ON, BEEHIIV_SIGNUPS: undefined }, f.fetchImpl));
  assert.equal(status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.code, "signups-off");
  assert.equal(f.beehiiv().length, 0);
});

test("switched off, a report with a download: the download is given, nothing is sent", async () => {
  const f = fake();
  const { body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, { ...ON, BEEHIIV_SIGNUPS: "" }, f.fetchImpl));
  assert.equal(body.code, "signups-off");
  assert.equal(body.access, REPORT.href);
  assert.equal(f.beehiiv().length, 0);
});

test("newsletter: one subscription, welcome email on, never an automation, never a re-subscribe", async () => {
  const f = fake();
  const { body } = await read(await handle({ kind: "newsletter", email: "a@b.co", source: "footer", audience: "practice" }, ON, f.fetchImpl));
  assert.deepEqual([body.ok, body.code, body.subscribed], [true, "subscribed", "active"]);
  const calls = f.beehiiv();
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/publications\/pub_test\/subscriptions$/);
  assert.equal(calls[0].body.reactivate_existing, false);
  assert.equal(calls[0].body.send_welcome_email, true);
  assert.equal(calls[0].headers.Authorization, "Bearer test-key");
});

test("newsletter: double opt-in is reported as pending, not as done", async () => {
  const f = fake({ subscription: { status: 201, body: { data: { status: "validating" } } } });
  const { body } = await read(await handle({ kind: "newsletter", email: "a@b.co" }, ON, f.fetchImpl));
  assert.equal(body.subscribed, "pending");
});

test("someone who unsubscribed stays unsubscribed: no automation, told plainly", async () => {
  const f = fake({ subscription: { status: 200, body: { data: { status: "inactive" } } } });
  const { body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, ON, f.fetchImpl));
  assert.equal(body.code, "unsubscribed");
  assert.equal(body.emailed, false);
  assert.equal(f.beehiiv().filter((call) => call.url.includes("journeys")).length, 0);
});

test("report with consent: subscription without the welcome email, then that report's own automation", async () => {
  const f = fake();
  const { body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, ON, f.fetchImpl));
  assert.deepEqual([body.ok, body.code, body.emailed, body.access], [true, "sent", true, REPORT.href]);
  const [subscription, journey] = f.beehiiv();
  assert.equal(subscription.body.send_welcome_email, false);
  assert.match(journey.url, /\/automations\/aut_report\/journeys$/);
  assert.deepEqual(journey.body, { email: "a@b.co" });
});

test("the automation is the report's, from Sanity, never one the browser names", async () => {
  const f = fake();
  await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true, automation: "aut_other" }, ON, f.fetchImpl);
  assert.ok(f.beehiiv().every((call) => !call.url.includes("aut_other")));
  // and the report is read from staging on staging, production on production
  assert.match(f.calls[0].url, /\/staging\?/);
  const g = fake();
  await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, { ...ON, VERCEL_ENV: "production" }, g.fetchImpl);
  assert.match(g.calls[0].url, /\/production\?/);
});

test("report without consent: nothing sent to beehiiv, the download given", async () => {
  const f = fake();
  const { body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: false }, ON, f.fetchImpl));
  assert.deepEqual([body.ok, body.code, body.access], [true, "access", REPORT.href]);
  assert.equal(f.beehiiv().length, 0);
});

test("report with no download link: the tick is needed, as the email is how it arrives", async () => {
  const f = fake({ report: { ...REPORT, href: null } });
  const { status, body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co" }, ON, f.fetchImpl));
  assert.equal(status, 400);
  assert.equal(body.code, "consent-needed");
  assert.equal(f.beehiiv().length, 0);
});

test("a report with no automation chosen can't be signed up for here", async () => {
  const f = fake({ report: { ...REPORT, automation: null } });
  const { status, body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, ON, f.fetchImpl));
  assert.equal(status, 404);
  assert.equal(body.code, "not-available");
  assert.equal(f.beehiiv().length, 0);
});

test("the automation fails: never shown as sent; the download still given where there is one", async () => {
  const f = fake({ journey: { status: 400, body: { errors: [{ message: "automation has no API trigger" }] } } });
  const { body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, ON, f.fetchImpl));
  assert.equal(body.code, "email-failed");
  assert.equal(body.emailed, false);
  assert.equal(body.access, REPORT.href);
  const g = fake({ report: { ...REPORT, href: null }, journey: { status: 500, body: {} } });
  const second = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, ON, g.fetchImpl));
  assert.equal(second.status, 502);
  assert.equal(second.body.ok, false);
});

test("a repeat sign-up (already in the automation) counts as done, not as an error", async () => {
  const f = fake({ journey: { status: 409, body: { errors: [{ message: "Subscription already in automation" }] } } });
  const { body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, ON, f.fetchImpl));
  assert.equal(body.code, "sent");
});

test("beehiiv down: an error, never a success", async () => {
  const f = fake({ subscription: { status: 503, body: {} } });
  const { status, body } = await read(await handle({ kind: "newsletter", email: "a@b.co" }, ON, f.fetchImpl));
  assert.equal(status, 502);
  assert.equal(body.ok, false);
});

test("Sanity unreachable: an error, and nothing sent to beehiiv", async () => {
  const f = fake({ sanityStatus: 500 });
  const { body } = await read(await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, ON, f.fetchImpl));
  assert.equal(body.code, "unavailable");
  assert.equal(f.beehiiv().length, 0);
});

test("no answer ever carries the beehiiv key", async () => {
  const f = fake();
  const response = await handle({ kind: "report", report: "fass-assessment", email: "a@b.co", consent: true }, ON, f.fetchImpl);
  assert.ok(!(await response.text()).includes("test-key"));
});
