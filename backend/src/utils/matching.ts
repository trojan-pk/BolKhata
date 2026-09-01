/**
 * Pure name-matching helpers for the voice pipeline.
 *
 * Spoken names arrive through a lossy STT layer, so a candidate like
 * "Usama Bhai" must reliably resolve to a saved customer "Usama". Extracted
 * from the voice controller so it can be unit-tested without Express.
 */

/** Levenshtein edit distance between two strings. */
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Known South Asian phonetic respellings that STT engines routinely produce.
 * Keys and values are lowercase; matching is exact on the lowercased name.
 */
const PHONETIC_ALIASES: Record<string, string> = {
  asama: 'usama',
  usamah: 'usama',
  osama: 'usama',
  ahmad: 'ahmed',
  ahemd: 'ahmed',
  mohammad: 'muhammad',
  mohammed: 'muhammad',
  ismail: 'ismaeel',
  sakina: 'sakina',
  khatija: 'khadija',
  bilal: 'bilal',
};

/** Honorifics that shopkeepers append to names but never save in contacts. */
const HONORIFICS = [
  'bhai',
  'bhai sahab',
  'sahab',
  'saab',
  'sahib',
  'ji',
  'mia',
  'mia',
  'chacha',
  'mian',
];

/** Canonical comparison form: lowercase, honorifics stripped, aliases applied. */
export function normalizeNameForMatching(name: string): string {
  let n = name.trim().toLowerCase();

  for (const h of HONORIFICS) {
    const suffix = ` ${h}`;
    if (n.endsWith(suffix)) {
      n = n.slice(0, -suffix.length).trim();
    }
  }
  if (n in PHONETIC_ALIASES) n = PHONETIC_ALIASES[n];
  return n;
}

export interface PersonCandidate {
  id: string;
  name: string;
}

export interface MatchResult {
  id: string;
  name: string;
  distance: number;
}

/**
 * Finds the best customer for a spoken name: exact match first, then the
 * closest Levenshtein match within `maxDistance` on the normalized forms.
 */
export function matchPerson(
  spokenName: string,
  people: PersonCandidate[],
  maxDistance = 2
): MatchResult | null {
  if (!spokenName.trim() || people.length === 0) return null;

  const needle = normalizeNameForMatching(spokenName);

  let best: MatchResult | null = null;
  for (const p of people) {
    const candidate = normalizeNameForMatching(p.name);
    const distance =
      candidate === needle ? 0 : levenshteinDistance(needle, candidate);
    if (distance === 0) return { id: p.id, name: p.name, distance: 0 };
    if (distance <= maxDistance && (!best || distance < best.distance)) {
      best = { id: p.id, name: p.name, distance };
    }
  }
  return best;
}
