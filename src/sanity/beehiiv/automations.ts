/* /sanity/beehiiv/automations (2026-11-19): beehiiv's automations, for the
   Studio's report form (studio/components/BeehiivAutomationInput.tsx), so
   an editor picks a report's automation from the real list instead of
   typing its ID or keeping a list by hand. A new automation made in beehiiv
   shows here by itself; a renamed one shows its new name.

   Read-only: it lists automations and nothing else, with the server's own
   beehiiv key (astro:env, never sent to a browser). It never creates, edits
   or starts an automation, and never touches a subscriber.

   Staging and development only (astro.config.mjs, sanityRoutes), as the
   Studio's publishing route is: the same callers allowed (the Studio's
   origins), and the same check of who is calling (the editor's Sanity
   session, any member of the project). */
import type { APIRoute } from 'astro';
import { BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID } from 'astro:env/server';
import { projectId } from '../client';
import { request } from '../../newsletter/beehiiv';

const ALLOWED_ORIGINS = new Set(['https://addd.sanity.studio', 'http://localhost:3333']);
const API = 'https://api.beehiiv.com/v2';

export interface Automation {
  id: string;
  name: string;
  /** beehiiv's own word for it, e.g. "running", "finishing", "inactive" */
  status: string;
  /** what starts it, as beehiiv says (e.g. "api", "signup"), where it says */
  triggers: string[];
  /** false when beehiiv says it isn't running; null when it doesn't say */
  active: boolean | null;
  /** false when beehiiv says it can't be started by the website (no API trigger); null when it doesn't say */
  apiTrigger: boolean | null;
}

const headers = (origin: string | null) => ({
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  Vary: 'Origin',
  ...(origin && ALLOWED_ORIGINS.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'accept, authorization', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }
    : {}),
});
const json = (body: unknown, status: number, origin: string | null) => new Response(JSON.stringify(body), { status, headers: headers(origin) });

/** Any member of the Sanity project, checked with Sanity itself */
async function signedIn(header: string | null): Promise<boolean> {
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return false;
  const response = await fetch(`https://${projectId}.api.sanity.io/v2025-02-19/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return false;
  const me = (await response.json()) as { id?: string };
  return Boolean(me.id);
}

type ApiAutomation = Record<string, unknown> & { id?: string; name?: string; status?: string };

/** beehiiv's answer, read loosely: its fields have changed names over time */
function normalise(raw: ApiAutomation): Automation | null {
  if (typeof raw.id !== 'string' || !raw.id) return null;
  const status = typeof raw.status === 'string' ? raw.status : '';
  const listed = [raw.trigger_events, raw.triggers, raw.trigger, raw.trigger_type]
    .flat()
    .map((trigger) => (typeof trigger === 'string' ? trigger : typeof trigger === 'object' && trigger ? String((trigger as Record<string, unknown>).type ?? (trigger as Record<string, unknown>).event ?? '') : ''))
    .filter(Boolean);
  return {
    id: raw.id,
    name: (typeof raw.name === 'string' && raw.name.trim()) || raw.id,
    status,
    triggers: listed,
    active: status ? ['running', 'active', 'live', 'on'].includes(status.toLowerCase()) : null,
    apiTrigger: listed.length ? listed.some((trigger) => /api/i.test(trigger)) : null,
  };
}

export const OPTIONS: APIRoute = ({ request: req }) => new Response(null, { status: 204, headers: headers(req.headers.get('origin')) });

export const GET: APIRoute = async ({ request: req }) => {
  const origin = req.headers.get('origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: 'This route only serves the Studio.' }, 403, origin);
  if (!(await signedIn(req.headers.get('authorization')))) return json({ ok: false, error: 'Sign in to the Studio again.' }, 401, origin);
  if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
    return json({ ok: false, error: 'beehiiv is not connected on this deployment (BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID).' }, 503, origin);
  }
  try {
    const automations: Automation[] = [];
    let fields: string[] = [];
    for (let page = 1, pages = 1; page <= pages && page <= 20; page++) {
      const response = await request(`${API}/publications/${BEEHIIV_PUBLICATION_ID}/automations?limit=100&page=${page}`, {
        headers: { Authorization: `Bearer ${BEEHIIV_API_KEY}`, Accept: 'application/json' },
      });
      const body = (await response.json()) as { data?: ApiAutomation[]; total_pages?: number };
      pages = Math.max(1, body.total_pages ?? 1);
      if (!fields.length && body.data?.[0]) fields = Object.keys(body.data[0]);
      for (const raw of body.data ?? []) {
        const automation = normalise(raw);
        if (automation) automations.push(automation);
      }
    }
    automations.sort((a, b) => a.name.localeCompare(b.name));
    // fields: the names (never the values) of what beehiiv sends for one
    // automation, so a change on beehiiv's side can be seen and followed
    return json({ ok: true, automations, fields, at: new Date().toISOString() }, 200, origin);
  } catch (error) {
    console.error('[beehiiv automations]', error);
    return json({ ok: false, error: 'beehiiv could not be reached just now. Try again in a minute.' }, 502, origin);
  }
};
