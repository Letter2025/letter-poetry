"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import type { CollectionMeta, PoemMeta } from "@/lib/types";

const FAV_KEY = "poetry-favorites";

type FavoritesIndex = {
  poems: PoemMeta[];
  collections: CollectionMeta[];
};

export default function FavoritesPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [meta, setMeta] = useState<Record<string, PoemMeta>>({});
  const [colShort, setColShort] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let favs: string[] = [];
    try {
      favs = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    } catch {
      favs = [];
    }
    setIds(favs);
    if (favs.length === 0) {
      setReady(true);
      return;
    }
    // [LETTER-POETRY-PLAN-001#3] 收藏页：拉取元数据索引渲染，避免全量正文
    fetch("/data/index.json")
      .then((r) => r.json())
      .then((idx: FavoritesIndex) => {
        const m: Record<string, PoemMeta> = {};
        for (const p of idx.poems) m[p.id] = p;
        const cs: Record<string, string> = {};
        for (const c of idx.collections) cs[c.key] = c.short;
        setMeta(m);
        setColShort(cs);
        setReady(true);
      });
  }, []);

  const remove = (id: string) => {
    const next = ids.filter((x) => x !== id);
    setIds(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  };

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> FAVORITES / 我的收藏</div>
          <h1>收在案头，<br />随时重读。</h1>
          <p>收藏保存在本机浏览器，共 {ids.length} 篇。换设备或清理浏览器缓存后不会保留。</p>
        </section>
        <section className="section" style={{ borderBottom: 0, minHeight: 280 }}>
          {!ready && <p className="portal-empty">正在读取收藏…</p>}
          {ready && ids.length === 0 && (
            <p className="portal-empty">
              还没有收藏任何诗文。在诗文详情页点击「收藏 ☆」，它们会出现在这里。
            </p>
          )}
          {ready && ids.length > 0 && (
            <div className="poem-list">
              {ids.map((id) => {
                const p = meta[id];
                if (!p) return null;
                return (
                  <div key={id} className="poem-row">
                    <Link href={`/poem/${id}`} className="poem-row-main" style={{ display: "block" }}>
                      <h3>{p.t || "（无题）"}</h3>
                      <p className="poem-row-first">{p.a || "佚名"}</p>
                    </Link>
                    <div className="poem-row-meta">
                      <span className="terminal">{colShort[p.c] ?? p.c}</span>
                      <button className="button dark" onClick={() => remove(id)}>取消收藏</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}