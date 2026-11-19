import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CONTENT } from "../data";
import { ArtChips, Footer, Terms } from "../components/common";
import { Assistant } from "../components/Assistant";
import { useOfficial } from "../components/Script";
import { shuffle } from "../hooks/shuffle";
import { useProgress } from "../context";

let sitOpenMemo: number | null = null;
const MAX = 4; // 2 steps × 2 points

export default function Vaziyatlar() {
  const [params, setParams] = useSearchParams();
  const fromLink = Number(params.get("v")) - 1;
  const [open, setOpenState] = useState<number | null>(CONTENT.situations[fromLink] ? fromLink : sitOpenMemo);
  const setOpen = (i: number | null) => {
    sitOpenMemo = i;
    setOpenState(i);
    if (params.has("v") || params.has("q")) setParams({}, { replace: true });
  };
  const listTop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (CONTENT.situations[fromLink]) listTop.current?.scrollIntoView({ block: "start" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="head">
        <h1>Hayotiy vaziyatlar</h1>
        <p className="lead">
          Oʻz vaziyatingizni yozing — yordamchi tegishli moddalarni topadi. Yoki tayyor voqealarni yechib, qaysi huquq buzilganini
          va qaysi moddaga tayanish mumkinligini aniqlang.
        </p>
      </div>
      <Assistant initial={params.get("q") || ""} />
      <div className="section" ref={listTop} id="sitwrap">
        {open == null ? <List onOpen={setOpen} /> : <Run key={open} idx={open} onOpen={setOpen} />}
      </div>
      <Footer />
    </>
  );
}

function List({ onOpen }: { onOpen: (i: number) => void }) {
  const { P } = useProgress();
  const total = Object.values(P.sitScore).reduce((a, b) => a + b, 0);
  return (
    <>
      <div className="sit-headrow">
        <div>
          <h2>8 ta voqea</h2>
          <p className="muted">Har bir qadamda birinchi urinishda topsangiz — 2 ball, ikkinchisida — 1 ball.</p>
        </div>
        <div className="sit-total" aria-label="Umumiy ball">
          <b>{total}</b>/{CONTENT.situations.length * MAX}
          <span>ball</span>
        </div>
      </div>
      <div className="grid g2 sitlist">
        {CONTENT.situations.map((s, i) => {
          const sc = P.sitScore[i];
          return (
            <button className="card" key={i} onClick={() => onOpen(i)}>
              <h3>{i + 1}. {s.title}</h3>
              <p className="muted" style={{ fontSize: ".92rem" }}>{s.story.slice(0, 120)}…</p>
              {sc != null ? (
                <span className="done">
                  <span className="pips" aria-hidden="true">{Array.from({ length: MAX }, (_, k) => <i key={k} className={k < sc ? "on" : ""} />)}</span>
                  {sc}/{MAX} ball
                </span>
              ) : P.sitDone.includes(i) ? <span className="done">✓ Yechilgan</span> : null}
            </button>
          );
        })}
      </div>
    </>
  );
}

function Run({ idx, onOpen }: { idx: number; onOpen: (i: number | null) => void }) {
  const s = CONTENT.situations[idx];
  const { update } = useProgress();
  const official = useOfficial();
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [right, setRight] = useState<number | null>(null);
  const [pts, setPts] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  const q1Order = useMemo(() => shuffle(s.q1.o.map((_, k) => k)), [s]);
  const q2Order = useMemo(() => shuffle(s.q2.o.map((_, k) => k)), [s]);

  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, [step]);
  useEffect(() => {
    if (step === 2)
      update((p) => ({
        ...p,
        sitDone: p.sitDone.includes(idx) ? p.sitDone : [...p.sitDone, idx],
        sitScore: { ...p.sitScore, [idx]: Math.max(p.sitScore[idx] ?? 0, pts) },
      }));
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (right != null) nextBtn.current?.focus();
  }, [right]);

  const advance = () => {
    setStep(step + 1);
    setWrong([]);
    setRight(null);
  };
  const choose = (k: number, answer: number) => {
    if (right != null) return;
    if (k !== answer) setWrong([...wrong, k]);
    else {
      setRight(k);
      setPts(pts + Math.max(0, 2 - wrong.length));
    }
  };

  const options = (key: "q1" | "q2") => {
    const Q = s[key];
    const order = key === "q1" ? q1Order : q2Order;
    const last = right ?? wrong[wrong.length - 1];
    return (
      <>
        <p className="qtext" style={{ marginTop: 18 }}>{key === "q1" ? "1-qadam. Qaysi huquq buzildi?" : "2-qadam. Qaysi moddaga tayanish mumkin?"}</p>
        <div className="opts">
          {order.map((k, j) => (
            <button
              key={k}
              className={"opt" + (right === k ? " ok" : "") + (wrong.includes(k) ? " no" : "")}
              disabled={right != null || wrong.includes(k)}
              onClick={() => choose(k, Q.a)}
            >
              <span className="k">{"ABCD"[j]}</span>
              {key === "q1" ? (
                (Q.o as string[])[k]
              ) : (
                <span>
                  <b>{(Q.o as number[])[k]}-modda</b>&nbsp;— <span data-official>{official((Q.o as number[])[k]).text[0].slice(0, 90)}…</span>
                </span>
              )}
            </button>
          ))}
        </div>
        <div aria-live="polite">
          {last != null && right == null && (
            <div className="fb no">
              <strong>{wrong.length === 1 ? "Yana oʻylab koʻring" : "Yaqin, lekin bu ham emas"}</strong>
              {Q.why[last]}
            </div>
          )}
          {right != null && (
            <div className="fb ok">
              <strong>{wrong.length === 0 ? "Birinchi urinishda! +2 ball" : wrong.length === 1 ? "Toʻgʻri! +1 ball" : "Toʻgʻri"}</strong>
              {Q.why[right]}
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
        <span className="muted">{idx + 1} / {CONTENT.situations.length} · {pts} ball</span>
      </div>
      <div className="steps">{[0, 1, 2].map((k) => <span key={k} className={k <= step ? "on" : ""} />)}</div>
      <h2>{s.title}</h2>
      <p className="story" style={{ marginTop: 12 }}>{s.story}</p>
      {step === 0 && options("q1")}
      {step === 1 && options("q2")}
      {step === 2 && (
        <>
          <div className="sit-score">
            <b>{pts}/{MAX}</b>
            <span>{pts === MAX ? "Mukammal tahlil!" : pts >= 2 ? "Yaxshi natija" : "Keyingi safar diqqat bilan oʻqing — har bir variant izohini koʻring"}</span>
          </div>
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
