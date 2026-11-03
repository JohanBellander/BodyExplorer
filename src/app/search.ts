export interface Searchable {
  displayName: string;
}

/**
 * Rank items by how well their display name matches `query`.
 * Every query word must appear; names starting with the query, or with a word starting with it,
 * rank first. Side words ("left", "right") in the query are honoured but don't drive ranking.
 */
export function searchParts<T extends Searchable>(items: readonly T[], query: string, limit = 12): T[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  const words = q.split(/\s+/);

  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const name = item.displayName.toLowerCase();
    if (!words.every((w) => name.includes(w))) continue;
    const bare = name.replace(/^(left|right)\s+/, '');
    let score = 0;
    if (bare.startsWith(q) || name.startsWith(q)) score += 100;
    else if (name.split(/[\s()]+/).some((w) => w.startsWith(words[0] ?? ''))) score += 50;
    score -= name.length / 100; // prefer shorter, more specific names
    scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score || a.item.displayName.localeCompare(b.item.displayName));
  return scored.slice(0, limit).map((s) => s.item);
}
