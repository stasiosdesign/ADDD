/* ============================================================
   The Contact page's enquiry form (contact.astro; styles: pages.css,
   "The enquiry form"), 2026-11-16
   ------------------------------------------------------------
   Two things, both over plain form controls, so the form stays an
   ordinary form a handler can read (name, email, topic, message):

   - The topic: a select of the site's own design over the real one. The
     real <select name="topic"> is what the form sends, what the AEC Tech
     Partners links set (site.js, initEnquiryOffer: ?offer=) and what is
     checked; it is out of sight, and the button and list shown keep in
     step with it both ways. The pattern is the ARIA "select-only
     combobox": the button keeps the focus, the list's options are named
     to it as they are reached (aria-activedescendant). Keys: Enter, Space
     or Down opens it on the chosen option (Up on the last); Up and Down
     move, Home and End go to the ends, typing a letter goes to the next
     option starting with it; Enter or Space chooses, Tab chooses and goes
     on, Escape closes without choosing. A pointer: the option under it is
     the one reached; a click chooses; a press outside closes it. It opens
     with a short fade and drop (CSS), and closes the same way back.

   - The checks and the answer: nothing is sent until every field is
     filled in (an email that looks like one, a topic chosen); each field
     that is not says so under it, and the first is focused. After a first
     try, each field is checked again as it changes. With a handler
     (the form's action), the form is posted to it and says whether that
     worked; without one (as now: the site has no form handler yet) it says
     so plainly and gives the email address, rather than pretend to send.
   ============================================================ */
import { registerPageCleanup } from "./page.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// how long the list takes to go (pages.css: .cf-select__list's transition)
const CLOSE_MS = 180;

function mountSelect(root, native, signal) {
  const button = root.querySelector('[role="combobox"]');
  const list = root.querySelector('[role="listbox"]');
  const options = [...list.querySelectorAll('[role="option"]')];
  const value = root.querySelector("[data-select-value]");
  const placeholder = value.textContent;
  let open = false;
  let active = -1;
  let hideTimer = 0;
  let typed = "";
  let typedTimer = 0;

  const chosen = () => options.findIndex((o) => o.dataset.value === native.value);
  // the shown select, as the real one now stands
  function sync() {
    const i = chosen();
    options.forEach((o, k) => o.setAttribute("aria-selected", String(k === i)));
    value.textContent = i >= 0 ? options[i].dataset.value : placeholder;
    value.classList.toggle("is--placeholder", i < 0);
  }
  function reach(i, scroll = true) {
    active = Math.max(0, Math.min(options.length - 1, i));
    options.forEach((o, k) => o.classList.toggle("is--active", k === active));
    button.setAttribute("aria-activedescendant", options[active].id);
    if (scroll) options[active].scrollIntoView({ block: "nearest" });
  }
  function show(at) {
    if (open) return;
    open = true;
    clearTimeout(hideTimer);
    list.hidden = false;
    button.setAttribute("aria-expanded", "true");
    // in the next frame, so its fade runs from nothing
    requestAnimationFrame(() => open && root.setAttribute("data-open", ""));
    reach(at ?? (chosen() >= 0 ? chosen() : 0));
  }
  function hide() {
    if (!open) return;
    open = false;
    root.removeAttribute("data-open");
    button.setAttribute("aria-expanded", "false");
    button.removeAttribute("aria-activedescendant");
    options.forEach((o) => o.classList.remove("is--active"));
    hideTimer = setTimeout(() => (list.hidden = true), CLOSE_MS);
  }
  function choose(i) {
    const o = options[i];
    if (!o) return;
    native.value = o.dataset.value;
    native.dispatchEvent(new Event("change", { bubbles: true }));
    hide();
    button.focus();
  }
  // a letter typed: the next option starting with what has been typed
  function typeTo(ch) {
    clearTimeout(typedTimer);
    typed += ch.toLowerCase();
    typedTimer = setTimeout(() => (typed = ""), 600);
    const from = open ? active : chosen();
    const order = options.map((_, k) => (from + 1 + k) % options.length);
    const hit = order.find((k) => options[k].dataset.value.toLowerCase().startsWith(typed)) ?? order.find((k) => options[k].dataset.value.toLowerCase().startsWith(typed[0]));
    if (hit == null) return;
    if (open) reach(hit);
    else {
      native.value = options[hit].dataset.value;
      native.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  button.addEventListener("click", () => (open ? hide() : show()), { signal });
  button.addEventListener("keydown", (e) => {
    const { key } = e;
    if (key === "Tab") {
      if (open) choose(active);
      return;
    }
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(key)) {
        e.preventDefault();
        show();
      } else if (key === "ArrowUp") {
        e.preventDefault();
        show(chosen() >= 0 ? chosen() : options.length - 1);
      } else if (key === "Home" || key === "End") {
        e.preventDefault();
        show(key === "Home" ? 0 : options.length - 1);
      } else if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeTo(key);
      return;
    }
    if (key === "ArrowDown") reach(active + 1);
    else if (key === "ArrowUp") e.altKey ? choose(active) : reach(active - 1);
    else if (key === "Home") reach(0);
    else if (key === "End") reach(options.length - 1);
    else if (key === "PageDown") reach(active + 5);
    else if (key === "PageUp") reach(active - 5);
    else if (key === "Enter" || key === " ") choose(active);
    else if (key === "Escape") hide();
    else if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typeTo(key);
      return;
    } else return;
    e.preventDefault();
  }, { signal });
  options.forEach((o, i) => {
    o.addEventListener("pointermove", () => active !== i && reach(i, false), { signal });
    // pressed: kept from taking the focus off the button
    o.addEventListener("pointerdown", (e) => e.preventDefault(), { signal });
    o.addEventListener("click", () => choose(i), { signal });
  });
  document.addEventListener("pointerdown", (e) => {
    if (open && !root.contains(e.target)) hide();
  }, { signal });
  button.addEventListener("blur", () => setTimeout(() => {
    if (open && !root.contains(document.activeElement)) hide();
  }, 0), { signal });
  native.addEventListener("change", sync, { signal });
  sync();
  return { sync, focus: () => button.focus(), button };
}

