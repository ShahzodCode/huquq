import { useEffect, useMemo, useRef, useState } from "react";
import { ART, CONTENT } from "../data";
import { ArtChips, Footer, Terms } from "../components/common";
import { shuffle } from "../hooks/shuffle";
import { useProgress } from "../context";

let sitOpenMemo: number | null = null;

export default function Vaziyatlar() {
  const [open, setOpenState] = useState<number | null>(sitOpenMemo);
  const setOpen = (i: number | null) => {
    sitOpenMemo = i;
    setOpenState(i);
  };
  return (
    <>
      <div className="head">
        <h1>Hayotiy vaziyatlar</h1>
        <p className="lead">
          Har bir voqeani oʻqing, qaysi huquq buzilganini va qaysi moddaga tayanish mumkinligini aniqlang. Oxirida — amaliy maslahatlar.
        </p>
      </div>
      <div id="sitwrap">
        {open == null ? <List onOpen={setOpen} /> : <Run key={open} idx={open} onOpen={setOpen} />}
      </div>
      <Footer />
    </>
  );
}

function List({ onOpen }: { onOpen: (i: number) => void }) {
  const { P } = useProgress();
  return (
    <>
      <p className="muted">Yechilgan: {P.sitDone.length} / {CONTENT.situations.length}</p>
      <div className="grid g2 sitlist">
        {CONTENT.situations.map((s, i) => (
          <button className="card" key={i} onClick={() => onOpen(i)}>
            <h3>{i + 1}. {s.title}</h3>
            <p className="muted" style={{ fontSize: ".92rem" }}>{s.story.slice(0, 120)}…</p>
            {P.sitDone.includes(i) && <span className="done">✓ Yechilgan</span>}
          </button>
        ))}
      </div>
    </>
  );
}

function Run({ idx, onOpen }: { idx: number; onOpen: (i: number | null) => void }) {
  const s = CONTENT.situations[idx];
  const { update } = useProgress();
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [right, setRight] = useState<number | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  const q1Order = useMemo(() => shuffle(s.q1.o.map((_, k) => k)), [s]);
  const q2Order = useMemo(() => shuffle(s.q2.o.map((_, k) => k)), [s]);

  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, [step]);
  useEffect(() => {
    if (step === 2) update((p) => (p.sitDone.includes(idx) ? p : { ...p, sitDone: [...p.sitDone, idx] }));
  }, [step, idx, update]);
  useEffect(() => {
    if (right != null) nextBtn.current?.focus();
  }, [right]);

  const advance = () => {
    setStep(step + 1);
    setWrong(new Set());
    setRight(null);
  };
  const choose = (k: number, answer: number) => {
    if (right != null) return;
    if (k !== answer) setWrong(new Set(wrong).add(k));
    else setRight(k);
  };

  const options = (key: "q1" | "q2") => {
    const Q = s[key];
    const order = key === "q1" ? q1Order : q2Order;
    return (
      <>
        <p className="qtext" style={{ marginTop: 18 }}>{key === "q1" ? "1-qadam. Qaysi huquq buzildi?" : "2-qadam. Qaysi moddaga tayanish mumkin?"}</p>
        <div className="opts">
          {order.map((k, j) => (
            <button
              key={k}
              className={"opt" + (right === k ? " ok" : "") + (wrong.has(k) ? " no" : "")}
              disabled={right != null || wrong.has(k)}
              onClick={() => choose(k, Q.a)}
            >
              <span className="k">{"ABC"[j]}</span>
              {key === "q1" ? (
                (Q.o as string[])[k]
              ) : (
                <>
                  <b>{(Q.o as number[])[k]}-modda</b>&nbsp;— {ART[(Q.o as number[])[k]].text[0].slice(0, 90)}…
                </>
              )}
            </button>
          ))}
        </div>
        <div aria-live="polite">
          {wrong.size > 0 && right == null && (
            <div className="fb no"><strong>Yana oʻylab koʻring.</strong>Voqeada aynan nima buzilganiga eʼtibor bering.</div>
          )}
          {right != null && (
            <div className="fb ok">
              <strong>Toʻgʻri!</strong>
              {key === "q2" && <ArtChips arts={[(Q.o as number[])[Q.a]]} />}
              <div className="row"><button className="btn" ref={nextBtn} onClick={advance}>Davom etish</button></div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="game" ref={top}>
      <div className="row" style={{ margin: "0 0 14px", justifyContent: "space-between" }}>
        <button className="btn soft" onClick={() => onOpen(null)}>‹ Barcha vaziyatlar</button>
        <span className="muted">{idx + 1} / {CONTENT.situations.length}</span>
      </div>
      <div className="steps">{[0, 1, 2].map((k) => <span key={k} className={k <= step ? "on" : ""} />)}</div>
      <h2>{s.title}</h2>
      <p className="story" style={{ marginTop: 12 }}>{s.story}</p>
      {step === 0 && options("q1")}
      {step === 1 && options("q2")}
      {step === 2 && (
        <>
          <h3 style={{ marginTop: 20 }}>3-qadam. Nima qilish kerak?</h3>
          <ol className="todo">{s.steps.map((x, i) => <li key={i}><Terms text={x} /></li>)}</ol>
          <p className="muted" style={{ fontSize: ".86rem" }}>
            Bu umumiy maʼrifiy maslahat. Jiddiy holatda kattalar, maktab maʼmuriyati yoki huquqshunosga murojaat qiling.
          </p>
          <div className="row">
            {idx + 1 < CONTENT.situations.length && <button className="btn" onClick={() => onOpen(idx + 1)}>Keyingi vaziyat</button>}
            <button className="btn ghost" onClick={() => onOpen(null)}>Roʻyxatga qaytish</button>
          </div>
        </>
      )}
    </div>
  );
}
