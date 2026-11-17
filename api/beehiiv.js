/* ============================================================
   /api/beehiiv — the newsletter's rebuilds (2026-11-16)
   ============================================================
   The live site is static (astro.config.mjs): the newsletter's cards and
   pages are built from beehiiv (src/newsletter/beehiiv.ts) when the site is
   built. This Vercel Function starts that build when there is something new:

     POST, from beehiiv's webhook (beehiiv: Settings → Webhooks, this
       address, the events post.sent, post.updated and post.deleted): its
       signature checked against BEEHIIV_WEBHOOK_SECRET (beehiiv signs with
       Svix: svix-id, svix-timestamp, svix-signature), then the production
       build started through VERCEL_DEPLOY_HOOK_URL (the `main` branch's
       deploy hook, the one /api/publish uses);
     GET, from Vercel's daily cron (vercel.ts, crons): the same build, once
       a day, so a missed webhook (or a plan without webhooks, read through
       RSS) still reaches the site within a day. Vercel sends the cron's
       call with CRON_SECRET; anything else is refused.

   Nothing of beehiiv's is read or kept here, and no key is needed but the
   two secrets: the build reads beehiiv itself. A Vercel Function of its own
   (not an Astro route), as the live site has no server of its own.
   ============================================================ */
import { createHmac, timingSafeEqual } from "node:crypto";

// beehiiv's events that change what the site shows
const REBUILD_ON = new Set(["post.sent", "post.updated", "post.deleted", "post.unpublished"]);
// how old a signed delivery may be (s), as Svix's own libraries allow
const TOLERANCE = 5 * 60;

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Svix's signature: base64 HMAC-SHA256 of "id.timestamp.body" with the secret after whsec_ */
function verified(headers, body, secret) {
  const id = headers.get("svix-id") ?? headers.get("webhook-id");
  const timestamp = headers.get("svix-timestamp") ?? headers.get("webhook-timestamp");
  const signatures = headers.get("svix-signature") ?? headers.get("webhook-signature");
  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64"));
  return signatures.split(" ").some((entry) => {
    const [version, signature] = entry.split(",");
    if (version !== "v1" || !signature) return false;
    const given = Buffer.from(signature);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

async function rebuild(reason) {
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return json(500, { ok: false, error: "VERCEL_DEPLOY_HOOK_URL is not set" });
  const response = await fetch(hook, { method: "POST" });
  if (!response.ok) return json(502, { ok: false, error: `deploy hook answered ${response.status}` });
  return json(200, { ok: true, rebuilding: reason });
}

// beehiiv's webhook
export async function POST(request) {
  const secret = process.env.BEEHIIV_WEBHOOK_SECRET;
  if (!secret) return json(500, { ok: false, error: "BEEHIIV_WEBHOOK_SECRET is not set" });
  const body = await request.text();
  if (!verified(request.headers, body, secret)) return json(401, { ok: false, error: "bad signature" });
  let event = "";
  try {
    event = JSON.parse(body).event_type ?? "";
  } catch {
    return json(400, { ok: false, error: "not JSON" });
  }
  // another event: acknowledged, so beehiiv does not retry it
  if (!REBUILD_ON.has(event)) return json(200, { ok: true, ignored: event });
  return rebuild(event);
}

// Vercel's daily cron
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return json(401, { ok: false });
  return rebuild("daily");
}
