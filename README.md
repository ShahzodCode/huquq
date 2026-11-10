# Konstitutsiyam — huquqiy kelajagim

React (Vite + TypeScript) version of the site. It still builds to **one offline `index.html`**.

## Use it

| What | Where |
|---|---|
| The original, pre-React single file (kept because it is convenient to just double-click) | `original/index.html` |
| The new React site, built as a single file | `dist/index.html` (after `npm run build`) |

## Develop

```bash
npm install
npm run dev      # dev server with hot reload
npm test         # data-integrity, search and UI tests
npm run build    # type-check + build dist/index.html (single file, works from file://)
```

## Layout

- `src/data/constitution.json` — all 155 articles, word for word from https://lex.uz/docs/-6445145 (checked 2026-11-10)
- `src/data/content.json` — explanations, quiz, situations, glossary (edit this to change content; types are in `src/types.ts`)
- `src/pages/` — one component per page (`Bosh`, `Huquqlar`, `Oquvchi`, `Burchlar`, `Sinov`, `Vaziyatlar`, `Qidiruv`, `Manbalar`)
- `src/components/` — `Layout`, `ArticleDrawer`, `Icon`, shared bits (`ArtChips`, `Terms`, `Footer`)
- `src/context.tsx` — progress (localStorage `kh_progress`, same keys as before), settings (theme, font size), toast, article drawer
- `src/search.ts` — article-number and keyword search
- `src/styles/global.css` — the original stylesheet, unchanged
- `review.md` — checklist for reviewing the simple-language texts, quiz and situations
- `legacy/` — the old Python build (`tools/`, `src/template.html`, `content.src.js`) kept for reference only

Routes use the hash (`#/huquqlar`, `#/modda-50`). Old links such as `#huquqlar` are rewritten on load.
`src/data/content.json` was generated from the old `content.src.js` (apostrophes already normalised), so it is now the source of truth.
