import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ART, CONTENT, SCOL, SECT_SHORT } from "../data";
import { Icon } from "../components/Icon";
import { Footer } from "../components/common";
import { ROUTES } from "../routes";
import { useArticle, useProgress, useToast } from "../context";
import { useOfficial } from "../components/Script";
import { EXAMPLES } from "../components/Assistant";
import { store } from "../hooks/useLocalStorage";
import { cleanClass, encode, makeResult } from "../teacher";

export default function Bosh() {
  const { P } = useProgress();
  const { openArt } = useArticle();
  const [sec, setSec] = useState<number | null>(null);
  const official = useOfficial();
  const navigate = useNavigate();
  const [ask, setAsk] = useState("");
  const go = (q: string) => q.trim() && navigate("/vaziyatlar?q=" + encodeURIComponent(q.trim()));
  const dayN = CONTENT.findPool[Math.floor(Date.now() / 864e5) % CONTENT.findPool.length];
  const badges: [string, string, boolean][] = [
    ["Kashfiyotchi", "10 ta moddani oʻqing", P.read.length >= 10],
    ["Test ustasi", "Istalgan darajada 10+ ball", Object.values(P.quiz).some((v) => v >= 10)],
    ["Vaziyat tahlilchisi", "8 ta vaziyatni yeching", P.sitDone.length >= 8],
    ["Huquq yoki burch", "Saralashda 14/14", P.sortBest >= 14],
    ["Huquqiy bilimdon", "Bilimdon oʻyinida 15+ ball", P.blitzBest >= 15],
    ["Modda ovchisi", "“Moddani toping!”da 8+", P.findBest >= 8],
  ];

  return (
    <>
      <section className="hero">
        <div>
          <div className="kicker">2023-yilgi yangi tahrir asosida</div>
          <h1>Konstitutsiyam — huquqiy kelajagim</h1>
          <p className="lead">
            Asosiy qonunimiz 155 moddadan iborat. Bu yerda ularni oʻz tilingda oʻqiysan, oʻz huquqing va burchingni topasan,
            bilimingni oʻyinlar va hayotiy vaziyatlarda sinab koʻrasan.
          </p>
          <div className="actions">
            <Link className="btn" to="/huquqlar">Huquqlarimni koʻrish</Link>
            <Link className="btn ghost" to="/sinov">Bilimimni sinash</Link>
          </div>
        </div>
        <div className="wall" aria-label="155 modda: har bir koshin — bitta modda">
          <p className="wallcap"><b>155 modda — 155 koshin</b><span>Koshinni bosing</span></p>
          <div className="tiles" id="tiles">
            {Object.values(ART).map((a) => (
              <button
                key={a.n}
                className={"tile" + (sec !== null && sec !== a.sec ? " dim" : "")}
                style={{ background: SCOL[a.sec] }}
                onClick={() => openArt(a.n)}
                aria-label={`${a.n}-modda, ${SECT_SHORT[a.sec]}`}
              >
                {a.n}
              </button>
            ))}
          </div>
          <div className="legend">
            {SECT_SHORT.map((s, i) => (
              <button key={i} aria-pressed={sec === i} onClick={() => setSec(sec === i ? null : i)}>
                <i style={{ background: SCOL[i] }} />
                {i + 1}. {s}
              </button>
            ))}
          </div>
        </div>
      </section>
      <form className="askbar" onSubmit={(e) => { e.preventDefault(); go(ask); }} role="search" aria-label="Huquqiy yordamchi">
        <div className="askbar-label"><Icon k="spark" /> Huquqiy yordamchi</div>
        <div className="askbar-row">
          <label htmlFor="ask" className="sr">Vaziyatingizni yozing</label>
          <input id="ask" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Nima boʻldi? Masalan: maktabda darsga kirish uchun pul soʻrashyapti" autoComplete="off" />
          <button className="btn" type="submit">Huquqimni topish <Icon k="arrow" /></button>
        </div>
        <div className="askbar-ex">
          {EXAMPLES.slice(0, 3).map((x) => <button type="button" key={x} onClick={() => go(x)}>{x}</button>)}
        </div>
      </form>
      <div className="facts">
        <div><b>155</b><span>modda</span></div>
        <div><b>27</b><span>bob</span></div>
        <div><b>6</b><span>boʻlim va muqaddima</span></div>
        <div><b>30.04.2023</b><span>umumxalq referendumida qabul qilingan</span></div>
      </div>
      <section className="section">
        <h2>Bugungi modda</h2>
        <p className="muted">Har kuni yangi modda bilan tanishing.</p>
        <div className="daycard">
          <div className="num">{dayN}</div>
          <div>
            <p data-official>{official(dayN).text[0]}</p>
            <button className="btn" onClick={() => openArt(dayN)}>Toʻliq oʻqish</button>
          </div>
        </div>
      </section>
      <section className="section">
        <h2>Boʻlimlar</h2>
        <p className="muted">“Mening huquqim qaysi?”, “Bunday vaziyatda nima qilishim kerak?”, “Bilimimni qanday tekshiraman?” — javoblar shu yerda.</p>
        <div className="qnav">
          {ROUTES.slice(1).map(([k, n, d]) => (
            <Link key={k} to={"/" + k}>
              <h3><Icon k={k} />{n}</h3>
              <p>{d}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="section">
        <h2>Mening yutuqlarim</h2>
        <p className="muted">Natijalar faqat shu qurilmada saqlanadi. Oʻqilgan moddalar: {P.read.length} / 155.</p>
        <ShareResult />
        <div className="badges">
          {badges.map(([t, d, on]) => (
            <div key={t} className={"badge" + (on ? " on" : "")}>
              <Icon k="star" />
              <div><b>{t}</b><br />{d}</div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}

/** Student → teacher: a short result code with class code and register number only (no name). */
function ShareResult() {
  const { P } = useProgress();
  const toast = useToast();
  const [cls, setCls] = useState(() => store.get("cls", ""));
  const [jr, setJr] = useState(() => store.get("jr", ""));
  const [code, setCode] = useState("");
  const valid = cleanClass(cls).length >= 3 && +jr >= 1 && +jr <= 60;
  const make = () => {
    store.set("cls", cls);
    store.set("jr", jr);
    setCode(encode(makeResult(P, cls, +jr)));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Kod nusxalandi — uni sinf guruhiga yuboring");
    } catch {
      toast("Nusxa olib boʻlmadi — kodni belgilab oling");
    }
  };
  return (
    <div className="share">
      <div className="share-text">
        <h3>Natijani oʻqituvchiga yuborish</h3>
        <p className="muted">Oʻqituvchi bergan sinf kodini va jurnaldagi raqamingizni kiriting. Ismingiz kerak emas.</p>
      </div>
      <form className="share-form" onSubmit={(e) => { e.preventDefault(); if (valid) make(); }}>
        <label>
          <span>Sinf kodi</span>
          <input value={cls} onChange={(e) => { setCls(e.target.value); setCode(""); }} placeholder="10A-K7Q" autoComplete="off" data-keep />
        </label>
        <label className="narrow">
          <span>Jurnal №</span>
          <input value={jr} onChange={(e) => { setJr(e.target.value.replace(/\D/g, "").slice(0, 2)); setCode(""); }} inputMode="numeric" placeholder="7" />
        </label>
        <button className="btn" type="submit" disabled={!valid}>Kod yaratish</button>
      </form>
      {code && (
        <div className="share-code">
          <code data-keep>{code}</code>
          <button className="btn soft" onClick={copy}><Icon k="copy" /> Nusxa olish</button>
        </div>
      )}
    </div>
  );
}
