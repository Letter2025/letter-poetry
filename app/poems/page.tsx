"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { Highlight } from "@/components/highlight";
import type { CollectionMeta, PoetryIndex } from "@/lib/types";

type ResultItem = { id: string; title: string; author: string; collection: string; text: string; hit?: string };
type ApiResult = { total: number; page: number; size: number; items: ResultItem[] };

const PAGE_SIZE = 50;

function PoemsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const c = params.get("c") ?? "";

  const [cols, setCols] = useState<CollectionMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ResultItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // [LETTER-POETRY-PLAN-002#5] 选集元数据走 Assets 小文件，不打包全量
    fetch("/data/collections-meta.json")
      .then((r) => r.json())
      .then((meta: PoetryIndex) => setCols(meta.collections))
      .catch(() => setCols([]));
  }, []);

  useEffect(() => {
    setInput(q);
  }, [q]);

  const commit = useCallback(
    (nextQ: string, nextC: string) => {
      const sp = new URLSearchParams();
      if (nextQ) sp.set("q", nextQ);
      if (nextC) sp.set("c", nextC);
      const qs = sp.toString();
      router.replace(qs ? `/poems?${qs}` : "/poems", { scroll: false });
    },
    [router]
  );

  const onInput = (v: string) => {
    setInput(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(v, c), 350);
  };

  const load = useCallback(
    async (pageNum: number, qq: string, cc: string, replace = false) => {
      setLoading(true);
      try {
        const sp = new URLSearchParams({ page: String(pageNum), size: String(PAGE_SIZE) });
        if (cc) sp.set("c", cc);
        if (qq) sp.set("q", qq);
        const res = await fetch(`/api/poems?${sp.toString()}`).then((r) => r.json()) as ApiResult;
        setTotal(res.total);
        setPage(res.page);
        setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
      } catch {
        /* keep previous list on failure */
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setItems([]);
    load(1, q, c, true);
  }, [q, c, load]);

  const colName = cols.find((x) => x.key === c)?.short ?? "";

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> SEARCH / 诗文检索</div>
          <h1>检索一首诗，<br />想起一句话。</h1>
          <p>按标题、作者或诗句检索全库；服务端检索，无需下载全量数据。</p>
          <div className="portal-search">
            <input value={input} onChange={(e) => onInput(e.target.value)} placeholder="搜索诗句、标题或作者…" aria-label="搜索诗文" />
            <span className="portal-search-icon">⌕</span>
          </div>
          <div className="portal-cats">
            <button className={`portal-cat ${c === "" ? "active" : ""}`} onClick={() => commit(q, "")}>全部</button>
            {cols.map((col) => (
              <button key={col.key} className={`portal-cat ${c === col.key ? "active" : ""}`} onClick={() => commit(q, col.key)}>
                {col.name}
              </button>
            ))}
          </div>
        </section>

        <section className="section" style={{ minHeight: 320 }}>
          {loading && items.length === 0 && <p className="portal-empty">正在检索…</p>}
          {!loading && items.length === 0 && (
            <p className="portal-empty">没有匹配的结果，换一个关键词试试。</p>
          )}
          {items.length > 0 && (
            <>
              <div className="eyebrow" style={{ marginBottom: 18 }}>
                <span className="blue">{"//"}</span> {total.toLocaleString()} RESULTS
                {colName && <span style={{ color: "var(--cyan)" }}> · {colName}</span>}
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
                      <span className="terminal">{cols.find((x) => x.key === p.collection)?.short ?? p.collection}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {items.length < total && (
                <div className="hero-actions" style={{ marginTop: 30 }}>
                  <button className="button" onClick={() => load(page + 1, q, c)} disabled={loading}>
                    {loading ? "加载中…" : "加载更多 ↓"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export default function PoemsPage() {
  return (
    <Suspense fallback={<div className="shell" style={{ padding: "80px 28px" }}>加载中…</div>}>
      <PoemsClient />
    </Suspense>
  );
}