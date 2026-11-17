/* The Free Tech Stacks, from the Tech Stacks page document in Sanity
   (stacks.items, studio/schemaTypes/documents/tech-stack.ts), in the
   Studio's order: each stack its name, its lines, and its stages, an open
   stage naming its tool (what it does there, its alternatives, its logo)
   and a locked one only its stage. Until the document has any, the stacks
   the page was built with (src/data/tech-stacks.ts, through the page's
   defaults). Read by the page (stack-diagnostic.astro) and by the
   navigation's small row of cards (StackThumb.astro), once per request. */
import { cachedDocument, reader } from './content';
import { hasImage, imageAttrs } from './image';
import { stackDiagnosticPage as D } from './defaults/stack-diagnostic';
import type { Stage, TechStack } from '../data/tech-stacks';

type StageBlock = { _key: string; stage?: string; locked?: boolean; tool?: string; does?: string; alternatives?: string[]; logo?: unknown };
type StackBlock = { _key: string; name?: string; short?: string; summary?: string; note?: string; stages?: StageBlock[]; url?: string };

/** A stack as the page draws it: TechStack, with where its way in leads when it has its own place in the app */
export type SiteStack = TechStack & { url?: string };

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** A logo for a stage: the picture set in the Studio, or the file the page shipped with */
function logoOf(value: unknown): string | undefined {
  if (hasImage(value)) return imageAttrs(value, 96).src;
  if (value && typeof value === 'object' && 'path' in value) return String((value as { path: string }).path) || undefined;
  return undefined;
}

export async function techStacks(locals: App.Locals): Promise<SiteStack[]> {
  const { items } = reader(await cachedDocument(locals, 'stackDiagnosticPage'), D);
  return items<StackBlock>('stacks.items')
    .map(({ block, key }) => {
      const stages: Stage[] = (block.stages ?? [])
        .filter((s) => text(s.stage))
        .map((s) =>
          s.locked
            ? { stage: text(s.stage), locked: true as const }
            : {
                stage: text(s.stage),
                tool: text(s.tool) || text(s.stage),
                does: text(s.does),
                alternatives: (s.alternatives ?? []).map(text).filter(Boolean),
                ...(logoOf(s.logo) ? { logo: logoOf(s.logo) } : {}),
              },
        );
      return {
        id: key,
        name: text(block.name),
        short: text(block.short),
        summary: text(block.summary),
        ...(text(block.note) ? { note: text(block.note) } : {}),
        ...(text(block.url) ? { url: text(block.url) } : {}),
        stages,
      };
    })
    .filter((stack) => stack.name && stack.stages.length > 0);
}
