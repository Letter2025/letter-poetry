import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PoemActions } from "@/components/poem-actions";
import { PoemText } from "@/components/poem-text";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getCollection, getCollections, getIndex, getPoem } from "@/lib/poetry";

export const dynamicParams = false;

export function generateStaticParams() {
  return getIndex().poems.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const poem = getPoem(params.id);
  if (!poem) return { title: "未找到" };
  const firstLine = poem.p[0] ?? "";
  const ogDesc = firstLine ? `${poem.a || "佚名"}《${poem.t}》：${firstLine}${poem.p[1] ? "，" + poem.p[1] : ""}` : `《${poem.t}》全文`;
  return {
    title: `${poem.t} · ${poem.a || "佚名"}`,
    description: ogDesc,
    openGraph: {
      title: `${poem.t} · ${poem.a || "佚名"}`,
      description: ogDesc,
      type: "article",
      locale: "zh_CN",
      // [LETTER-POETRY-PLAN-001#6] 详情页分享卡片图
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${poem.t} · ${poem.a || "佚名"}` }],
    },
  };
}

export default function PoemDetailPage({ params }: { params: { id: string } }) {
  const poem = getPoem(params.id);
  if (!poem) notFound();
  const collections = getCollections();
  const col = collections.find((x) => x.key === poem.c);
  const list = getCollection(poem.c);
  const idx = list.findIndex((x) => x.id === poem.id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: poem.t,
    author: { "@type": "Person", name: poem.a || "佚名" },
    inLanguage: "zh-CN",
    text: poem.p.join("\n"),
    isPartOf: { "@type": "Book", name: col?.name ?? poem.c },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="shell">
        <section className="detail">
          <div className="detail-meta">
            <span className="eyebrow"><span className="blue">{"//"}</span> <Link href={`/collections/${poem.c}`}>{col?.name ?? poem.c}</Link></span>
            <span className="terminal">{poem.id}</span>
          </div>
          <h1 className="poem-title">{poem.t}</h1>
          <div className="poem-byline">
            <span>{poem.a || "佚名"}</span>
            {poem.s && <span className="dot">·</span>}
            {poem.s && <span>{poem.s}</span>}
            {poem.r && poem.r !== poem.t && <><span className="dot">·</span><span>词牌 {poem.r}</span></>}
          </div>
          <PoemText lines={poem.p} className="poem-text" lineClass="verse-line" />
          <PoemActions id={poem.id} text={poem.p.join("\n")} title={`${poem.t} · ${poem.a || "佚名"}`} />
          {poem.tr && (
            <div className="poem-note">
              <div className="eyebrow"><span className="blue">{"//"}</span> 白话译文</div>
              <p>{poem.tr}</p>
            </div>
          )}
          {poem.notes && poem.notes.length > 0 && (
            <div className="poem-note">
              <div className="eyebrow"><span className="blue">{"//"}</span> 注释</div>
              <ul>
                {poem.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="poem-nav">
            {prev ? (
              <Link className="button dark" href={`/poem/${prev.id}`}>← {prev.t}</Link>
            ) : (
              <span />
            )}
            <Link className="button" href="/poems">全部诗文</Link>
            {next ? (
              <Link className="button dark" href={`/poem/${next.id}`}>{next.t} →</Link>
            ) : (
              <span />
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}