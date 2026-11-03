/**
 * Helpers that turn raw BodyParts3D / Z-Anatomy mesh names into display names and search terms.
 * GLTFLoader replaces spaces with underscores in node names, so every helper accepts both forms.
 */

export type Side = 'Left' | 'Right' | 'Center';

const SMALL_WORDS = new Set(['of', 'the', 'and', 'in', 'at', 'to', 'for', 'on', 'by', 'or']);

const CONNECTIVE_KEYWORDS = [
  'tendon',
  'ligament',
  'retinaculum',
  'membrane',
  'fascia',
  'aponeurosis',
  'tract',
];

function titleWord(w: string): string {
  // Keep leading punctuation such as "(" and capitalise the first letter after it.
  return w.toLowerCase().replace(/^([^a-z]*)([a-z])/, (_, pre: string, c: string) => pre + c.toUpperCase());
}

/** Normalise a GLTF node name back to the original spaced form, without the " (2)" duplicate suffix. */
export function normalizeMeshName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format a raw mesh name into a readable display name.
 *   "abdominal part of left pectoralis major" -> "Left Pectoralis Major (Abdominal Part)"
 *   "left gluteus maximus" -> "Left Gluteus Maximus"
 */
export function formatMuscleName(name: string): string {
  let clean = normalizeMeshName(name);

  const partMatch = clean.match(/^(.+?)\s+(part|head|belly)\s+of\s+(?:(left|right)\s+)?(.+)$/i);
  if (partMatch) {
    const [, qualifier, keyword, side, muscle] = partMatch;
    const sideStr = side ? `${titleWord(side)} ` : '';
    clean = `${sideStr}${muscle} (${qualifier} ${keyword})`;
  }

  return clean
    .split(' ')
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : titleWord(w)))
    .join(' ');
}

/**
 * Extract a clean anatomical search term for external references.
 *   "abdominal part of left pectoralis major" -> "pectoralis major"
 *   "left calcaneal tendon" -> "calcaneal tendon"
 */
export function getAnatomySearchTerm(rawName: string): string {
  return normalizeMeshName(rawName)
    .toLowerCase()
    .replace(/\b(left|right)\b/g, '')
    .replace(/\b\w+\s+part\s+of\s+/g, '')
    .replace(/\b\w+\s+head\s+of\s+/g, '')
    .replace(/\b\w+\s+belly\s+of\s+/g, '')
    .replace(/\bset\s+of\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function determineSide(name: string): Side {
  const lower = normalizeMeshName(name).toLowerCase();
  if (/\bleft\b/.test(lower)) return 'Left';
  if (/\bright\b/.test(lower)) return 'Right';
  return 'Center';
}

/** Tendons, ligaments, fascia and similar connective tissue (as opposed to muscle belly). */
export function isConnectiveTissue(name: string): boolean {
  const lower = normalizeMeshName(name).toLowerCase();
  return CONNECTIVE_KEYWORDS.some((kw) => lower.includes(kw));
}
