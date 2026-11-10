import { useEffect, useState } from "react";
import { ART, K, SECT_SHORT } from "../data";
import { Icon } from "../components/Icon";
import { Footer } from "../components/common";
import { excerpt, search } from "../search";
import { useArticle } from "../context";

const HINTS = ["taʼlim", "bola", "internet", "sud", "mehnat", "tabiat", "saylov", "oila", "sogʻliq", "til"];
let lastQ = ""; // survives navigation, like the original

export default function Qidiruv() {
  const { openArt } = useArticle();
  const [input, setInput] = useState(lastQ);
  const [query, setQuery] = useState(lastQ); // debounced / submitted value
  useEffect(() => {
    const id = window.setTimeout(() => setQuery(input), 180);
    return () => window.clearTimeout(id);
  }, [input]);
  useEffect(() => {
    lastQ = query.trim();
  }, [query]);

  const r = search(query);
  const Row = ({ n, p, q }: { n: number; p: string; q: string }) => (
    <button onClick={() => openArt(n)}>
      <span className="n">{n}-modda</span>
      <span className="ch">{ART[n].chap || SECT_SHORT[ART[n].sec]}</span>
      <p>{excerpt(p, q).map((s, i) => (s.mark ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}</p>
    </button>
  );

  return (
    <>
      <div className="head">
        <h1>Konstitutsiyadan qidirish</h1>
        <p className="lead">
          Modda raqamini (masalan, <b>50</b>) yoki kalit soʻzni (masalan, <b>taʼlim</b>, <b>internet</b>) yozing. Qidiruv barcha 155
          moddaning rasmiy matni boʻyicha ishlaydi.
        </p>
      </div>
      <form className="sbox" role="search" onSubmit={(e) => { e.preventDefault(); setQuery(input); }}>
        <label htmlFor="q" className="sr">Qidiruv</label>
        <Icon k="qidiruv" width={22} height={22} style={{ color: "var(--xira)" }} />
        <input id="q" type="search" autoComplete="off" placeholder="Modda raqami yoki kalit soʻz" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn" type="submit">Qidirish</button>
      </form>
      <div className="hints">
        {HINTS.map((h) => (
          <button key={h} onClick={() => { setInput(h); setQuery(h); }}>{h}</button>
        ))}
      </div>
      <div className="res" id="res" aria-live="polite">
        {r.kind === "short" && <p className="muted">Kamida 2 ta harf yozing.</p>}
        {r.kind === "missing" && <p className="muted">Konstitutsiyada {r.n}-modda yoʻq. Moddalar 1 dan 155 gacha.</p>}
        {r.kind === "hits" && r.hits.length === 0 && (
          <p className="muted">“{query.trim()}” soʻzi topilmadi. Soʻzning boshqa shaklini sinab koʻring (masalan, “taʼlim” oʻrniga “taʼl”).</p>
        )}
        {r.kind === "hits" && r.hits.length > 0 && (
          <>
            {r.q && <p className="muted">{r.hits.length} ta modda topildi</p>}
            {r.hits.slice(0, 60).map(([n, p]) => <Row key={n} n={n} p={p} q={r.q} />)}
          </>
        )}
      </div>
      <section className="section toc">
        <h2>Mundarija</h2>
        <p className="muted">Muqaddima, 6 boʻlim, 27 bob, 155 modda.</p>
        <details>
          <summary>Muqaddima</summary>
          <div className="chap">{K.preamble.map((p, i) => <p className="para" key={i}>{p}</p>)}</div>
        </details>
        {K.sections.map((s, si) => (
          <details key={si}>
            <summary>{si + 1}-boʻlim. {SECT_SHORT[si]}</summary>
            <div className="chap">
              {s.chapters.map((c, ci) => (
                <div key={ci}>
                  {c.title && <h4>{c.title}</h4>}
                  <div className="nums">
                    {c.articles.map((a) => (
                      <button key={a.n} onClick={() => openArt(a.n)} aria-label={`${a.n}-modda`}>{a.n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>
      <Footer />
    </>
  );
}
