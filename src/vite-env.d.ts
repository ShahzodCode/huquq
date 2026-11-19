/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL of the AI proxy (Cloudflare Worker). Empty → the assistant works offline only. */
  readonly VITE_AI_URL?: string;
}
