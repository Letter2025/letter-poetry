"use client";

import Link from "next/link";
import { Highlight } from "@/components/highlight";
import { useCallback, useEffect, useState } from "react";

type Row = { id: string; title: string; author: string; text: string; hit?: string };
type ApiResult = { total: number; page: number; size: number; items: Row[] };

const PAGE_SIZE = 50;

// [LETTER-POETRY-PLAN-002#5] 选集浏览：客户端分页调 /api/poems?c=，不再打包整集 JSON
export function CollectionBrowser({ collectionKey, name }: { collectionKey: string; name: string }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (pageNum: number, qq: string, replace: boolean) => {
      setLoading(true);
      try {
        const sp = new URLSearchParams({ c: collectionKey, page: String(pageNum), size: String(PAGE_SIZE) });
        if (qq) sp.set("q", qq);
        const res = await fetch(`/api/poems?${sp.toString()}`).then((r) => r.json()) as ApiResult;
        setTotal(res.total);
        setPage(res.page);
        setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
      } catch {
        /* keep previous */
      } finally {
        setLoading(false);
      }
    },
    [collectionKey]
  );

  useEffect(() => {
    setItems([]);
    load(1, "", true);
  }, [collectionKey, load]);

  return (
    <>
      <div className="portal-search" style={{ marginBottom: 26 }}>
        <input
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setItems([]);
            load(1, v, true);
          }}
          placeholder={`在《${name}》中检索…`}
          aria-label={`检索${name}`}
        />
        <span className="portal-search-icon">⌕</span>
      </div>
      <div className="eyebrow" style={{ marginBottom: 18 }}>
        <span className="blue">{"//"}</span> {total.toLocaleString()} RESULTS
      </div>
      <div className="poem-list">
        {items.map((p) => (
          <Link key={p.id} href={`/poem/${p.id}`} className="poem-row">
            <div className="poem-row-main">
              <h3>{p.title || "（无题）"}</h3>
              <p className="poem-row-first">{p.hit ? <Highlight text={p.hit} q={q} /> : (p.text.split("\n")[0] ?? "")}</p>
            </div>
            <div className="poem-row-meta">
              <span>{p.author || "佚名"}</span>
              <span className="terminal">{p.id}</span>
            </div>
          </Link>
        ))}
      </div>
      {!loading && items.length === 0 && <p className="portal-empty">没有匹配的篇目。</p>}
      {items.length < total && (
        <div className="hero-actions" style={{ marginTop: 30 }}>
          <button className="button" onClick={() => load(page + 1, q, false)} disabled={loading}>
            {loading ? "加载中…" : "加载更多 ↓"}
          </button>
        </div>
      )}
    </>
  );
}