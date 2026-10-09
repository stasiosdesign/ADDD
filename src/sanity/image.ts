/* Images from Sanity's image CDN: every picture at the width asked for,
   never scaled up past the original, in the best format the browser
   accepts, with the editor's crop and hotspot applied. */
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { sanityClient } from './client';

const builder = createImageUrlBuilder(sanityClient);

/** The shape a query returns for an image field (asset dimensions, crop, hotspot, alt). */
export interface SanityImage {
  asset?: {
    _id?: string;
    _ref?: string;
    url?: string;
    metadata?: { dimensions?: { width?: number | null; height?: number | null } | null } | null;
  } | null;
  crop?: { top?: number | null; bottom?: number | null; left?: number | null; right?: number | null } | null;
  hotspot?: { x?: number | null; y?: number | null; height?: number | null; width?: number | null } | null;
  alt?: string | null;
}

export const hasImage = (image: unknown): image is SanityImage =>
  !!image && typeof image === 'object' && !!(image as SanityImage).asset && !!((image as SanityImage).asset?._id || (image as SanityImage).asset?._ref);

export const urlFor = (image: SanityImage) => builder.image(image as SanityImageSource).auto('format').fit('max');

/** The asset's size: from its metadata when a query followed the reference, else from the reference itself (image-<hash>-<w>x<h>-<ext>) */
function dimensionsOf(image: SanityImage): { width: number; height: number } | null {
  const fromMetadata = image.asset?.metadata?.dimensions;
  if (fromMetadata?.width && fromMetadata?.height) return { width: fromMetadata.width, height: fromMetadata.height };
  const id = image.asset?._ref ?? image.asset?._id ?? '';
  const match = /-(\d+)x(\d+)-/.exec(id);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

/** src, width and height for an <img>, at the given display width (never wider than the original). */
export function imageAttrs(image: SanityImage, width = 1600) {
  const dimensions = dimensionsOf(image);
  const crop = image.crop ?? {};
  const w = (dimensions?.width ?? 1) * (1 - (crop.left ?? 0) - (crop.right ?? 0));
  const h = (dimensions?.height ?? 1) * (1 - (crop.top ?? 0) - (crop.bottom ?? 0));
  const shown = dimensions ? Math.min(width, Math.round(w)) : width;
  return {
    src: urlFor(image).width(shown).url(),
    width: shown,
    height: dimensions ? Math.round((shown * h) / w) : undefined,
  };
}
