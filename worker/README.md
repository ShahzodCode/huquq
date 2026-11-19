# AI proxy (Google Gemini)

The site is static, so the Gemini API key can't live in the page. This small Cloudflare Worker
keeps the key secret and forwards requests to Gemini. Both services have free tiers.

## Setup (about 10 minutes)

1. **Gemini key** — open <https://aistudio.google.com/apikey>, sign in, and create an API key.
2. **Cloudflare account** — sign up for free at <https://dash.cloudflare.com/sign-up>.
3. **Deploy the Worker** (from this `worker/` folder):

   ```sh
   npx wrangler login
   npx wrangler secret put GEMINI_API_KEY   # paste the key when asked
   npx wrangler deploy
   ```

   It prints a URL like `https://konstitutsiyam-ai.<your-name>.workers.dev`.
4. **Connect the site** — in the project root, create `.env.production` with:

   ```
   VITE_AI_URL=https://konstitutsiyam-ai.<your-name>.workers.dev
   ```

   (for local testing put the same line in `.env.local`), then rebuild with `npm run build`.

If the site is hosted somewhere other than `https://konstitutsiyam.vercel.app` or `https://shahzodcode.github.io`
(for example a Vercel preview URL), add that address to
`ALLOWED_ORIGINS` in `wrangler.toml` and run `npx wrangler deploy` again.

## How it stays safe

- The key is only in Cloudflare's secret store, never in the site or in git.
- Only the allowed site (and localhost) can call the Worker.
- The site sends at most 8 candidate articles chosen by its own on-device matcher; Gemini may
  only pick from those, and the Worker drops any other article number it returns.
- The page always shows the official article text from its own data. The AI's short answer is
  labelled “tekshirilmagan” (unchecked).
- If the Worker or Gemini fails, or the free quota runs out, the site silently keeps the offline result.

The models are set by `GEMINI_MODELS` in `wrangler.toml` (tried in order; if one is down, overloaded
or slow, the next is used). If Google retires a model (it answers 404), replace its name with a
current Flash-Lite model from <https://ai.google.dev/gemini-api/docs/models> and redeploy.
Avoid "thinking" models here: their hidden reasoning can use up the output limit and cut off the reply.
