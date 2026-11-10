import { ART, norm } from "./data";

export type SearchResult =
  | { kind: "empty" }
  | { kind: "short" }
  | { kind: "missing"; n: number }
  | { kind: "hits"; q: string; hits: [number, string][] };

/** Article-number lookup ("50", "50-modda") or keyword search over official text. */
export function search(raw: string): SearchResult {
  raw = raw.trim();
  if (!raw) return { kind: "empty" };
  const num = raw.match(/^(\d{1,3})(-?modda)?$/i);
  if (num) {
    const n = +num[1];
    return ART[n] ? { kind: "hits", q: "", hits: [[n, ART[n].text[0]]] } : { kind: "missing", n };
  }
  const q = norm(raw);
  if (q.length < 2) return { kind: "short" };
  const hits: [number, string][] = [];
  Object.values(ART).forEach((a) => {
    const p = a.text.find((t) => norm(t).includes(q));
    if (p) hits.push([a.n, p]);
  });
  return { kind: "hits", q, hits };
}

/** Excerpt around the first match, split into plain/marked parts (no HTML strings). */
export function excerpt(p: string, q: string): { text: string; mark: boolean }[] {
  let t = p;
  if (p.length > 240) {
    if (!q) t = p.slice(0, 240) + "…";
    else {
      const at = Math.max(0, norm(p).indexOf(q) - 80);
      t = (at ? "…" : "") + p.slice(at, at + 240) + "…";
    }
  }
  if (!q) return [{ text: t, mark: false }];
  const nt = norm(t);
  const out: { text: string; mark: boolean }[] = [];
  let last = 0;
  let idx: number;
  while ((idx = nt.indexOf(q, last)) > -1) {
    if (idx > last) out.push({ text: t.slice(last, idx), mark: false });
    out.push({ text: t.slice(idx, idx + q.length), mark: true });
    last = idx + q.length;
  }
  if (last < t.length) out.push({ text: t.slice(last), mark: false });
  return out;
}
