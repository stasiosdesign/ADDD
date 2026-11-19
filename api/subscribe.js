/* ============================================================
   /api/subscribe — the website's beehiiv sign-ups (2026-11-19)
   ============================================================
   Two journeys, one address (a Vercel Function of its own, so it works on
   the static live site as on staging):

     newsletter  the footer's and the menu's ADDDitive sign-up: the visitor
                 joins the publication (beehiiv's welcome email, as beehiiv
                 has it set up). No report automation, ever.
     report      a report page's sign-up (reports/[slug].astro), for a report
                 whose access is a beehiiv automation chosen in Sanity. The
                 report is looked up here, on the server, in the dataset this
                 deployment shows: the automation and the download link come
                 from Sanity, never from the browser, so a form can't start
                 another report's automation.
                 Consent is the visitor's own (the form's tick box): with it,
                 they join the publication and the report's automation starts;
                 without it, nothing is sent to beehiiv and they get the
                 download link alone. A report with no download link is only
                 sent by its automation's email, so its form asks for the tick.

   Switched off until approved: beehiiv is written to only when the
   deployment has BEEHIIV_SIGNUPS=on (Vercel's environment variables). Until
   then every journey answers "signups-off" and nothing is sent; a report's
   download link is still given where it has one, and the form says plainly
   that nothing was sent.

   What it never does: re-subscribe someone who unsubscribed
   (reactivate_existing: false), send the welcome email for a report, put
   anything of beehiiv's key in an answer, or claim success when a step
   failed. Answers say which steps happened (subscribed, emailed) so the
   form can say exactly that.

   beehiiv's API: subscriptions are created with
   POST /v2/publications/{pub}/subscriptions; a subscriber is added to an
   automation with POST /v2/publications/{pub}/automations/{id}/journeys (the
   automation needs beehiiv's "Add by API" trigger).
   ============================================================ */

const API = "https://api.beehiiv.com/v2";
const SANITY = "https://xqa8b0u9.apicdn.sanity.io/v2025-02-19/data/query";
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** beehiiv, retried only when it asks us to wait (429): a write is never repeated after it may have happened */
async function beehiiv(env, fetchImpl, path, body) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetchImpl(`${API}/publications/${env.BEEHIIV_PUBLICATION_ID}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.BEEHIIV_API_KEY}`, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status !== 429 || attempt >= 3) {
      const data = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, data };
    }
    const wait = Number(response.headers.get("retry-after"));
    await sleep(Number.isFinite(wait) && wait > 0 ? Math.min(wait, 5) * 1000 : 800 * attempt);
  }
}

/** The report, as published in the dataset this deployment shows */
async function findReport(env, fetchImpl, slug) {
  const dataset = env.VERCEL_ENV === "production" ? "production" : "staging";
  const query = `*[_type == "report" && slug.current == $slug && !(_id in path("drafts.**"))][0]{"method": access.method, "automation": access.beehiivAutomation.id, "href": access.href}`;
  const url = `${SANITY}/${dataset}?query=${encodeURIComponent(query)}&%24slug=${encodeURIComponent(JSON.stringify(slug))}&perspective=published`;
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`sanity ${response.status}`);
  return (await response.json()).result ?? null;
}

/** The whole journey: exported apart from Vercel's handler, so it can be tested without the network (test/subscribe.test.mjs) */
export async function handle(input, env, fetchImpl = fetch) {
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const kind = input?.kind === "report" ? "report" : input?.kind === "newsletter" ? "newsletter" : "";
  // a field people never see: only a bot fills it in
  if (input?.website) return json(400, { ok: false, code: "rejected" });
  if (!kind) return json(400, { ok: false, code: "bad-request" });
  if (!email || email.length > 254 || !EMAIL.test(email)) return json(400, { ok: false, code: "invalid-email" });

  let report = null;
  if (kind === "report") {
    const slug = typeof input.report === "string" ? input.report : "";
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) return json(400, { ok: false, code: "bad-request" });
    try {
      report = await findReport(env, fetchImpl, slug);
    } catch {
      return json(502, { ok: false, code: "unavailable" });
    }
    if (!report || report.method !== "beehiiv" || !report.automation) return json(404, { ok: false, code: "not-available" });
  }

  const access = report?.href || undefined;
  const consent = kind === "newsletter" || input.consent === true;
  // a report without a download link only arrives by its automation's email
  if (kind === "report" && !consent && !access) return json(400, { ok: false, code: "consent-needed" });
  // no tick: nothing is sent to beehiiv; the download is theirs
  if (kind === "report" && !consent) return json(200, { ok: true, code: "access", access, subscribed: false, emailed: false });

  if (env.BEEHIIV_SIGNUPS !== "on" || !env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
    return json(503, { ok: false, code: "signups-off", access, subscribed: false, emailed: false });
  }

  const source = typeof input.source === "string" ? input.source.slice(0, 40) : kind;
  let created;
  try {
    created = await beehiiv(env, fetchImpl, "/subscriptions", {
      email,
      reactivate_existing: false,
      send_welcome_email: kind === "newsletter",
      utm_source: "addd-website",
      utm_medium: source,
      utm_campaign: kind === "report" ? input.report : typeof input.audience === "string" ? input.audience.slice(0, 40) : "newsletter",
      referring_site: "https://addd.io",
    });
  } catch {
    return json(502, { ok: false, code: "beehiiv-down", access, subscribed: false, emailed: false });
  }
  if (!created.ok) {
    return json(created.status === 400 || created.status === 422 ? 400 : 502, { ok: false, code: created.status === 400 || created.status === 422 ? "invalid-email" : "beehiiv-error", access, subscribed: false, emailed: false });
  }
  const status = String(created.data?.data?.status ?? "");
  // someone who unsubscribed stays unsubscribed: nothing more is done for them
  if (status === "inactive" || status === "unsubscribed") return json(200, { ok: false, code: "unsubscribed", access, subscribed: false, emailed: false });
  if (status === "invalid") return json(400, { ok: false, code: "invalid-email", access, subscribed: false, emailed: false });
  const subscribed = status === "pending" || status === "validating" ? "pending" : "active";
  if (kind === "newsletter") return json(200, { ok: true, code: "subscribed", subscribed });

  // the report's own automation
  let journey;
  try {
    journey = await beehiiv(env, fetchImpl, `/automations/${encodeURIComponent(report.automation)}/journeys`, { email });
  } catch {
    journey = { ok: false, status: 0, data: null };
  }
  const already = journey.status === 409 || /already/i.test(JSON.stringify(journey.data ?? ""));
  if (journey.ok || already) return json(200, { ok: true, code: "sent", access, subscribed, emailed: true });
  // signed up, but the report's email couldn't be started: said as it is
  console.error("[subscribe] automation", report.automation, "answered", journey.status);
  return json(access ? 200 : 502, { ok: Boolean(access), code: "email-failed", access, subscribed, emailed: false });
}

export async function POST(request) {
  // the site's own pages only
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json(403, { ok: false, code: "rejected" });
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return json(415, { ok: false, code: "bad-request" });
  const text = await request.text();
  if (text.length > 4000) return json(413, { ok: false, code: "bad-request" });
  let input;
  try {
    input = JSON.parse(text);
  } catch {
    return json(400, { ok: false, code: "bad-request" });
  }
  return handle(input, process.env);
}
