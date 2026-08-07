"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import * as OpenCC from "opencc-js";
import { useScript } from "@/lib/script";
import type { PoemRow } from "@/lib/types";

// [LETTER-POETRY-PLAN-002#5] 简体 → 繁体转换器
const toTrad = OpenCC.Converter({ from: "cn", to: "t" });

type DailyRow = Pick<PoemRow, "id" | "title" | "author" | "section" | "text">;

function toLines(text: string): string[] {
  return text.split("\n").filter(Boolean);
}

export function DailyPoem() {
  const [poem, setPoem] = useState<DailyRow | null>(null);
  const [busy, setBusy] = useState(false);
  const script = useScript();
  const trad = script === "trad";

  const load = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/poem/daily");
      if (res.ok) setPoem((await res.json()) as DailyRow);
    } catch {
      /* keep current poem on failure */
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!poem) {
    return (
      <div className="daily-card">
        <div className="daily-head">
          <div className="eyebrow"><span className="blue">{"//"}</span> TODAY&apos;S POEM / 每日一诗</div>
          <button className="button" onClick={load} disabled={busy}>{busy ? "…" : "换一首 ↻"}</button>
        </div>
        <p className="portal-empty" style={{ margin: "24px 0" }}>正在取今日一诗…</p>
      </div>
    );
  }

  const lines = toLines(poem.text);
  const shownTitle = trad ? toTrad(poem.title) : poem.title;
  const shownAuthor = trad ? toTrad(poem.author || "佚名") : poem.author || "佚名";
  const shownLines = trad
    ? lines.slice(0, 2).map((l) => toTrad(l)).join("  ")
    : lines.slice(0, 2).join("  ");

  return (
    <div className="daily-card">
      <div className="daily-head">
        <div className="eyebrow"><span className="blue">{"//"}</span> TODAY&apos;S POEM / 每日一诗</div>
        <button className="button" onClick={load} disabled={busy}>{busy ? "…" : "换一首 ↻"}</button>
      </div>
      <div className="daily-body">
        <div className="daily-title">{shownTitle}</div>
        <div className="daily-author">{shownAuthor} · {poem.section || ""}</div>
        <p className="daily-lines">{shownLines}</p>
      </div>
      <div className="daily-foot">
        <Link className="button solid" href={`/poem/${poem.id}`}>读全文 →</Link>
        <span className="terminal">{poem.id}</span>
      </div>
    </div>
  );
}