import { Fragment, useState, type ReactNode } from "react";
import { CHECKED, CONTENT, LEX, norm } from "../data";
import { useArticle } from "../context";

export function ArtChips({ arts }: { arts: number[] }) {
  const { openArt } = useArticle();
  return (
    <div className="chips">
      {arts.map((n) => (
        <button key={n} className="art" onClick={() => openArt(n)} aria-label={`${n}-moddani ochish`}>
          {n}-modda
        </button>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      Sayt umumiy maʼrifiy maqsadga xizmat qiladi va rasmiy huquqiy maslahat oʻrnini bosmaydi. Modda matnlari{" "}
      <a href={LEX}>lex.uz</a> rasmiy manbasidan oʻzgarishsiz olingan; oxirgi tekshiruv: {CHECKED}. Saytdan foydalanish
      uchun hech qanday shaxsiy maʼlumot talab qilinmaydi.
    </footer>
  );
}

/* ---------- glossary terms: plain text parts + <Term> buttons, no raw HTML ---------- */
const GL: Record<string, { t: string; d: string }> = {};
CONTENT.glossary.forEach((g) => (GL[norm(g.t)] = g));
const TERM_RE = new RegExp(
  "\\b(" + ["daxlsiz", "prezumpsiya", "referendum", "senzura", "inklyuziv", "ombudsman", "advokat", "mansabdor shaxs", "vijdon erkinligi", "muqobil"].join("|") + ")[a-zʻʼ]*",
  "gi",
);
const termKey: Record<string, string> = {
  daxlsiz: "daxlsizlik",
  prezumpsiya: "aybsizlik prezumpsiyasi",
  referendum: "referendum",
  senzura: "senzura",
  inklyuziv: "inklyuziv taʼlim",
  ombudsman: "ombudsman",
  advokat: "advokat",
  "mansabdor shaxs": "mansabdor shaxs",
  "vijdon erkinligi": "vijdon erkinligi",
  muqobil: "muqobil xizmat",
};

export function splitTerms(s: string): { text: string; term?: { t: string; d: string } }[] {
  const out: { text: string; term?: { t: string; d: string } }[] = [];
  let last = 0;
  for (const m of s.matchAll(TERM_RE)) {
    const g = GL[norm(termKey[m[1].toLowerCase()] || m[1])];
    if (!g) continue;
    if (m.index! > last) out.push({ text: s.slice(last, m.index) });
    out.push({ text: m[0], term: g });
    last = m.index! + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

export function Terms({ text }: { text: string }) {
  const [pop, setPop] = useState<{ t: string; d: string; left: number; top: number } | null>(null);
  const parts = splitTerms(text);
  return (
    <>
      {parts.map((p, i) =>
        p.term ? (
          <button
            key={i}
            className="term"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setPop({ ...p.term!, left: Math.min(innerWidth - 296, Math.max(8, r.left)), top: r.bottom + 8 });
            }}
          >
            {p.text}
          </button>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
      {pop && <TermPopover pop={pop} onClose={() => setPop(null)} />}
    </>
  );
}

function TermPopover({ pop, onClose }: { pop: { t: string; d: string; left: number; top: number }; onClose: () => void }) {
  // closes on any outside click (the opening click is already past, so register on next tick)
  useCloseOnOutside(onClose);
  return (
    <div className="pop" role="tooltip" style={{ display: "block", left: pop.left, top: pop.top }} onClick={(e) => e.stopPropagation()}>
      <b>{pop.t}</b>
      {pop.d}
    </div>
  );
}

import { useEffect } from "react";
function useCloseOnOutside(cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".pop")) cb();
    };
    const id = window.setTimeout(() => document.addEventListener("click", h), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("click", h);
    };
  }, [cb]);
}

export function Segmented({ children, label, id }: { children: ReactNode; label: string; id?: string }) {
  return (
    <div className="seg" role="group" aria-label={label} id={id}>
      {children}
    </div>
  );
}
