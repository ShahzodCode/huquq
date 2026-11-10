import { CHECKED, CONTENT } from "../data";
import { Footer } from "../components/common";
import { useProgress, useToast } from "../context";

export default function Manbalar() {
  const { reset } = useProgress();
  const toast = useToast();
  return (
    <>
      <div className="head">
        <h1>Foydali manbalar</h1>
        <p className="lead">Saytdagi barcha modda matnlari rasmiy manbadan oʻzgarishsiz olingan. Quyida — asl manbalar, lugʻat va saytning ishlash qoidalari.</p>
      </div>
      <div className="grid g2 srcs">
        {CONTENT.sources.map((s) => (
          <div className="card" key={s.url}>
            <h3><a href={s.url} target="_blank" rel="noopener">{s.name}</a></h3>
            <p className="muted" style={{ fontSize: ".9rem" }}>{s.note}</p>
            <p style={{ fontSize: ".8rem", wordBreak: "break-all" }} className="muted">{s.url}</p>
          </div>
        ))}
      </div>
      <div className="notice">
        <b>Matn tahriri haqida.</b> Saytda Konstitutsiyaning 2023-yil 30-apreldagi yangi tahriri, 2026-yil 13-iyuldagi OʻRQ-1158-sonli
        Konstitutsiyaviy Qonun bilan kiritilgan oʻzgartishlar bilan birga (15, 109, 131, 134, 151-moddalar) keltirilgan. Oxirgi tekshiruv:{" "}
        {CHECKED}. Qonunchilikda oʻzgarish boʻlsa, matn qayta tekshiriladi.
      </div>
      <section className="section">
        <h2>Huquqiy lugʻat</h2>
        <p className="muted">Matnda nuqtali chiziq bilan belgilangan soʻzni bossangiz, uning maʼnosi chiqadi.</p>
        <div className="gloss">
          {CONTENT.glossary.map((g) => (
            <div key={g.t}><b>{g.t}</b>{g.d}</div>
          ))}
        </div>
      </section>
      <section className="section">
        <h2>Sayt qoidalari</h2>
        <ol className="todo">
          <li>Konstitutsiya moddalari rasmiy manbadan (lex.uz) olingan va oʻzgartirilmagan; har bir izoh yonida modda raqami va rasmiy manbaga havola bor.</li>
          <li>Sodda tushuntirishlar va misollar maʼrifiy maqsadda yozilgan va oʻqituvchi tomonidan tekshiriladi.</li>
          <li>Saytdan foydalanish uchun pasport, telefon, manzil yoki boshqa shaxsiy maʼlumot soʻralmaydi. Test natijalari faqat sizning qurilmangizda saqlanadi.</li>
          <li>Rasmlar sayt uchun maxsus chizilgan.</li>
          <li>Sayt rasmiy huquqiy maslahat oʻrnini bosmaydi.</li>
        </ol>
        <div className="row">
          <button className="btn ghost" id="reset" onClick={() => { reset(); toast("Natijalar tozalandi"); }}>Natijalarimni tozalash</button>
        </div>
      </section>
      <Footer />
    </>
  );
}
