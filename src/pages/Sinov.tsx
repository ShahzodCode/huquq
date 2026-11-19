import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ART, CONTENT, SECT_SHORT } from "../data";
import { ArtChips, Footer, Segmented } from "../components/common";
import { shuffle } from "../hooks/shuffle";
import { useArticle, useProgress } from "../context";
import { useOfficial } from "../components/Script";

type Tab = "test" | "find" | "blitz";
let tabMemo: Tab = "test";
const LV = ["", "Boshlangʻich", "Oʻrta", "Yuqori"];
const LV_DESC = ["", "Davlat ramzlari, asosiy huquqlar", "Huquqlar kafolatlari, taʼlim, mehnat", "Davlat tuzilishi, sud, Konstitutsiyaviy tartib"];

export default function Sinov() {
  const [tab, setTabState] = useState<Tab>(tabMemo);
  const setTab = (t: Tab) => {
    tabMemo = t;
    setTabState(t);
  };
  return (
    <>
      <div className="head">
        <h1>Huquqiy bilim sinovi</h1>
        <p className="lead">
          Uch xil sinov: darajali test, rasmiy matndan moddani topish va tezkor “Huquqiy bilimdon”. Har bir javob rasmiy modda bilan izohlanadi.
        </p>
      </div>
      <Segmented label="Sinov turi" id="gtabs">
        <button aria-pressed={tab === "test"} onClick={() => setTab("test")}>Test (36 savol)</button>
        <button aria-pressed={tab === "find"} onClick={() => setTab("find")}>Moddani toping!</button>
        <button aria-pressed={tab === "blitz"} onClick={() => setTab("blitz")}>Huquqiy bilimdon</button>
      </Segmented>
      <div className="game" id="game">
        {tab === "test" && <Test />}
        {tab === "find" && <Find />}
        {tab === "blitz" && <Blitz />}
      </div>
      <Footer />
    </>
  );
}

/* ---------------- leveled test ---------------- */
function Test() {
  const [lvl, setLvl] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const { P } = useProgress();
  if (lvl == null)
    return (
      <>
        <h2>Darajani tanlang</h2>
        <p className="muted">Har bir darajada 12 ta savol. Natija shu qurilmada saqlanadi.</p>
        <div className="grid g3" style={{ marginTop: 14 }}>
          {[1, 2, 3].map((l) => (
            <button key={l} className="opt" style={{ flexDirection: "column", alignItems: "flex-start" }} onClick={() => setLvl(l)}>
              <b style={{ fontFamily: "var(--display)" }}>{l}. {LV[l]}</b>
              <span className="muted">{LV_DESC[l]}</span>
              <span>{P.quiz[l] != null ? "Eng yaxshi natija: " + P.quiz[l] + "/12" : "Hali topshirilmagan"}</span>
            </button>
          ))}
        </div>
      </>
    );
  return <TestRun key={run} lvl={lvl} onAgain={() => setRun(run + 1)} onLevels={() => setLvl(null)} />;
}

