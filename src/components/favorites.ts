"use client";

import { useEffect, useState } from "react";

const KEY = "fc:favs";
const EVT = "fc:favs-change";

export function readFavs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeFavs(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  window.dispatchEvent(new Event(EVT));
}

export function useFavorites(): [string[], (id: string) => void, boolean] {
  const [favs, setFavs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setFavs(readFavs());
    sync();
    setReady(true);
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const toggle = (id: string) => {
    const cur = readFavs();
    writeFavs(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };
  return [favs, toggle, ready];
}
