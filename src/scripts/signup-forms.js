// -----------------------------------------
// ADDD — the website's own beehiiv sign-ups (2026-11-19)
// -----------------------------------------
//
// A form marked data-signup="newsletter" (the footer's, the menu's) or
// data-signup="report" (a report page's, with data-report="<slug>") sends
// its email to /api/subscribe (api/subscribe.js), which does the work with
// beehiiv on the server. The form says exactly what happened, from the
// server's answer: never "done" unless it was. While the server's sign-ups
// are switched off (BEEHIIV_SIGNUPS), it says so: nothing was sent.
//
// Each form is set up once (data-signup-ready), wherever it is: the
// menu's lives outside Barba's container and is set up on load; the
// others on every page's arrival (site.js).

const MESSAGES = {
  sending: "Sending…",
  subscribed: "You’re subscribed. ADDDitive will arrive in your inbox.",
  pending: "Nearly there: check your inbox to confirm your subscription.",
  sent: "Done. The report is on its way to your inbox.",
  access: "Here it is.",
  "signups-off": "Sign-ups aren’t switched on yet, so nothing was sent.",
  unsubscribed: "This address unsubscribed from ADDDitive before, so we haven’t signed it up again. Email us if you’d like to rejoin.",
  "email-failed": "We couldn’t start the email just now.",
  "invalid-email": "That email address doesn’t look right. Check it and try again.",
  "consent-needed": "This report is sent by email: tick the box to receive it.",
  "not-available": "This report can’t be requested here just now.",
  "beehiiv-down": "We couldn’t reach our newsletter service. Nothing was sent: try again in a minute.",
  "beehiiv-error": "Something went wrong on our side. Nothing was sent: try again in a minute.",
  unavailable: "Something went wrong on our side. Nothing was sent: try again in a minute.",
  network: "You seem to be offline. Nothing was sent: try again when you’re connected.",
  default: "Something went wrong. Nothing was sent: try again.",
};

function say(status, text, tone) {
  if (!status) return;
  status.textContent = text;
  status.dataset.tone = tone;
  status.hidden = !text;
}

function setUp(form) {
  if (form.dataset.signupReady !== undefined) return;
  form.dataset.signupReady = "";
  form.removeAttribute("onsubmit");
  const status = form.querySelector("[data-signup-status]");
  const button = form.querySelector("[type=submit]");
  const access = form.querySelector("[data-signup-access]");
  let busy = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const email = form.elements.email?.value ?? "";
    const body = {
      kind: form.dataset.signup,
      email,
      source: form.dataset.source || form.dataset.signup,
      report: form.dataset.report,
      audience: form.elements.audience?.value || undefined,
      consent: form.elements.consent ? form.elements.consent.checked : undefined,
      website: form.elements.website?.value || undefined,
    };
    busy = true;
    if (button) button.disabled = true;
    form.setAttribute("aria-busy", "true");
    say(status, MESSAGES.sending, "info");
    let answer = null;
    try {
      const response = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      answer = await response.json().catch(() => null);
    } catch {
      answer = { ok: false, code: "network" };
    }
    busy = false;
    if (button) button.disabled = false;
    form.removeAttribute("aria-busy");

    const code = answer?.code ?? "default";
    let text = MESSAGES[code === "subscribed" && answer.subscribed === "pending" ? "pending" : code] ?? MESSAGES.default;
    // the report's download, where it has one, whatever happened to the email
    if (access && answer?.access) {
      access.href = answer.access;
      access.hidden = false;
      if (code === "email-failed" || code === "signups-off") text = `${MESSAGES.access} ${text} The download is below.`;
      else if (code === "access") text = MESSAGES.access;
      else if (code === "sent") text = `${MESSAGES.sent} You can also download it below.`;
    }
    const good = answer?.ok === true && code !== "email-failed";
    say(status, text, good ? "success" : "error");
    if (good && !access) form.reset();
  });
}

export function initSignupForms(root = document) {
  root.querySelectorAll("form[data-signup]").forEach(setUp);
}
