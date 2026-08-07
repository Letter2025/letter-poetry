"use client";

import Link from "next/link";
import { useState } from "react";

type Row = { id: string; title: string; author: string; collection: string; text: string };
type ApiResult = { total: number; page: number; size: number; items: Row[] };

const PAGE_SIZE = 100;

// [LETTER-POETRY-PLAN-002#5] 作者作品列表：首屏服务端注入，加载更多调 API
export function AuthorPoems({ name, initial, total }: { name: string; initial: Row[]; total: number }) {
  const [items, setItems] = useState<Row[]>(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const sp = new URLSearchParams({ author: name, page: String(page + 1), size: String(PAGE_SIZE) });
      const res = await fetch(`/api/poems?${sp.toString()}`).then((r) => r.json()) as ApiResult;
      setPage(res.page);
      setItems((prev) => [...prev, ...res.items]);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 18 }}>
        <span className="blue">{"//"}</span> {total.toLocaleString()} WORKS
      </div>
      <div className="poem-list">
        {items.map((p) => (
          <Link key={p.id} href={`/poem/${p.id}`} className="poem-row">
            <div className="poem-row-main">
              <h3>{p.title || "（无题）"}</h3>
              <p className="poem-row-first">{p.text.split("\n")[0] ?? ""}</p>
            </div>
            <div className="poem-row-meta">
              <span className="terminal">{p.id}</span>
            </div>
          </Link>
        ))}
      </div>
      {items.length < total && (
        <div className="hero-actions" style={{ marginTop: 30 }}>
          <button className="button" onClick={loadMore} disabled={loading}>
            {loading ? "加载中…" : "加载更多 ↓"}
          </button>
        </div>
      )}
    </>
  );
}