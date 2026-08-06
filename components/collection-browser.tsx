"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type Row = { id: string; t: string; a: string; s: string; first: string };

const PAGE = 150;

export function CollectionBrowser({ collectionKey, name, poems }: { collectionKey: string; name: string; poems: Row[] }) {
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(PAGE);
  const filtered = useMemo(() => {
    if (!q) return poems;
    const n = q.trim().toLowerCase();
    return poems.filter((p) => p.t.toLowerCase().includes(n) || p.a.toLowerCase().includes(n) || p.first.toLowerCase().includes(n));
  }, [poems, q]);
  const pageList = filtered.slice(0, visible);

  return (
    <>
      <div className="portal-search" style={{ marginBottom: 26 }}>
        <input value={q} onChange={(e) => { setQ(e.target.value); setVisible(PAGE); }} placeholder={`在《${name}》中检索…`} aria-label={`检索${name}`} />
        <span className="portal-search-icon">⌕</span>
      </div>
      <div className="poem-list">
        {pageList.map((p) => (
          <Link key={p.id} href={`/poem/${p.id}`} className="poem-row">
            <div className="poem-row-main">
              <h3>{p.t || "（无题）"}</h3>
              <p className="poem-row-first">{p.first}</p>
            </div>
            <div className="poem-row-meta">
              <span>{p.a || "佚名"}</span>
              {p.s && <span className="terminal">{p.s}</span>}
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="portal-empty">没有匹配的篇目。</p>}
      {pageList.length < filtered.length && (
        <div className="hero-actions" style={{ marginTop: 30 }}>
          <button className="button" onClick={() => setVisible((v) => v + PAGE)}>加载更多 ↓</button>
        </div>
      )}
    </>
  );
}