/* On-device legal matcher: ranks the 155 articles for a free-text question or situation.
   Signals: (1) concept lexicon of everyday words → article paragraph, (2) BM25 over the official
   text plus the teacher-reviewed explanations, with Uzbek suffix stemming and Cyrillic input.
   It never writes legal text — it only points to official articles. */
import { ART, CONTENT } from "./data";
import { CONCEPTS, type Concept } from "./data/concepts";
import { matchesWord, normText, stem, tokens } from "./nlp";

/* ---------- index ---------- */
interface Doc { n: number; tf: Map<string, number>; len: number; paras: string[][] }
const cards = [...CONTENT.rights, ...CONTENT.duties, ...CONTENT.guarantees, ...CONTENT.student.cards];
const DOCS: Doc[] = Object.values(ART).map((a) => {
  const paras = a.text.map((p) => tokens(p).map(stem));
  const extra = cards
    .filter((c) => c.arts.includes(a.n))
    .flatMap((c) => tokens(`${c.title} ${c.simple} ${"example" in c ? c.example : ""}`).map(stem));
  const all = [...paras.flat(), ...extra, ...extra]; // reviewed plain-language text counts double
  const tf = new Map<string, number>();
  all.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
  return { n: a.n, tf, len: all.length, paras };
});
const AVG = DOCS.reduce((s, d) => s + d.len, 0) / DOCS.length;
const DF = new Map<string, number>();
DOCS.forEach((d) => d.tf.forEach((_, t) => DF.set(t, (DF.get(t) || 0) + 1)));
const VOCAB = [...DF.keys()];
const idf = (t: string) => {
  const df = DF.get(t) || 0;
  return Math.log(1 + (DOCS.length - df + 0.5) / (df + 0.5));
};

/** query stem → vocabulary stems it should match (exact, or prefix for longer stems) */
const expandCache = new Map<string, string[]>();
function expand(q: string): string[] {
  let r = expandCache.get(q);
  if (!r) {
    r = VOCAB.filter((v) => v === q || (q.length >= 5 && v.startsWith(q)) || (v.length >= 5 && q.startsWith(v) && q.length - v.length <= 2));
    expandCache.set(q, r);
  }
  return r;
}

function bm25(qStems: string[]): Map<number, number> {
  const k1 = 1.2, b = 0.75;
  const out = new Map<number, number>();
  for (const q of new Set(qStems)) {
    for (const v of expand(q)) {
      const w = idf(v);
      for (const d of DOCS) {
        const f = d.tf.get(v);
        if (!f) continue;
        const s = (w * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / AVG));
        out.set(d.n, (out.get(d.n) || 0) + s);
      }
    }
  }
  return out;
}

/* ---------- concepts ---------- */
export interface ConceptHit { concept: Concept; words: string[] }
export function detectConcepts(text: string): ConceptHit[] {
  const toks = tokens(text);
  const hits: ConceptHit[] = [];
  for (const c of CONCEPTS) {
    const words: string[] = [];
    for (const w of c.words) {
      const parts = w.split(" ");
      const found = parts.map((p) => toks.find((t) => matchesWord(t, p)));
      if (found.every(Boolean)) words.push(found.join(" "));
    }
    if (words.length) hits.push({ concept: c, words: [...new Set(words)] });
  }
  return hits;
}

/* ---------- public API ---------- */
export interface Match {
  n: number;
  score: number;
  /** paragraph index to quote */
  para: number;
  /** why it matched: concept labels */
  reasons: string[];
  /** query words found in the article */
  words: string[];
}
export interface Analysis {
  matches: Match[];
  concepts: ConceptHit[];
  urgent: boolean;
  confidence: "yuqori" | "oʻrtacha" | "past";
  /** stems used for highlighting */
  stems: string[];
}

const CONCEPT_W = 8; // one concept hit ≈ a strong keyword match

