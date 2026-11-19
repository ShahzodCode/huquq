import { useState } from "react";
import { CONTENT } from "../data";
import { ArtChips, Footer, Segmented, Terms } from "../components/common";
import { useOfficial } from "../components/Script";

// kept at module level so the chosen category survives navigation (as in the original)
let rightsCat = "hammasi";

export default function Huquqlar() {
  const [cat, setCatState] = useState(rightsCat);
  const setCat = (c: string) => {
    rightsCat = c;
    setCatState(c);
  };
  const c = CONTENT.cats.find((x) => x.id === cat);
  const official = useOfficial();
  return (
    <>
      <div className="head">
        <h1>Mening huquqlarim</h1>
        <p className="lead">
          Har bir kartada huquq sodda tilda tushuntirilgan, hayotiy misol berilgan va rasmiy modda koʻrsatilgan. Modda raqamini
          bossangiz, uning rasmiy matni ochiladi.
        </p>
      </div>
      <div className="gstrip">
        {CONTENT.guarantees.map((g) => (
          <div className="card" key={g.title}>
            <h3>{g.title}</h3>
            <p><Terms text={g.simple} /></p>
            <ArtChips arts={g.arts} />
          </div>
        ))}
      </div>
      <Segmented label="Huquq turini tanlash" id="cats">
        <button aria-pressed={cat === "hammasi"} onClick={() => setCat("hammasi")}>Hammasi</button>
        {CONTENT.cats.map((x) => (
          <button key={x.id} aria-pressed={cat === x.id} onClick={() => setCat(x.id)}>
            {x.name.replace(" huquqlar", "")}
          </button>
        ))}
      </Segmented>
      <p className="muted" id="catdesc" style={{ margin: "12px 0 16px" }}>
        {c ? c.desc : `${CONTENT.rights.length} ta huquq, 5 turkum.`}
      </p>
      <div className="grid g2" id="rgrid">
        {CONTENT.rights
          .filter((r) => cat === "hammasi" || r.cat === cat)
          .map((r) => (
            <article className="card rcard" key={r.title}>
              <div className="cat">{CONTENT.cats.find((x) => x.id === r.cat)!.name}</div>
              <h3>{r.title}</h3>
              <p><Terms text={r.simple} /></p>
              <div className="example"><b>Misol:</b> {r.example}</div>
              <details className="flip">
                <summary>Rasmiy matndan parcha</summary>
                <blockquote data-official>{official(r.arts[0]).text[0]}</blockquote>
              </details>
              <ArtChips arts={r.arts} />
            </article>
          ))}
      </div>
      <Footer />
    </>
  );
}
