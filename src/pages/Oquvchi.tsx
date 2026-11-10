import { useState } from "react";
import { CONTENT } from "../data";
import { ArtChips, Footer, Terms } from "../components/common";

let dayMemo = 0;

export default function Oquvchi() {
  const [dayI, setDay] = useState(dayMemo);
  const go = (i: number) => {
    dayMemo = i;
    setDay(i);
  };
  const days = CONTENT.student.day;
  const d = days[dayI];
  return (
    <>
      <div className="head">
        <h1>Oʻquvchi huquqlari</h1>
        <p className="lead">{CONTENT.student.intro}</p>
      </div>
      <div className="grid g2">
        {CONTENT.student.cards.map((c) => (
          <article className="card" key={c.title}>
            <h3>{c.title}</h3>
            <p><Terms text={c.simple} /></p>
            <ArtChips arts={c.arts} />
          </article>
        ))}
      </div>
      <section className="section">
        <h2>Bir kun maktabda</h2>
        <p className="muted">Ertalabdan kechgacha — har bir lahzada qaysi huquq seni himoya qiladi?</p>
        <div className="day">
          <div className="times" role="tablist" aria-label="Kun vaqtlari">
            {days.map((x, i) => (
              <button key={i} role="tab" aria-selected={i === dayI} onClick={() => go(i)}>
                <b>{x.time}</b>
                <span>{x.title}</span>
              </button>
            ))}
          </div>
          <div className="dayview" id="dayview" role="tabpanel" aria-live="polite">
            <div className="clock">{d.time}</div>
            <h3 style={{ margin: "6px 0 8px" }}>{d.title}</h3>
            <p>{d.text}</p>
            <ArtChips arts={d.arts} />
            <div className="daynav">
              <button className="btn soft" disabled={dayI === 0} onClick={() => go(dayI - 1)}>‹ Oldingi</button>
              <button className="btn" disabled={dayI === days.length - 1} onClick={() => go(dayI + 1)}>Keyingi ›</button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
