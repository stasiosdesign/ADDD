/* A timeline as the Studio holds it (timelineField, 2026-11-17): one field
   per timeline, its stages each with a title, a length, an optional start,
   its timing words and its points. Laid out here once, for the page
   (StageTimeline.astro) and for the Visual editor's live drafts
   (live-preview.ts), so both draw it the same way.

   Lengths are drawn to scale: the chart is cut into half units (half a
   day, week or step), each stage's box spanning its length in them, so a
   stage of three weeks is three times as long as one of one. A stage with
   no start begins when the one before it ends. */

export type TimelineBy = 'addd' | 'you' | 'optional';
export interface TimelineValue {
  unit?: string;
  stages?: { _key?: string; title?: string; length?: number; start?: number; when?: string; items?: { _key?: string; label?: string; by?: string }[] }[];
}
export interface LaidOutStage {
  key?: string;
  title: string;
  when: string;
  items: { label: string; by: TimelineBy }[];
  /** grid placement, in half units from 0 */
  start: number;
  span: number;
}

// the grid's resolution: half a unit
const STEPS = 2;
const NAMES: Record<string, [string, string]> = { day: ['Day', 'Days'], week: ['Week', 'Weeks'] };
const BY = new Set(['addd', 'you', 'optional']);
const tidy = (n: number) => String(Math.round(n * 2) / 2).replace(/\.5$/, '½');

export function layoutTimeline(value: TimelineValue | null | undefined): { units: number; stages: LaidOutStage[] } {
  const unit = value?.unit ?? 'week';
  let cursor = 0;
  const stages = (value?.stages ?? []).map((stage) => {
    const length = Math.max(0.5, Number(stage.length) || 1);
    const from = stage.start && stage.start >= 1 ? stage.start - 1 : cursor;
    cursor = from + length;
    const names = NAMES[unit];
    // its timing words, or the units it runs (Week 1, Weeks 2–4)
    const auto = !names ? '' : length <= 1 ? `${names[0]} ${tidy(from + 1)}` : `${names[1]} ${tidy(from + 1)}–${tidy(from + length)}`;
    return {
      key: stage._key,
      title: stage.title ?? '',
      when: stage.when?.trim() || auto,
      items: (stage.items ?? []).filter((item) => item.label).map((item) => ({ label: item.label ?? '', by: (BY.has(item.by ?? '') ? item.by : 'addd') as TimelineBy })),
      start: Math.round(from * STEPS),
      span: Math.max(1, Math.round(length * STEPS)),
    };
  });
  const units = Math.max(1, ...stages.map((s) => s.start + s.span));
  return { units, stages };
}
