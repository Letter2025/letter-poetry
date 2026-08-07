"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import type { CollectionMeta, Poem, PoemMeta, PoetryIndex } from "@/lib/types";

const PAGE = 120;

let indexPromise: Promise<PoetryIndex> | null = null;
let allPromise: Promise<Poem[]> | null = null;
function getIndexData() {
  if (!indexPromise) indexPromise = fetch("/data/index.json").then((r) => r.json());
  return indexPromise;
}
// [LETTER-POETRY-PLAN-001#5] 全文检索改拉构建期生成的 full.json（单请求精简全集，替代 12 个 collection 并发拉取）
async function getAllPoems() {
  if (!allPromise) {
    allPromise = fetch("/data/full.json").then((r) => r.json());
  }
  return allPromise;
}

function PoemsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const c = params.get("c") ?? "";

  const [index, setIndex] = useState<PoetryIndex | null>(null);
  const [full, setFull] = useState<Poem[] | null>(null);
  const [fullSearched, setFullSearched] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [searchingFull, setSearchingFull] = useState(false);
  const [input, setInput] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getIndexData().then(setIndex);
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

  const collectionName = useMemo(() => {
    if (!index) return "";
    return index.collections.find((x) => x.key === c)?.name ?? "";
  }, [index, c]);

  const filtered = useMemo(() => {
    if (!index) return null;
    let list: PoemMeta[] = index.poems;
    if (c) list = list.filter((p) => p.c === c);
    if (q) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.t.toLowerCase().includes(needle) ||
          p.a.toLowerCase().includes(needle) ||
          p.s.toLowerCase().includes(needle) ||
          p.r.toLowerCase().includes(needle)
      );
    }
    return list;
  }, [index, q, c]);

  useEffect(() => {
    if (!index || !q || fullSearched) return;
    if (filtered && filtered.length > 0) return;
    let cancelled = false;
    setSearchingFull(true);
    getAllPoems()
      .then((all) => {
        if (cancelled) return;
        const needle = q.trim().toLowerCase();
        const hits = all.filter(
          (p) =>
            p.p.some((line) => line.toLowerCase().includes(needle)) ||
            p.t.toLowerCase().includes(needle) ||
            p.a.toLowerCase().includes(needle)
        );
        setFull(hits);
        setFullSearched(true);
      })
      .finally(() => !cancelled && setSearchingFull(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, q, filtered]);

  const shown = (fullSearched ? full : filtered) ?? [];
  const pageList = shown.slice(0, visible);
  const loading = !index || (q && searchingFull);

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> SEARCH / 诗文检索</div>
          <h1>检索一首诗，<br />想起一句话。</h1>
          <p>按标题、作者或诗句检索全部 {index?.total.toLocaleString() ?? "……"} 篇诗文；标题无匹配时自动进入全文检索。</p>
          <div className="portal-search">
            <input value={input} onChange={(e) => onInput(e.target.value)} placeholder="搜索诗句、标题或作者…" aria-label="搜索诗文" />
            <span className="portal-search-icon">⌕</span>
          </div>
          <div className="portal-cats">
            <button className={`portal-cat ${c === "" ? "active" : ""}`} onClick={() => commit(q, "")}>全部</button>
            {index?.collections.map((col) => (
              <button key={col.key} className={`portal-cat ${c === col.key ? "active" : ""}`} onClick={() => commit(q, col.key)}>
                {col.name}
              </button>
            ))}
          </div>
        </section>

        <section className="section" style={{ minHeight: 320 }}>
          {loading && <p className="portal-empty">正在检索…</p>}
          {!loading && shown.length === 0 && (
            <p className="portal-empty">没有匹配的结果，换一个关键词试试。</p>
          )}
          {!loading && shown.length > 0 && (
            <>
              <div className="eyebrow" style={{ marginBottom: 18 }}>
                <span className="blue">{"//"}</span> {shown.length} RESULTS
                {fullSearched && <span style={{ color: "var(--cyan)" }}> · 全文检索</span>}
              </div>
              <div className="poem-list">
                {pageList.map((p) => (
                  <Link key={p.id} href={`/poem/${p.id}`} className="poem-row">
                    <div className="poem-row-main">
                      <h3>{p.t || "（无题）"}</h3>
                      <p className="poem-row-first">{"p" in p && (p as Poem).p?.[0] ? (p as Poem).p[0] : ""}</p>
                    </div>
                    <div className="poem-row-meta">
                      <span>{p.a || "佚名"}</span>
                      <span className="terminal">{index?.collections.find((x) => x.key === p.c)?.short ?? p.c}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {pageList.length < shown.length && (
                <div className="hero-actions" style={{ marginTop: 30 }}>
                  <button className="button" onClick={() => setVisible((v) => v + PAGE)}>加载更多 ↓</button>
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