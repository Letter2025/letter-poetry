import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionBrowser } from "@/components/collection-browser";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getCollectionMeta } from "@/lib/poetry";

// [LETTER-POETRY-PLAN-002#5] 选集页：元数据走 bundle（服务端），诗目列表走 /api/poems 分页（客户端）
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { key: string } }): Promise<Metadata> {
  const col = getCollectionMeta(params.key);
  if (!col) return { title: "未找到" };
  return {
    title: col.name,
    description: col.desc,
    openGraph: { title: col.name, description: col.desc, type: "website", locale: "zh_CN", images: [{ url: "/og.png", width: 1200, height: 630, alt: col.name }] },
  };
}

export default function CollectionPage({ params }: { params: { key: string } }) {
  const col = getCollectionMeta(params.key);
  if (!col) notFound();
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> {col.dynasty} / 选集</div>
          <h1>{col.name}</h1>
          <p>{col.desc}</p>
          <div className="stats" style={{ marginTop: 26 }}>
            <div className="stat"><strong>{col.count.toLocaleString()}</strong><span>篇目</span></div>
          </div>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <CollectionBrowser key={col.key} collectionKey={col.key} name={col.name} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}