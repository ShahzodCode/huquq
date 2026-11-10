import { useEffect, useRef, useState } from "react";
import { CONTENT } from "../data";
import { ArtChips, Footer, Terms } from "../components/common";
import { shuffle } from "../hooks/shuffle";
import { useProgress } from "../context";

export default function Burchlar() {
  return (
    <>
      <div className="head">
        <h1>Fuqarolik burchlarim</h1>
        <p className="lead">Huquqlar burchlar bilan birga yashaydi. Konstitutsiyaning XI bobi fuqarolarning burchlarini belgilaydi.</p>
      </div>
      <div className="grid g2">
        {CONTENT.duties.map((d) => (
          <article className="card rcard" key={d.title}>
            <h3>{d.title}</h3>
            <p><Terms text={d.simple} /></p>
            <div className="example"><b>Misol:</b> {d.example}</div>
            <ArtChips arts={d.arts} />
          </article>
        ))}
      </div>
      <section className="section">
        <h2>Huquqmi yoki burchmi?</h2>
        <p className="muted">Har bir jumlani toʻgʻri qutiga joylang: tugmani bosing yoki kartani qutiga sudrang.</p>
        <SortGame />
      </section>
      <Footer />
    </>
  );
}

type Kind = "huquq" | "burch";

function SortGame() {
  const { update } = useProgress();
  const [deck, setDeck] = useState(() => shuffle(CONTENT.sort));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [placed, setPlaced] = useState<Record<Kind, string[]>>({ huquq: [], burch: [] });
  const [answer, setAnswer] = useState<{ ok: boolean; k: Kind } | null>(null);
  const [drag, setDrag] = useState<Kind | null>(null);
  const next = useRef<HTMLButtonElement>(null);
  const saved = useRef(false);

  useEffect(() => {
    if (answer) next.current?.focus();
  }, [answer]);

  const done = i >= deck.length;
  useEffect(() => {
    if (done && !saved.current) {
      saved.current = true;
      update((p) => ({ ...p, sortBest: Math.max(p.sortBest, score) }));
    }
  }, [done, score, update]);

  const start = () => {
    setDeck(shuffle(CONTENT.sort));
    setI(0);
    setScore(0);
    setPlaced({ huquq: [], burch: [] });
    setAnswer(null);
    saved.current = false;
  };

  if (done)
    return (
      <div className="game" id="sortg">
        <div className="result">
          <div className="big">{score}/{deck.length}</div>
          <p>
            {score === deck.length
              ? "Ajoyib! Huquq va burchni aniq farqlaysiz."
              : "Yaxshi natija. Xatolarni modda matnidan tekshirib, yana urinib koʻring."}
          </p>
          <button className="btn" onClick={start}>Qaytadan</button>
        </div>
      </div>
    );

  const c = deck[i];
  const pick = (k: Kind) => {
    if (answer) return;
    const ok = k === c.k;
    if (ok) setScore((s) => s + 1);
    setPlaced((p) => ({ ...p, [c.k]: [...p[c.k], c.s] }));
    setAnswer({ ok, k });
  };
  const bin = (k: Kind, cls: string, title: string) => (
    <button
      className={`bin ${cls}${drag === k ? " drag" : ""}`}
      disabled={!!answer}
      onClick={() => pick(k)}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(k);
      }}
      onDragLeave={() => setDrag(null)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(null);
        pick(k);
      }}
    >
      <h3>{title} <span>{placed[k].length}</span></h3>
      <ul>{placed[k].map((x, j) => <li key={j}>{x}</li>)}</ul>
    </button>
  );

  return (
    <div className="game" id="sortg">
      <div className="gtop">
        <span>{i + 1} / {deck.length}</span>
        <div className="bar"><i style={{ width: `${(i / deck.length) * 100}%` }} /></div>
        <span>Toʻgʻri: {score}</span>
      </div>
      <div className="sortcard" draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", "x")}>{c.s}</div>
      <div className="bins">
        {bin("huquq", "h", "Huquq")}
        {bin("burch", "b", "Burch")}
      </div>
      <div aria-live="polite">
        {answer && (
          <div className={"fb " + (answer.ok ? "ok" : "no")}>
            <strong>{answer.ok ? "Toʻgʻri!" : "Bu " + (c.k === "huquq" ? "huquq" : "burch") + "."}</strong>
            {c.art}-moddaga qarang. <ArtChips arts={[c.art]} />
            <div className="row">
              <button className="btn" ref={next} onClick={() => { setAnswer(null); setI(i + 1); }}>Davom etish</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
