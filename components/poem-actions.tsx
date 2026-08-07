"use client";

import { useEffect, useState } from "react";

const FAV_KEY = "poetry-favorites";

function readFavs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

// [LETTER-POETRY-PLAN-001#3] 收藏：localStorage 收藏夹，配合 /favorites 页面
export function PoemActions({ id, text, title }: { id: string; text: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(readFavs().includes(id));
  }, [id]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  const toggleFav = () => {
    const favs = readFavs();
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1);
    else favs.push(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    setFav(i < 0);
  };
  const random = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const idx = await fetch("/data/index.json").then((r) => r.json());
      const meta = idx.poems[Math.floor(Math.random() * idx.poems.length)];
      window.location.href = `/poem/${meta.id}`;
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="hero-actions" style={{ margin: "26px 0 34px", justifyContent: "center" }}>
      <button className="button" onClick={copy}>{copied ? "已复制 ✓" : "复制全文"}</button>
      <button className="button" onClick={toggleFav} aria-pressed={fav}>{fav ? "已收藏 ★" : "收藏 ☆"}</button>
      <button className="button dark" onClick={random} disabled={busy}>{busy ? "…" : "随机一首 ↻"}</button>
    </div>
  );
}