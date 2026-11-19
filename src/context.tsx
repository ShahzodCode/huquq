import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Progress } from "./types";
import { store, useLocalStorage } from "./hooks/useLocalStorage";
import { ART } from "./data";

/* ---------- progress ---------- */
const EMPTY: Progress = { read: [], quiz: {}, sitDone: [], sortBest: 0, blitzBest: 0, findBest: 0 };

interface ProgressCtx {
  P: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  reset: () => void;
}
const ProgressContext = createContext<ProgressCtx>(null as never);
export const useProgress = () => useContext(ProgressContext);

/* ---------- settings ---------- */
interface SettingsCtx {
  fs: number;
  theme: "light" | "dark";
  changeFs: (d: number) => void;
  toggleTheme: () => void;
}
const SettingsContext = createContext<SettingsCtx>(null as never);
export const useSettings = () => useContext(SettingsContext);

/* ---------- toast ---------- */
const ToastContext = createContext<(m: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

/* ---------- article drawer ---------- */
interface ArticleCtx {
  open: number | null;
  openArt: (n: number) => void;
  closeArt: () => void;
}
const ArticleContext = createContext<ArticleCtx>(null as never);
export const useArticle = () => useContext(ArticleContext);

/* ---------- mobile "more" sheet ---------- */
interface SheetCtx {
  sheetOpen: boolean;
  openSheet: (from: HTMLElement | null) => void;
}
const SheetContext = createContext<SheetCtx>(null as never);
export const useSheet = () => useContext(SheetContext);

export function AppProviders({ children }: { children: ReactNode }) {
  const [P, setP] = useLocalStorage<Progress>("progress", EMPTY);
  // merge defaults so progress saved by older versions still works
  const progress = useMemo(() => ({ ...EMPTY, ...P }), [P]);
  const update = useCallback((fn: (p: Progress) => Progress) => setP((p) => fn({ ...EMPTY, ...p })), [setP]);
  const reset = useCallback(() => setP(EMPTY), [setP]);

  const [fs, setFs] = useState<number>(() => store.get("fs", 17));
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    store.get<"light" | "dark">("theme", "light"),
  );
  useEffect(() => {
    document.documentElement.style.setProperty("--fs", fs + "px");
    document.documentElement.dataset.theme = theme;
  }, [fs, theme]);
  const settings = useMemo<SettingsCtx>(
    () => ({
      fs,
      theme,
      changeFs: (d) =>
        setFs((v) => {
          const n = Math.min(22, Math.max(14, v + d));
          store.set("fs", n);
          return n;
        }),
      toggleTheme: () =>
        setTheme((t) => {
          const n = t === "dark" ? "light" : "dark";
          store.set("theme", n);
          return n;
        }),
    }),
    [fs, theme],
  );

  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<number>();
  const toast = useCallback((m: string) => {
    setToastMsg(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(""), 1800);
  }, []);

  const [open, setOpen] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const skipReset = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const openArt = useCallback(
    (n: number) => {
      if (!ART[n]) return;
      lastFocus.current = document.activeElement as HTMLElement | null;
      update((p) => (p.read.includes(n) ? p : { ...p, read: [...p.read, n] }));
      setOpen(n);
    },
    [update],
  );
  const closeArt = useCallback(() => {
    setOpen(null);
    setSheetOpen(false);
    lastFocus.current?.focus?.();
  }, []);
  const openSheet = useCallback((from: HTMLElement | null) => {
    lastFocus.current = from;
    setSheetOpen(true);
  }, []);

  // Close overlays on navigation; /modda-N deep links open the drawer over the search page.
  useEffect(() => {
    const m = location.pathname.match(/^\/modda-(\d+)$/);
    if (m) {
      skipReset.current = true; // the redirect below must not close the drawer we are opening
      navigate("/qidiruv", { replace: true });
      openArt(+m[1]);
    } else if (skipReset.current) {
      skipReset.current = false;
    } else {
      setOpen(null);
      setSheetOpen(false);
    }
  }, [location.pathname, navigate, openArt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeArt();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeArt]);

  return (
    <ProgressContext.Provider value={{ P: progress, update, reset }}>
      <SettingsContext.Provider value={settings}>
        <ToastContext.Provider value={toast}>
          <ArticleContext.Provider value={{ open, openArt, closeArt }}>
            <SheetContext.Provider value={{ sheetOpen, openSheet }}>
              {children}
              <div className="toast" id="toast" role="status" aria-live="polite" style={{ display: toastMsg ? "block" : "none" }}>
                {toastMsg}
              </div>
            </SheetContext.Provider>
          </ArticleContext.Provider>
        </ToastContext.Provider>
      </SettingsContext.Provider>
    </ProgressContext.Provider>
  );
}