export function analyze(text: string, limit = 4): Analysis {
  const qTok = tokens(text);
  const stems = qTok.map(stem).filter((s) => s.length >= 2);
  const concepts = detectConcepts(text);
  const lex = bm25(stems);

  const score = new Map<number, number>();
  const reasons = new Map<number, string[]>();
  const paraHint = new Map<number, number>();
  lex.forEach((s, n) => score.set(n, s));
  for (const h of concepts) {
    h.concept.arts.forEach(([n, p], i) => {
      const w = CONCEPT_W * (i === 0 ? 1 : 0.55) * (1 + 0.25 * (h.words.length - 1)) * (h.concept.urgent ? 2 : 1);
      score.set(n, (score.get(n) || 0) + w);
      reasons.set(n, [...(reasons.get(n) || []), h.concept.label]);
      if (!paraHint.has(n) || i === 0) paraHint.set(n, p);
    });
  }

  // danger comes first: the article protecting life and body leads, whatever else matched
  const danger = new Set(concepts.filter((h) => h.concept.urgent).map((h) => h.concept.arts[0][0]));
  const ranked = [...score.entries()].sort((a, b) => +danger.has(b[0]) - +danger.has(a[0]) || b[1] - a[1]);
  const top = ranked[0]?.[1] || 0;
  // keep strong lexical matches, and always the main article of every concept the user described
  const primary = new Set(concepts.map((h) => h.concept.arts[0][0]));
  const matches: Match[] = ranked
    .filter(([n, s], i) =>
      primary.has(n) ||
      // when the user described something we recognised, plain word overlap must be strong to add noise
      (reasons.has(n) ? s >= top * 0.4 : s >= top * (concepts.length ? 0.6 : 0.4) && (i < 2 || s >= 2.5)))
    .slice(0, limit)
    .map(([n, s]) => {
      const d = DOCS[n - 1];
      // best paragraph: concept hint, else the one with most query stems
      let para = paraHint.get(n) ?? 0;
      let found: string[] = [];
      d.paras.forEach((p, i) => {
        const hit = stems.filter((q) => p.some((t) => t === q || (q.length >= 5 && t.startsWith(q))));
        if (hit.length > found.length) {
          found = hit;
          if (!paraHint.has(n)) para = i;
        }
      });
      return { n, score: s, para, reasons: [...new Set(reasons.get(n) || [])], words: found };
    });

  const strongConcept = concepts.length > 0 && matches[0] && matches[0].reasons.length > 0;
  const confidence = !matches.length ? "past" : strongConcept && top >= CONCEPT_W ? "yuqori" : top >= 4 ? "oʻrtacha" : "past";
  return { matches, concepts, urgent: concepts.some((h) => h.concept.urgent), confidence, stems };
}

/** Keyword search for the search page: ranked, stem-aware, Cyrillic-tolerant. */
export function rank(text: string): { n: number; para: number }[] {
  const stems = tokens(text).map(stem);
  if (!stems.length) {
    // fall back to raw substring (e.g. very short or stop-word queries)
    const q = normText(text).trim();
    return q.length < 2 ? [] : Object.values(ART).flatMap((a) => {
      const i = a.text.findIndex((p) => normText(p).includes(q));
      return i < 0 ? [] : [{ n: a.n, para: i }];
    });
  }
  const s = bm25(stems);
  // keyword search: only articles whose official text contains a query word
  return [...s.entries()]
    .map(([n, sc]) => {
      const d = DOCS[n - 1];
      let best = -1, bestHits = 0;
      d.paras.forEach((p, i) => {
        const h = stems.filter((q) => expand(q).some((v) => p.includes(v))).length;
        if (h > bestHits) { bestHits = h; best = i; }
      });
      return { n, para: best, sc: sc + bestHits * 3 };
    })
    .filter((x) => x.para >= 0)
    .sort((a, b) => b.sc - a.sc)
    .map(({ n, para }) => ({ n, para }));
}

/** Words to highlight: the stems (and Cyrillic input normalised to Latin). */
export const highlightStems = (text: string) => tokens(text).map(stem).filter((s) => s.length >= 3);
