import type { CourseCategory } from '@/types';

const PALETTE: Record<CourseCategory, [string, string]> = {
  'Web Development': ['#4f46e5', '#0ea5e9'],
  'UI/UX Design': ['#db2777', '#f59e0b'],
  'Data Science': ['#0d9488', '#2563eb'],
  'Artificial Intelligence': ['#7c3aed', '#ec4899'],
  'Digital Marketing': ['#ea580c', '#e11d48'],
  Business: ['#0f766e', '#65a30d'],
  Photography: ['#334155', '#a855f7'],
  Finance: ['#15803d', '#0891b2'],
  'Mobile Development': ['#2563eb', '#7c3aed'],
  'Cloud Computing': ['#0369a1', '#6366f1'],
};

const hash = (text: string): number => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9973, 7);

/** Offline-safe course artwork: a deterministic SVG data URI, so thumbnails can never be broken images. */
export function makeThumbnail(category: CourseCategory, seed: string): string {
  const [from, to] = PALETTE[category];
  const h = hash(seed);
  const x1 = 80 + (h % 200);
  const y1 = 40 + (h % 120);
  const x2 = 380 + (h % 220);
  const y2 = 160 + (h % 140);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="640" height="360" fill="url(#g)"/>` +
    `<circle cx="${x1}" cy="${y1}" r="150" fill="#fff" fill-opacity=".12"/>` +
    `<circle cx="${x2}" cy="${y2}" r="110" fill="#fff" fill-opacity=".10"/>` +
    `<rect x="${x1 + 140}" y="${y1 + 90}" width="190" height="120" rx="18" fill="#fff" fill-opacity=".16"/>` +
    `<rect x="${x1 + 160}" y="${y1 + 114}" width="110" height="10" rx="5" fill="#fff" fill-opacity=".55"/>` +
    `<rect x="${x1 + 160}" y="${y1 + 138}" width="150" height="10" rx="5" fill="#fff" fill-opacity=".35"/>` +
    `<rect x="${x1 + 160}" y="${y1 + 162}" width="80" height="10" rx="5" fill="#fff" fill-opacity=".35"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