export function initEnquiryForm(container) {
  container.querySelectorAll("[data-enquiry-form]").forEach((form) => {
    const live = new AbortController();
    const { signal } = live;
    const native = form.querySelector('select[name="topic"]');
    const selectRoot = form.querySelector("[data-enquiry-select]");
    const select = native && selectRoot ? mountSelect(selectRoot, native, signal) : null;
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector('[type="submit"]');
    const fields = {
      name: form.elements.namedItem("name"),
      email: form.elements.namedItem("email"),
      topic: native,
      message: form.elements.namedItem("message"),
    };
    const rules = {
      name: (el) => el.value.trim().length > 0,
      email: (el) => EMAIL.test(el.value.trim()),
      topic: (el) => el.value !== "",
      message: (el) => el.value.trim().length > 0,
    };
    let tried = false;

    // one field checked: its error shown or hidden, its state said
    function check(key) {
      const el = fields[key];
      if (!el) return true;
      const ok = rules[key](el);
      const shown = key === "topic" ? select?.button : el;
      const error = form.querySelector(`[data-error-for="${el.id}"]`);
      shown?.setAttribute("aria-invalid", String(!ok));
      shown?.closest(".cf-field")?.classList.toggle("is--invalid", !ok);
      if (error) error.hidden = ok;
      return ok;
    }
    // the form's messages: the Contact page document's (form.*, passed on
    // the form as data-messages), each falling back to its words here; {n}
    // is a number, {email} the address on the pass
    let messages = {};
    try {
      messages = JSON.parse(form.dataset.messages || "{}");
    } catch {
      messages = {};
    }
    const word = (key, fallback, values = {}) =>
      (messages[key] || fallback).replace(/[{]([a-zA-Z]+)[}]/g, (all, name) => (name in values ? String(values[name]) : all));
    const attention = (n) => (n === 1 ? word("oneError", "One field needs your attention.") : word("manyErrors", "{n} fields need your attention.", { n }));
    function say(text, tone = "") {
      if (!status) return;
      status.textContent = text;
      status.dataset.tone = tone;
    }

    // after a first try: the count said beside the button kept true as
    // fields are put right (and gone once none is left)
    function recount() {
      if (status?.dataset.tone !== "error") return;
      const left = Object.keys(fields).filter((key) => fields[key] && !rules[key](fields[key])).length;
      if (!left) say("");
      else say(attention(left), "error");
    }
    Object.keys(fields).forEach((key) => {
      const el = fields[key];
      if (!el) return;
      const again = () => {
        if (!tried) return;
        check(key);
        recount();
      };
      el.addEventListener(key === "topic" ? "change" : "input", again, { signal });
      el.addEventListener("blur", again, { signal });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      tried = true;
      const bad = Object.keys(fields).filter((key) => !check(key));
      if (bad.length) {
        say(attention(bad.length), "error");
        const first = bad[0];
        (first === "topic" ? select?.button : fields[first])?.focus();
        return;
      }
      const action = form.getAttribute("action");
      const email = document.querySelector('.page--contact a[href^="mailto:"]')?.textContent?.trim() || "allister@addd.io";
      if (!action) {
        // no form handler yet: said plainly, nothing pretended
        say(word("notConnected", "Thank you. The form isn’t connected yet, so nothing has been sent: please email {email} and we’ll reply.", { email }), "note");
        return;
      }
      form.setAttribute("aria-busy", "true");
      submit?.setAttribute("disabled", "");
      say(word("sending", "Sending…"));
      try {
        const res = await fetch(action, { method: (form.getAttribute("method") || "post").toUpperCase(), body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        select?.sync();
        tried = false;
        say(word("sent", "Thank you. Your enquiry has been sent, and we’ll be in touch soon."), "done");
      } catch {
        say(word("failed", "Sorry, that didn’t go through. Please try again, or email {email}.", { email }), "error");
      } finally {
        form.removeAttribute("aria-busy");
        submit?.removeAttribute("disabled");
      }
    }, { signal });
    form.addEventListener("reset", () => requestAnimationFrame(() => select?.sync()), { signal });

    registerPageCleanup(() => live.abort());
  });
}
