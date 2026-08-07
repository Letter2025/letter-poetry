"use client";

import Link from "next/link";
import { useState } from "react";
import * as OpenCC from "opencc-js";
import { useScript } from "@/lib/script";
import type { Poem } from "@/lib/types";

// [LETTER-POETRY-PLAN-001#2] 简体 → 繁体转换器
const toTrad = OpenCC.Converter({ from: "cn", to: "t" });

let fullIndexPromise: Promise<{ id: string; c: string }[]> | null = null;
function getIndex() {
  if (!fullIndexPromise) {
    fullIndexPromise = fetch("/data/index.json").then((r) => r.json()).then((j) => j.poems);
  }
  return fullIndexPromise;
}
async function fetchPoem(id: string, c: string): Promise<Poem | null> {
  const list = await fetch(`/data/collections/${c}.json`).then((r) => r.json());
  return list.find((p: Poem) => p.id === id) ?? null;
}

export function DailyPoem({ initial }: { initial: Poem }) {
  const [poem, setPoem] = useState<Poem>(initial);
  const [busy, setBusy] = useState(false);
  const script = useScript();
  const trad = script === "trad";
  const shuffle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const metas = await getIndex();
      const meta = metas[Math.floor(Math.random() * metas.length)];
      const next = await fetchPoem(meta.id, meta.c);
      if (next) setPoem(next);
    } catch {
      /* keep current poem on failure */
    } finally {
      setBusy(false);
    }
  };
  // [LETTER-POETRY-PLAN-001#2] 每日一诗正文跟随繁简切换
  const shownTitle = trad ? toTrad(poem.t) : poem.t;
  const shownAuthor = trad ? toTrad(poem.a || "佚名") : poem.a || "佚名";
  const shownLines = trad
    ? poem.p.slice(0, 2).map((l) => toTrad(l)).join("  ")
    : poem.p.slice(0, 2).join("  ");
  return (
    <div className="daily-card">
      <div className="daily-head">
        <div className="eyebrow"><span className="blue">{"//"}</span> TODAY&apos;S POEM / 每日一诗</div>
        <button className="button" onClick={shuffle} disabled={busy}>{busy ? "…" : "换一首 ↻"}</button>
      </div>
      <div className="daily-body">
        <div className="daily-title">{shownTitle}</div>
        <div className="daily-author">{shownAuthor} · {poem.s || ""}</div>
        <p className="daily-lines">{shownLines}</p>
      </div>
      <div className="daily-foot">
        <Link className="button solid" href={`/poem/${poem.id}`}>读全文 →</Link>
        <span className="terminal">{poem.id}</span>
      </div>
    </div>
  );
}