// Fuzzy matching of a free-text court-name query against court names.
// Handles common abbreviations (ps -> public school, jr -> junior, etc.) and
// weights distinctive tokens above generic ones (school, public, park, ...).

const ABBREV: Record<string, string> = {
  ps: "public school",
  pss: "public school",
  jr: "junior",
  sr: "senior",
  ms: "middle school",
  mdl: "middle",
  ci: "collegiate institute",
  es: "elementary school",
  hs: "high school",
  st: "saint",
  ste: "saint",
  sch: "school",
  pkwy: "parkway",
  rec: "recreation",
  cc: "community centre",
};

const COMMON = new Set(
  "school public catholic elementary secondary junior senior middle saint park the of and ecole elementaire community separate district centre center recreation campus academy".split(
    " ",
  ),
);

function expandTokens(s: string): string[] {
  const cleaned = s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const out: string[] = [];
  for (const tok of cleaned.split(" ")) {
    if (!tok) continue;
    if (ABBREV[tok]) out.push(...ABBREV[tok].split(" "));
    else out.push(tok);
  }
  return out;
}

function weight(tok: string): number {
  return COMMON.has(tok) ? 0.2 : 1.0;
}

export interface CourtNameLike {
  id: number;
  name: string;
}

export interface ScoredCourt<T extends CourtNameLike> {
  court: T;
  score: number;
  distinctiveMatched: number;
}

export type MatchOutcome<T extends CourtNameLike> =
  | { kind: "match"; court: T }
  | { kind: "ambiguous"; candidates: T[] }
  | { kind: "none" };

function scoreOne(queryToks: string[], nameToks: string[]): number {
  const nameSet = new Set(nameToks);
  let matched = 0;
  let total = 0;
  for (const q of queryToks) {
    const w = weight(q);
    total += w;
    if (nameSet.has(q)) matched += w;
  }
  return total === 0 ? 0 : matched / total;
}

/**
 * Match a court-name query against a list of courts.
 * Returns a single confident match, a set of ambiguous candidates, or none.
 */
export function matchCourt<T extends CourtNameLike>(
  query: string,
  courts: T[],
): MatchOutcome<T> {
  const queryToks = expandTokens(query);
  if (queryToks.length === 0) return { kind: "none" };

  const distinctive = queryToks.filter((t) => !COMMON.has(t));

  const scored: ScoredCourt<T>[] = courts.map((court) => {
    const nameToks = expandTokens(court.name);
    const nameSet = new Set(nameToks);
    return {
      court,
      score: scoreOne(queryToks, nameToks),
      distinctiveMatched: distinctive.filter((t) => nameSet.has(t)).length,
    };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.distinctiveMatched - a.distinctiveMatched ||
      a.court.name.length - b.court.name.length,
  );

  const best = scored[0];
  // Require a reasonable score and at least one distinctive token match,
  // otherwise the query is too vague / unknown.
  if (!best || best.score < 0.5 || best.distinctiveMatched === 0) {
    return { kind: "none" };
  }

  // Candidates that are essentially tied with the best match.
  const ties = scored.filter(
    (s) =>
      s.score >= best.score - 0.08 &&
      s.distinctiveMatched >= best.distinctiveMatched &&
      s.score >= 0.6,
  );

  if (ties.length > 1) {
    return { kind: "ambiguous", candidates: ties.slice(0, 5).map((s) => s.court) };
  }

  return { kind: "match", court: best.court };
}
