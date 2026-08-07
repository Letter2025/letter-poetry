"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AuthorRow = { name: string; count: number };

const PAGE = 120;

// [LETTER-POETRY-PLAN-001#4] 作者索引：搜索 + 分页
export function AuthorBrowser({ authors }: { authors: AuthorRow[] }) {
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(PAGE);
  const filtered = useMemo(() => {
    if (!q) return authors;
    const n = q.trim().toLowerCase();
    return authors.filter((a) => a.name.toLowerCase().includes(n));
  }, [authors, q]);
  const shown = filtered.slice(0, visible);
  return (
    <>
      <div className="portal-search" style={{ marginBottom: 26 }}>
        <input value={q} onChange={(e) => { setQ(e.target.value); setVisible(PAGE); }} placeholder={`在 ${authors.length} 位作者中检索…`} aria-label="检索作者" />
        <span className="portal-search-icon">⌕</span>
      </div>
      <div className="eyebrow" style={{ marginBottom: 18 }}>
        <span className="blue">{"//"}</span> {filtered.length} AUTHORS
      </div>
      {filtered.length === 0 && <p className="portal-empty">没有匹配的作者。</p>}
      <div className="author-grid">
        {shown.map((a) => (
          <Link key={a.name} href={`/authors/${encodeURIComponent(a.name)}`} className="author-card">
            <h3>{a.name}</h3>
            <p>{a.count} 篇</p>
          </Link>
        ))}
      </div>
      {shown.length < filtered.length && (
        <div className="hero-actions" style={{ marginTop: 30 }}>
          <button className="button" onClick={() => setVisible((v) => v + PAGE)}>加载更多 ↓</button>
        </div>
      )}
    </>
  );
}