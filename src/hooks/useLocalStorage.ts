import { useCallback, useState } from "react";

export const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem("kh_" + k);
      return v == null ? d : (JSON.parse(v) as T);
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem("kh_" + k, JSON.stringify(v));
    } catch {
      /* storage unavailable: ignore */
    }
  },
};

export function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => store.get(key, initial));
  const set = useCallback(
    (next: T | ((p: T) => T)) => {
      setVal((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        store.set(key, v);
        return v;
      });
    },
    [key],
  );
  return [val, set] as const;
}
