// -----------------------------------------
// ADDD — the booking calendar (a demonstration)
// -----------------------------------------
//
// A button marked data-booking-open="<id>" opens the BookingDialog.astro
// with that id (any number of buttons can open one: the service pages'
// Book a Free Call and their floating Book a Call open the same calendar,
// set up once): a native modal dialog over a soft scrim, the card rising a
// little into place as the scrim fades in, and back the same way as it
// closes (on its button, the scrim, or Escape). The page's scroll stops
// while it is open and starts again after, where it was.
//
// The calendar is drawn here, a month at a time, Monday first: the days a
// workshop could take are Tuesday to Thursday from a week ahead (a stand-in
// rule until a real calendar is connected). A day and a time picked, the
// request only says thank you. Nothing is sent anywhere.

import { lenis } from "./scroll.js";
import { motion, registerPageCleanup } from "./page.js";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
// the days that can be picked: the dialog's weekdays (data-booking-days,
// getDay numbers; Tuesday to Thursday by default), from LEAD days on
const DEFAULT_DAYS = [2, 3, 4];
const LEAD = 7;
// how many months ahead the calendar goes
const MONTHS_AHEAD = 6;

const monthName = (d) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const dayName = (d) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

export function initBooking(container) {
  const openers = [...container.querySelectorAll("[data-booking-open]")];
  const dialogs = new Set(openers.map((o) => document.getElementById(o.dataset.bookingOpen)).filter(Boolean));
  dialogs.forEach((dialog) => {
    if (dialog.booking) return;
    // every button on the page that opens this one
    const mine = openers.filter((o) => o.dataset.bookingOpen === dialog.id);
    const card = dialog.querySelector(".booking__card");
    const scrim = dialog.querySelector(".booking__scrim");
    const grid = dialog.querySelector("[data-booking-days]");
    const label = dialog.querySelector("[data-booking-month]");
    const steps = [...dialog.querySelectorAll("[data-booking-step]")];
    const slots = [...dialog.querySelectorAll("[data-booking-slot]")];
    const summary = dialog.querySelector("[data-booking-summary]");
    const confirm = dialog.querySelector("[data-booking-confirm]");
    const done = dialog.querySelector("[data-booking-done]");
    const openDays = new Set((dialog.dataset.bookingDays || "").split(",").filter(Boolean).map(Number));
    if (!openDays.size) DEFAULT_DAYS.forEach((d) => openDays.add(d));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const first = new Date(today);
    first.setDate(first.getDate() + LEAD);
    let month = new Date(today.getFullYear(), today.getMonth(), 1);
    let picked = null; // a Date
    let slot = null; // its label
    let running = [];
    let open = false;
    let scrollY = 0;

    // ---- the calendar -------------------------------------------------
    const isOpenDay = (d) => d >= first && openDays.has(d.getDay());
    const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();

    function drawMonth() {
      label.textContent = monthName(month);
      // the weekday heads stay; the days are drawn again
      grid.querySelectorAll(".booking__day, .booking__gap").forEach((el) => el.remove());
      const lead = (month.getDay() + 6) % 7; // Monday first
      for (let i = 0; i < lead; i++) grid.append(Object.assign(document.createElement("span"), { className: "booking__gap" }));
      const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (let n = 1; n <= days; n++) {
        const date = new Date(month.getFullYear(), month.getMonth(), n);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "booking__day";
        b.textContent = String(n);
        b.setAttribute("aria-label", dayName(date));
        if (!isOpenDay(date)) b.disabled = true;
        b.setAttribute("aria-pressed", String(sameDay(date, picked)));
        b.addEventListener("click", () => {
          picked = date;
          grid.querySelectorAll(".booking__day").forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
          update();
        });
        grid.append(b);
      }
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + MONTHS_AHEAD, 1);
      steps[0].disabled = month <= start;
      steps[1].disabled = month >= last;
    }

    function update() {
      const ready = picked && slot;
      summary.textContent = picked ? `${dayName(picked)}${slot ? ` · ${slot.split(",")[0]}` : ""}` : "Choose a date and a time";
      confirm.disabled = !ready;
      done.hidden = true;
    }

    steps.forEach((b) =>
      b.addEventListener("click", () => {
        month = new Date(month.getFullYear(), month.getMonth() + Number(b.dataset.bookingStep), 1);
        drawMonth();
      }),
    );
    slots.forEach((b) =>
      b.addEventListener("click", () => {
        slot = b.dataset.bookingSlot;
        slots.forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
        update();
      }),
    );
    confirm.addEventListener("click", () => {
      if (!picked || !slot) return;
      done.hidden = false;
    });

    // ---- open and close ---------------------------------------------
    function stop() {
      running.forEach((a) => a.cancel());
      running = [];
    }

    async function show() {
      if (open) return;
      open = true;
      stop();
      scrollY = window.scrollY;
      drawMonth();
      update();
      lenis.stop();
      dialog.showModal();
      if (motion.reduced) return;
      running = [
        scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: "ease-out" }),
        card.animate(
          [
            { opacity: 0, transform: "translate3d(0, 1rem, 0) scale(0.98)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 420, easing: EASE },
        ),
      ];
    }

    async function hide() {
      if (!open) return;
      open = false;
      stop();
      if (!motion.reduced) {
        const anims = [
          scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" }),
          card.animate(
            [
              { opacity: 1, transform: "none" },
              { opacity: 0, transform: "translate3d(0, 0.5rem, 0) scale(0.985)" },
            ],
            { duration: 220, easing: "ease-in", fill: "forwards" },
          ),
        ];
        running = anims;
        try {
          await Promise.all(anims.map((a) => a.finished));
        } catch {
          return; // opened again part-way
        }
        if (open) return;
      }
      dialog.close();
      stop();
      settle();
    }

    // put the page back as it was: scrolling again, where it was
    function settle() {
      lenis.start();
      if (Math.abs(window.scrollY - scrollY) > 1) lenis.scrollTo(scrollY, { immediate: true, force: true });
    }

    mine.forEach((o) => o.addEventListener("click", show));
    dialog.querySelectorAll("[data-booking-close]").forEach((el) => el.addEventListener("click", hide));
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      hide();
    });
    // closed by the browser without asking (a second Escape can do that)
    dialog.addEventListener("close", () => {
      if (!open) return;
      open = false;
      stop();
      settle();
    });
    dialog.booking = { show, hide };

    registerPageCleanup(() => {
      stop();
      if (dialog.open) dialog.close();
      if (open) lenis.start();
      open = false;
      mine.forEach((o) => o.removeEventListener("click", show));
      dialog.booking = null;
    });
  });
}
