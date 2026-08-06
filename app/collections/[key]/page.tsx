import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionBrowser } from "@/components/collection-browser";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getCollections, getCollection, getIndex } from "@/lib/poetry";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCollections().map((c) => ({ key: c.key }));
}

export function generateMetadata({ params }: { params: { key: string } }): Metadata {
  const col = getCollections().find((x) => x.key === params.key);
  if (!col) return { title: "未找到" };
  return {
    title: col.name,
    description: col.desc,
    openGraph: { title: col.name, description: col.desc, type: "website", locale: "zh_CN" },
  };
}

export default function CollectionPage({ params }: { params: { key: string } }) {
  const col = getCollections().find((x) => x.key === params.key);
  if (!col) notFound();
  const poems = getCollection(col.key);
  const allCount = getIndex().total;

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> COLLECTION / {col.dynasty}</div>
          <h1>{col.name}</h1>
          <p>{col.desc}</p>
          <div className="stats" style={{ marginTop: 24 }}>
            <div className="stat"><strong>{col.count}</strong><span>篇目</span></div>
            <div className="stat"><strong>{col.dynasty}</strong><span>年代</span></div>
            <div className="stat"><strong>{allCount.toLocaleString()}</strong><span>全库篇目</span></div>
          </div>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <CollectionBrowser key={col.key} collectionKey={col.key} name={col.name} poems={poems.map((p) => ({ id: p.id, t: p.t, a: p.a, s: p.s, first: p.p[0] ?? "" }))} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}