function TestRun({ lvl, onAgain, onLevels }: { lvl: number; onAgain: () => void; onLevels: () => void }) {
  const { update } = useProgress();
  const qs = useMemo(() => shuffle(CONTENT.quiz.filter((q) => q.lvl === lvl)), [lvl]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const next = useRef<HTMLButtonElement>(null);
  const q = qs[i];
  const order = useMemo(() => (q ? shuffle(q.o.map((_, k) => k)) : []), [q]);
  const done = i >= qs.length;

  useEffect(() => {
    if (picked != null) next.current?.focus();
  }, [picked]);
  useEffect(() => {
    if (done) update((p) => ({ ...p, quiz: { ...p.quiz, [lvl]: Math.max(p.quiz[lvl] || 0, score) } }));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (done)
    return (
      <div className="result">
        <div className="muted">{LV[lvl]} daraja</div>
        <div className="big">{score}/{qs.length}</div>
        <p>
          {score >= 10
            ? "Aʼlo! Siz Konstitutsiyani yaxshi bilasiz."
            : score >= 7
              ? "Yaxshi! Xato qilgan moddalaringizni qayta oʻqib chiqing."
              : "Boshlanishi yaxshi. “Mening huquqlarim” boʻlimini koʻrib chiqib, yana urinib koʻring."}
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={onAgain}>Qaytadan</button>
          <button className="btn ghost" onClick={onLevels}>Boshqa daraja</button>
        </div>
      </div>
    );

  const pick = (k: number) => {
    if (picked != null) return;
    if (k === q.a) setScore(score + 1);
    setPicked(k);
  };
  const ok = picked === q.a;
  return (
    <>
      <div className="gtop">
        <span>{LV[lvl]} · {i + 1}/{qs.length}</span>
        <div className="bar"><i style={{ width: `${(i / qs.length) * 100}%` }} /></div>
        <span>Ball: {score}</span>
      </div>
      <p className="qtext">{q.q}</p>
      <div className="opts">
        {order.map((k, j) => (
          <button
            key={k}
            className={"opt" + (picked != null && k === q.a ? " ok" : "") + (picked === k && !ok ? " no" : "")}
            disabled={picked != null}
            onClick={() => pick(k)}
          >
            <span className="k">{"ABCD"[j]}</span>
            {q.o[k]}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {picked != null && (
          <div className={"fb " + (ok ? "ok" : "no")}>
            <strong>{ok ? "Toʻgʻri!" : "Notoʻgʻri."}</strong>
            {q.why}
            <ArtChips arts={[q.art]} />
            <div className="row">
              <button className="btn" ref={next} onClick={() => { setI(i + 1); setPicked(null); }}>
                {i + 1 < qs.length ? "Keyingi savol" : "Natijani koʻrish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- find the article ---------------- */
function Find() {
  const [run, setRun] = useState(0);
  return <FindRun key={run} onAgain={() => setRun(run + 1)} />;
}

function FindRun({ onAgain }: { onAgain: () => void }) {
  const official = useOfficial();
  const { update } = useProgress();
  const rounds = useMemo(() => shuffle(CONTENT.findPool).slice(0, 10), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const next = useRef<HTMLButtonElement>(null);
  const n = rounds[i];
  const opts = useMemo(
    () => (n == null ? [] : shuffle([n, ...shuffle(CONTENT.findPool.filter((x) => x !== n)).slice(0, 3)])),
    [n],
  );
  const done = i >= rounds.length;

  useEffect(() => {
    if (picked != null) next.current?.focus();
  }, [picked]);
  useEffect(() => {
    if (done) update((p) => ({ ...p, findBest: Math.max(p.findBest, score) }));
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (done)
    return (
      <div className="result">
        <div className="big">{score}/10</div>
        <p>Modda raqamlarini eslab qolish — huquqingizni tez himoya qilishga yordam beradi.</p>
        <button className="btn" onClick={onAgain}>Yana oʻynash</button>
      </div>
    );

  const txt = official(n).text[0];
  const cut = txt.length > 220 ? txt.slice(0, 220).replace(/\s\S*$/, "") + "…" : txt;
  const rel = CONTENT.rights.find((r) => r.arts.includes(n)) || CONTENT.duties.find((r) => r.arts.includes(n));
  const ok = picked === n;
  return (
    <>
      <div className="gtop">
        <span>Moddani toping! · {i + 1}/10</span>
        <div className="bar"><i style={{ width: `${i * 10}%` }} /></div>
        <span>Ball: {score}</span>
      </div>
      <p className="muted">Bu jumla Konstitutsiyaning qaysi moddasidan olingan?</p>
      <blockquote className="quote" data-official>“{cut}”</blockquote>
      <div className="numopts">
        {opts.map((o) => (
          <button
            key={o}
            className={"opt" + (picked != null && o === n ? " ok" : "") + (picked === o && !ok ? " no" : "")}
            disabled={picked != null}
            onClick={() => { if (o === n) setScore(score + 1); setPicked(o); }}
          >
            {o}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {picked != null && (
          <div className={"fb " + (ok ? "ok" : "no")}>
            <strong>{ok ? "Topdingiz!" : "Bu " + n + "-modda."}</strong>
            {rel ? `${rel.title}: ${rel.simple}` : SECT_SHORT[ART[n].sec] + (ART[n].chap ? " — " + ART[n].chap : "")}
            <ArtChips arts={[n]} />
            <div className="row"><button className="btn" ref={next} onClick={() => { setI(i + 1); setPicked(null); }}>Keyingisi</button></div>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- 60-second blitz ---------------- */
function Blitz() {
  const { P } = useProgress();
  const [phase, setPhase] = useState<"intro" | "run" | "end">("intro");
  const [result, setResult] = useState<{ score: number; log: { s: string; t: boolean; art: number; ok: boolean }[] }>({ score: 0, log: [] });

  if (phase === "intro")
    return (
      <div className="blitz">
        <h2>Huquqiy bilimdon</h2>
        <p className="muted">
          60 soniya ichida iloji boricha koʻp gapga “Toʻgʻri” yoki “Notoʻgʻri” deb javob bering. Toʻgʻri javob +1, xato −1. Klaviaturada: ← notoʻgʻri, → toʻgʻri.
        </p>
        <p>Eng yaxshi natija: <b>{P.blitzBest}</b></p>
        <button className="btn" id="bstart" onClick={() => setPhase("run")}>Boshlash</button>
      </div>
    );
  if (phase === "run")
    return <BlitzRun onEnd={(r) => { setResult(r); setPhase("end"); }} />;
  return <BlitzEnd {...result} onAgain={() => setPhase("run")} />;
}

type Log = { s: string; t: boolean; art: number; ok: boolean }[];

function BlitzRun({ onEnd }: { onEnd: (r: { score: number; log: Log }) => void }) {
  const deck = useMemo(() => shuffle(CONTENT.blitz), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(60);
  const [flash, setFlash] = useState<"" | "flash" | "flash bad">("");
  const log = useRef<Log>([]);
  const state = useRef({ i: 0, score: 0, finished: false });
  const { update } = useProgress();

  const finish = useCallback(() => {
    if (state.current.finished) return;
    state.current.finished = true;
    update((p) => ({ ...p, blitzBest: Math.max(p.blitzBest, state.current.score) }));
    onEnd({ score: state.current.score, log: log.current });
  }, [onEnd, update]);

  const ans = useCallback(
    (v: boolean) => {
      const s = state.current;
      if (s.finished) return;
      const c = deck[s.i % deck.length];
      const ok = v === c.t;
      s.score = Math.max(0, s.score + (ok ? 1 : -1));
      log.current.push({ s: c.s, t: c.t, art: c.art, ok });
      s.i++;
      setScore(s.score);
      setI(s.i);
      setFlash("");
      requestAnimationFrame(() => setFlash(ok ? "flash" : "flash bad"));
      if (s.i >= deck.length * 2) finish();
    },
    [deck, finish],
  );

  useEffect(() => {
    const kb = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") ans(false);
      if (e.key === "ArrowRight") ans(true);
    };
    document.addEventListener("keydown", kb);
    const t = window.setInterval(() => setLeft((l) => l - 1), 1000);
    return () => {
      document.removeEventListener("keydown", kb);
      window.clearInterval(t);
    };
  }, [ans]);
  useEffect(() => {
    if (left <= 0) finish();
  }, [left, finish]);

  return (
    <div className="blitz">
      <div className="gtop">
        <span className="timer" id="btime">{left}</span>
        <span>Ball: <b id="bscore">{score}</b></span>
      </div>
      <div className={"stmt " + flash} id="bstmt" aria-live="polite">{deck[i % deck.length].s}</div>
      <div className="tf">
        <button className="f" onClick={() => ans(false)}>Notoʻgʻri</button>
        <button className="t" onClick={() => ans(true)}>Toʻgʻri</button>
      </div>
    </div>
  );
}

function BlitzEnd({ score, log, onAgain }: { score: number; log: Log; onAgain: () => void }) {
  const { openArt } = useArticle();
  const wrong = log.filter((l) => !l.ok);
  return (
    <div className="result">
      <div className="muted">Vaqt tugadi</div>
      <div className="big">{score}</div>
      <p>{log.length} ta javob. Xatolaringiz:</p>
      {wrong.length === 0 && <p>Xato yoʻq — zoʻr!</p>}
      {wrong.map((l, i) => (
        <p key={i} style={{ textAlign: "left" }}>
          ✗ {l.s} — <b>{l.t ? "Toʻgʻri" : "Notoʻgʻri"}</b>{" "}
          <button className="art" onClick={() => openArt(l.art)}>{l.art}-modda</button>
        </p>
      ))}
      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn" id="bagain" onClick={onAgain}>Yana oʻynash</button>
      </div>
    </div>
  );
}
