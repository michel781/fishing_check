"use client";

import { useEffect, useState } from "react";
import { pushFavorite } from "@/lib/auth/sync";
import { FAV_EVT, readFavs, writeFavs } from "@/lib/localStore";

export { readFavs, writeFavs };

export function useFavorites(): [string[], (id: string) => void, boolean] {
  const [favs, setFavs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setFavs(readFavs());
    sync();
    setReady(true);
    window.addEventListener(FAV_EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAV_EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const toggle = (id: string) => {
    const cur = readFavs();
    const on = !cur.includes(id);
    writeFavs(on ? [...cur, id] : cur.filter((x) => x !== id));
    // 로그인 상태면 계정에도 저장 (실패해도 이 기기에는 남는다)
    void pushFavorite(id, on);
  };
  return [favs, toggle, ready];
}
