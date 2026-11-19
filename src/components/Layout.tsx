import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon } from "./Icon";
import { ArticleDrawer } from "./ArticleDrawer";
import { ScriptLayer } from "./Script";
import { ROUTES, TABS, TAB_NAME } from "../routes";
import { useArticle, useSettings, useSheet } from "../context";

const Logo = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#1B3F8B" />
    <path d="M20 6l4.5 9.5L34 20l-9.5 4.5L20 34l-4.5-9.5L6 20l9.5-4.5z" fill="#E9A23B" />
    <circle cx="20" cy="20" r="4.2" fill="#11998F" />
  </svg>
);

const Brand = ({ size }: { size: number }) => (
  <NavLink className="brand" to="/bosh">
    <Logo size={size} />
    <b>
      Konstitutsiyam<small>huquqiy kelajagim</small>
    </b>
  </NavLink>
);

function Tools() {
  const { theme, script, changeFs, toggleTheme, toggleScript } = useSettings();
  return (
    <>
      <div className="scriptsw" role="group" aria-label="Yozuv" data-keep>
        <button aria-pressed={script === "lat"} onClick={() => script !== "lat" && toggleScript()} lang="uz">Lotin</button>
        <button aria-pressed={script === "cyr"} onClick={() => script !== "cyr" && toggleScript()} lang="uz-Cyrl">Кирилл</button>
      </div>
      <button className="tbtn" onClick={() => changeFs(-1)} aria-label="Matnni kichraytirish">A−</button>
      <button className="tbtn" onClick={() => changeFs(1)} aria-label="Matnni kattalashtirish">A+</button>
      <button className="tbtn" onClick={toggleTheme}>{theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}</button>
    </>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const { closeArt } = useArticle();
  const { sheetOpen, openSheet } = useSheet();
  const main = useRef<HTMLElement>(null);
  const firstSheetLink = useRef<HTMLAnchorElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);

  const key = pathname.replace(/^\//, "") || "bosh";
  const { script } = useSettings();
  useEffect(() => {
    const r = key === "oqituvchi" ? [key, "Oʻqituvchi paneli"] : ROUTES.find((x) => x[0] === key) || ROUTES[0];
    document.title = r[1] + " — Konstitutsiyam";
  }, [key, script]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);

  useEffect(() => {
    if (sheetOpen) firstSheetLink.current?.focus();
  }, [sheetOpen]);

  return (
    <>
      <div className="app">
        <aside className="side" aria-label="Asosiy menyu">
          <Brand size={40} />
          <nav className="nav">
            {ROUTES.map(([k, n]) => (
              <NavLink key={k} to={"/" + k}>
                <Icon k={k} />
                <span>{n}</span>
              </NavLink>
            ))}
          </nav>
          <NavLink className="teachlink" to="/oqituvchi">
            <Icon k="oqituvchi" />
            <span>Oʻqituvchi paneli</span>
          </NavLink>
          <div className="tools"><Tools /></div>
        </aside>
        <div className="main">
          <header className="topbar"><Brand size={32} /></header>
          <main id="view" className="view" tabIndex={-1} ref={main}>
            <Outlet />
          </main>
        </div>
      </div>
      <nav className="tabbar" aria-label="Pastki menyu">
        {TABS.map((k) => (
          <NavLink key={k} to={"/" + k}>
            <Icon k={k} />
            <span>{TAB_NAME[k]}</span>
          </NavLink>
        ))}
        <button ref={moreBtn} onClick={() => openSheet(moreBtn.current)} aria-haspopup="dialog">
          <Icon k="yana" />
          <span>Yana</span>
        </button>
      </nav>
      <ArticleDrawer />
      <ScriptLayer />
      {sheetOpen && <div className="scrim on" onClick={closeArt} />}
      <div className={"sheet" + (sheetOpen ? " on" : "")} role="dialog" aria-label="Boshqa boʻlimlar">
        {ROUTES.filter((r) => !TABS.includes(r[0])).map(([k, n], i) => (
          <NavLink key={k} to={"/" + k} ref={i === 0 ? firstSheetLink : undefined} onClick={closeArt}>
            <Icon k={k} />
            {n}
          </NavLink>
        ))}
        <NavLink to="/oqituvchi" onClick={closeArt}>
          <Icon k="oqituvchi" />
          Oʻqituvchi paneli
        </NavLink>
        <div className="tools"><Tools /></div>
      </div>
    </>
  );
}
