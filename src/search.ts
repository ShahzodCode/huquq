import { ART } from "./data";
import { highlightStems, rank } from "./engine";
import { normText, stem } from "./nlp";

export type SearchResult =
  | { kind: "empty" }
  | { kind: "short" }
  | { kind: "missing"; n: number }
  | { kind: "hits"; terms: string[]; hits: [number, number][] };

/** Article-number lookup ("50", "50-modda", "50-модда") or ranked keyword search. hits = [article, paragraph index]. */
export function search(raw: string): SearchResult {
  raw = raw.trim();
  if (!raw) return { kind: "empty" };
  const num = raw.match(/^(\d{1,3})(-?(modda|модда))?$/i);
  if (num) {
    const n = +num[1];
    return ART[n] ? { kind: "hits", terms: [], hits: [[n, 0]] } : { kind: "missing", n };
  }
  if (normText(raw).replace(/[^a-z0-9]/g, "").length < 2) return { kind: "short" };
  const terms = highlightStems(raw);
  return { kind: "hits", terms: terms.length ? terms : [normText(raw)], hits: rank(raw).map((r) => [r.n, r.para]) };
}

const isHit = (word: string, terms: string[]) => {
  const w = normText(word);
  if (w.length < 2) return false;
  const s = stem(w);
  return terms.some((t) => s === t || w.startsWith(t) || (s.length >= 5 && t.startsWith(s)));
};

/** Excerpt around the first matching word, split into plain/marked parts (no HTML strings).
    Works for Latin and Cyrillic paragraphs alike. */
export function excerpt(p: string, terms: string[], max = 240): { text: string; mark: boolean }[] {
  const parts = p.split(/([\p{L}\p{M}ʻʼ'‘’`-]+)/u);
  let pos = 0, first = -1;
  const marks = parts.map((x, i) => {
    const m = i % 2 === 1 && terms.length > 0 && isHit(x, terms);
    if (m && first < 0) first = pos;
    pos += x.length;
    return m;
  });
  // window
  let from = 0, to = p.length;
  if (p.length > max) {
    from = first > 80 ? p.lastIndexOf(" ", first - 60) + 1 : 0;
    to = Math.min(p.length, from + max);
    const sp = p.lastIndexOf(" ", to);
    if (to < p.length && sp > from) to = sp;
  }
  const out: { text: string; mark: boolean }[] = [];
  if (from > 0) out.push({ text: "…", mark: false });
  pos = 0;
  parts.forEach((x, i) => {
    const a = Math.max(pos, from), b = Math.min(pos + x.length, to);
    if (b > a) out.push({ text: x.slice(a - pos, b - pos), mark: marks[i] && a === pos && b === pos + x.length });
    pos += x.length;
  });
  if (to < p.length) out.push({ text: "…", mark: false });
  // merge adjacent plain parts
  return out.reduce<{ text: string; mark: boolean }[]>((acc, x) => {
    const l = acc[acc.length - 1];
    if (l && !l.mark && !x.mark) l.text += x.text;
    else acc.push({ ...x });
    return acc;
  }, []);
}
