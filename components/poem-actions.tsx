"use client";

import { useState } from "react";

export function PoemActions({ text, title }: { text: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
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
      <button className="button dark" onClick={random} disabled={busy}>{busy ? "…" : "随机一首 ↻"}</button>
    </div>
  );
}