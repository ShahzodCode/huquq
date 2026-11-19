import { useMemo, useState } from "react";
import { Footer } from "../components/common";
import { Icon } from "../components/Icon";
import { useToast } from "../context";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SKILLS, overall, parseMany, randomClassCode, type Result } from "../teacher";

type Classes = Record<string, Result[]>;
const pct = (x: number) => Math.round(x * 100);

export default function Oqituvchi() {
  const toast = useToast();
  const [classes, setClasses] = useLocalStorage<Classes>("teacher", {});
  const codes = Object.keys(classes);
  const [active, setActive] = useState<string>(codes[0] || "");
  const [name, setName] = useState("");
  const [paste, setPaste] = useState("");
  const [msg, setMsg] = useState("");
  const [sortBy, setSortBy] = useState<"j" | "total">("j");

  const rows = useMemo(() => {
    const r = [...(classes[active] || [])];
    return sortBy === "j" ? r.sort((a, b) => a.j - b.j) : r.sort((a, b) => overall(b) - overall(a));
  }, [classes, active, sortBy]);

  const create = () => {
    const code = randomClassCode(name || "Sinf");
    setClasses((c) => ({ ...c, [code]: [] }));
    setActive(code);
    setName("");
    toast("Sinf kodi yaratildi: " + code);
  };

  const add = () => {
    const { ok, bad } = parseMany(paste);
    const mine = ok.filter((r) => r.c === active);
    const other = ok.length - mine.length;
    setClasses((c) => {
      const list = [...(c[active] || [])];
      for (const r of mine) {
        const i = list.findIndex((x) => x.j === r.j);
        if (i < 0) list.push(r);
        else if (r.d >= list[i].d) list[i] = r; // keep the newest result per register number
      }
      return { ...c, [active]: list };
    });
    const parts = [`${mine.length} ta natija qoʻshildi`];
    if (other) parts.push(`${other} ta kod boshqa sinfga tegishli`);
    if (bad) parts.push(`${bad} ta kod buzilgan`);
    if (!ok.length && !bad) parts.splice(0, 1, "Matnda natija kodi topilmadi");
    setMsg(parts.join(" · "));
    if (mine.length) setPaste("");
  };

  const remove = (j: number) => setClasses((c) => ({ ...c, [active]: (c[active] || []).filter((r) => r.j !== j) }));
  const dropClass = () => {
    setClasses((c) => {
      const n = { ...c };
      delete n[active];
      return n;
    });
    setActive(codes.find((c) => c !== active) || "");
  };

  const csv = () => {
    const head = ["Jurnal №", "Sana", "Test 1", "Test 2", "Test 3", "Vaziyatlar (32)", "Moddani toping (10)", "Huquq yoki burch (14)", "Bilimdon", "Oʻqilgan moddalar", "Umumiy %"];
    const lines = rows.map((r) => [r.j, r.d, ...r.q.map((v) => (v < 0 ? "" : v)), r.s, r.f, r.so, r.b, r.r, pct(overall(r))].join(";"));
    const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `natijalar-${active}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const skillAvg = SKILLS.map((s) => ({ ...s, avg: rows.length ? rows.reduce((a, r) => a + Math.min(1, s.of(r)), 0) / rows.length : 0 }));
  const sorted = [...skillAvg].sort((a, b) => b.avg - a.avg);
  const avg = rows.length ? rows.reduce((a, r) => a + overall(r), 0) / rows.length : 0;

  return (
    <>
      <div className="head">
        <div className="kicker">Oʻqituvchilar uchun</div>
        <h1>Oʻqituvchi paneli</h1>
        <p className="lead">
          Sinfingiz natijalarini bir joyda koʻring. Server ham, roʻyxatdan oʻtish ham kerak emas: oʻquvchilar ism emas, faqat jurnaldagi
          raqamini koʻrsatib natija kodini yuboradi, siz esa kodlarni shu yerga joylaysiz.
        </p>
      </div>

      <ol className="howto">
        <li><b>Sinf kodini yarating</b> va doskaga yozing.</li>
        <li>Oʻquvchilar <b>Bosh sahifa → Mening yutuqlarim</b> boʻlimida kod va jurnal raqamini kiritib, natija kodini sinf guruhiga yuboradi.</li>
        <li>Guruhdagi xabarlarni nusxalab, <b>pastdagi maydonga joylang</b> — kodlar oʻzi ajratib olinadi.</li>
      </ol>

      <div className="t-grid">
        <section className="card t-classes">
          <h3>Sinflar</h3>
          {codes.length > 0 && (
            <div className="t-chips" role="tablist" aria-label="Sinflar">
              {codes.map((c) => (
                <button key={c} role="tab" aria-selected={c === active} onClick={() => { setActive(c); setMsg(""); }} data-keep>
                  {c} <small>{classes[c].length}</small>
                </button>
              ))}
            </div>
          )}
          <form className="t-new" onSubmit={(e) => { e.preventDefault(); create(); }}>
            <label htmlFor="cn" className="sr">Sinf nomi</label>
            <input id="cn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sinf nomi, masalan 10-A" maxLength={10} />
            <button className="btn" type="submit">Kod yaratish</button>
          </form>
          {active && (
            <div className="t-code">
              <span>Doskaga yozing:</span>
              <b data-keep>{active}</b>
              <button className="tbtn2" onClick={() => { navigator.clipboard?.writeText(active); toast("Nusxa olindi"); }} aria-label="Sinf kodidan nusxa olish"><Icon k="copy" /></button>
            </div>
          )}
        </section>

        <section className="card t-paste">
          <h3>Natija kodlarini qoʻshish</h3>
          {active ? (
            <>
              <label htmlFor="tp" className="sr">Natija kodlari</label>
              <textarea id="tp" rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Sinf guruhidagi xabarlarni shu yerga joylang. Masalan: KH1.eyJjIjoi…" />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={add} disabled={!paste.trim()}>Qoʻshish</button>
                {msg && <span className="muted small" role="status">{msg}</span>}
              </div>
            </>
          ) : (
            <p className="muted">Avval sinf kodini yarating.</p>
          )}
        </section>
      </div>

      {active && (
        <section className="section">
          <div className="t-tiles">
            <div><b>{rows.length}</b><span>oʻquvchi</span></div>
            <div><b>{rows.length ? pct(avg) + "%" : "—"}</b><span>oʻrtacha natija</span></div>
            <div><b className="small-b">{rows.length ? sorted[0].name : "—"}</b><span>eng kuchli tomoni</span></div>
            <div className="warn"><b className="small-b">{rows.length ? sorted[sorted.length - 1].name : "—"}</b><span>eʼtibor talab qiladi</span></div>
          </div>

          {rows.length > 0 ? (
            <>
              <div className="card t-skills">
                <h3>Koʻnikmalar boʻyicha sinf oʻrtachasi</h3>
                {skillAvg.map((s) => (
                  <div className="t-skill" key={s.id}>
                    <span>{s.name}</span>
                    <div className="bar"><i style={{ width: pct(s.avg) + "%" }} /></div>
                    <b>{pct(s.avg)}%</b>
                  </div>
                ))}
              </div>

              <div className="t-tablehead">
                <h3>Oʻquvchilar</h3>
                <div className="row" style={{ margin: 0 }}>
                  <div className="seg" role="group" aria-label="Saralash">
                    <button aria-pressed={sortBy === "j"} onClick={() => setSortBy("j")}>Jurnal boʻyicha</button>
                    <button aria-pressed={sortBy === "total"} onClick={() => setSortBy("total")}>Natija boʻyicha</button>
                  </div>
                  <button className="btn ghost" onClick={csv}>CSV yuklab olish</button>
                </div>
              </div>
              <div className="t-table" role="region" aria-label="Natijalar jadvali" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th>№</th><th>Test 1·2·3</th><th>Vaziyatlar</th><th>Moddani toping</th><th>Huquq/burch</th><th>Bilimdon</th><th>Oʻqigan</th><th>Umumiy</th><th><span className="sr">Amallar</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const o = pct(overall(r));
                      return (
                        <tr key={r.j}>
                          <td><b>{r.j}</b></td>
                          <td>{r.q.map((v) => (v < 0 ? "–" : v)).join(" · ")}</td>
                          <td>{r.s}/32</td>
                          <td>{r.f}/10</td>
                          <td>{r.so}/14</td>
                          <td>{r.b}</td>
                          <td>{r.r}</td>
                          <td><span className={"score " + (o >= 70 ? "hi" : o >= 40 ? "mid" : "lo")}>{o}%</span></td>
                          <td><button className="t-del" onClick={() => remove(r.j)} aria-label={`${r.j}-oʻquvchi natijasini oʻchirish`}>×</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="t-empty">
              <Icon k="oqituvchi" />
              <p>Hali natija yoʻq. Oʻquvchilar kodni yuborgach, ularni yuqoridagi maydonga joylang.</p>
            </div>
          )}
          <div className="row">
            <button className="btn soft" onClick={dropClass}>Bu sinfni oʻchirish</button>
          </div>
        </section>
      )}

      <div className="notice">
        <b>Maxfiylik.</b> Natija kodida faqat sinf kodi, jurnal raqami, sana va ballar bor — ism, telefon yoki boshqa shaxsiy maʼlumot yoʻq.
        Natijalar faqat shu qurilmada saqlanadi.
      </div>
      <Footer />
    </>
  );
}
