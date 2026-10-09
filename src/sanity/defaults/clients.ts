import type { ImageDefault } from './types';

/* The practices in the home page's logo strip, in the strip's order: wide
   single-line wordmarks alternate with compact, stacked marks, five of each,
   so no two of a kind meet. The seed script makes one client document each
   (studio/scripts/seed.ts, IDs client-<n>), uploading the white marks the
   strip has always shown; the home page's Logos list references them in
   this order, and the testimonials name the practice whose mark they show. */
export type ClientDefault = { _id: string; name: string; logo: ImageDefault };

export const CLIENTS: ClientDefault[] = [
  { _id: 'client-adam', name: 'ADAM Architecture', logo: { path: 'assets/logos/White/ADAM-Logo.png', alt: 'ADAM Architecture' } },
  { _id: 'client-epr', name: 'EPR Architects', logo: { path: 'assets/logos/White/epr-architects-logo.png', alt: 'EPR Architects' } },
  { _id: 'client-studio-seilern', name: 'Studio Seilern Architects', logo: { path: 'assets/logos/White/studio-seilern-logo.png', alt: 'Studio Seilern Architects' } },
  { _id: 'client-architecture-plb', name: 'Architecture PLB', logo: { path: 'assets/logos/White/Architecture-PLB-Logo.png', alt: 'Architecture PLB' } },
  { _id: 'client-haworth-tompkins', name: 'Haworth Tompkins', logo: { path: 'assets/logos/White/Haworth-Tompkins-Logo.png', alt: 'Haworth Tompkins' } },
  { _id: 'client-ackroyd-lowrie', name: 'Ackroyd Lowrie', logo: { path: 'assets/logos/White/ackroyd-lowrie-logo.png', alt: 'Ackroyd Lowrie' } },
  { _id: 'client-morris-company', name: 'Morris + Company', logo: { path: 'assets/logos/White/Morris-Company-Logo.png', alt: 'Morris + Company' } },
  { _id: 'client-dmwr', name: 'DMWR Architects', logo: { path: 'assets/logos/White/dmwr-architects-logo.png', alt: 'DMWR Architects' } },
  { _id: 'client-orms', name: 'ORMS', logo: { path: 'assets/logos/White/Ormsss-Logo.png', alt: 'ORMS' } },
  { _id: 'client-shh', name: 'SHH', logo: { path: 'assets/logos/White/SHH-logo.png', alt: 'SHH' } },
];
