/** A picture the page shipped with: its file under public/ as the page references it (assets/...), and its alt text */
export type ImageDefault = { path: string; alt?: string };

/** A block of a list: its key (the Visual editor redraws the list by it) and its fields */
export type BlockDefault = { _key: string; [field: string]: unknown };

/** The keyed blocks of a list, from plain objects: "<name>-1", "<name>-2"… */
export const keyed = <T extends Record<string, unknown>>(name: string, items: T[]): (T & { _key: string })[] =>
  items.map((item, i) => ({ _key: `${name}-${i + 1}`, ...item }));
