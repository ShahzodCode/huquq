/* Teacher mode without a server and without personal data.
   A student turns their progress into a short result code (class code + register number, no name);
   the teacher pastes the codes from the class chat into the teacher panel. */
import type { Progress } from "./types";

export interface Result {
  /** class code, e.g. 10A-K7Q */
  c: string;
  /** number in the class register (1–60) — not a name */
  j: number;
  /** date, YYYY-MM-DD */
  d: string;
  /** articles read */
  r: number;
  /** best test score per level (out of 12), -1 = not taken */
  q: [number, number, number];
  /** situations: total score (out of 32) and number solved */
  s: number;
  sd: number;
  /** games: sort (out of 14), find (out of 10), blitz (raw) */
  so: number;
  f: number;
  b: number;
}

const PREFIX = "KH1";
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
const sum = (s: string) => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 46656;
  return h.toString(36).padStart(3, "0");
};

export const cleanClass = (s: string) => s.toUpperCase().replace(/[^A-Z0-9А-ЯЎҚҒҲ-]/g, "").slice(0, 14);

export function makeResult(P: Progress, classCode: string, journal: number, today = new Date()): Result {
  const q = [1, 2, 3].map((l) => (P.quiz[l] ?? -1)) as [number, number, number];
  return {
    c: cleanClass(classCode),
    j: journal,
    d: today.toISOString().slice(0, 10),
    r: P.read.length,
    q,
    s: Object.values(P.sitScore || {}).reduce((a, b) => a + b, 0),
    sd: P.sitDone.length,
    so: P.sortBest,
    f: P.findBest,
    b: P.blitzBest,
  };
}

export function encode(r: Result): string {
  const body = b64(JSON.stringify(r));
  return `${PREFIX}.${body}.${sum(body)}`;
}

export function decode(code: string): Result | null {
  const m = code.trim().match(/^KH1\.([A-Za-z0-9_-]+)\.([0-9a-z]{3})$/);
  if (!m || sum(m[1]) !== m[2]) return null;
  try {
    const r = JSON.parse(unb64(m[1])) as Result;
    if (typeof r.c !== "string" || !Number.isInteger(r.j) || !Array.isArray(r.q)) return null;
    return r;
  } catch {
    return null;
  }
}

/** All codes found in pasted text (e.g. a copied chat), plus how many looked like codes but were broken. */
export function parseMany(text: string): { ok: Result[]; bad: number } {
  const found = text.match(/KH1\.[A-Za-z0-9_-]+\.[0-9a-z]{3}/g) || [];
  const ok: Result[] = [];
  let bad = 0;
  for (const f of found) {
    const r = decode(f);
    if (r) ok.push(r);
    else bad++;
  }
  return { ok, bad };
}

/* ---------- scoring ---------- */
export const SKILLS = [
  { id: "test", name: "Test", of: (r: Result) => r.q.reduce((a, v) => a + Math.max(0, v), 0) / 36 },
  { id: "sit", name: "Hayotiy vaziyatlar", of: (r: Result) => r.s / 32 },
  { id: "find", name: "Moddani toping!", of: (r: Result) => r.f / 10 },
  { id: "sort", name: "Huquq yoki burch", of: (r: Result) => r.so / 14 },
  { id: "read", name: "Moddalarni oʻqish", of: (r: Result) => Math.min(1, r.r / 30) },
] as const;
const WEIGHT: Record<string, number> = { test: 0.35, sit: 0.3, find: 0.12, sort: 0.11, read: 0.12 };

export const overall = (r: Result) => SKILLS.reduce((a, s) => a + WEIGHT[s.id] * Math.min(1, s.of(r)), 0);

export function randomClassCode(name: string): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let t = "";
  for (let i = 0; i < 3; i++) t += abc[Math.floor(Math.random() * abc.length)];
  return `${cleanClass(name) || "SINF"}-${t}`;
}
