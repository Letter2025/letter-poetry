import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PoemActions } from "@/components/poem-actions";
import { AnnotatedText } from "@/components/annotated";
import { TtsControl } from "@/components/tts-control";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getCollectionMeta } from "@/lib/poetry";
import { getPoemRow } from "@/lib/db";

// [LETTER-POETRY-PLAN-002#5] 详情页：动态渲染，数据从 D1 按 id 查询（bundle 不再打包全量诗集）
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const row = await getPoemRow(params.id);
  if (!row) return { title: "未找到" };
  const firstLine = row.text.split("\n")[0] ?? "";
  const title = `${row.title} · ${row.author || "佚名"}`;
  const desc = firstLine
    ? `${row.author || "佚名"}《${row.title}》：${firstLine}`
    : `《${row.title}》全文`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "article",
      locale: "zh_CN",
      images: [{ url: `/og/${params.id}`, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function PoemDetailPage({ params }: { params: { id: string } }) {
  const row = await getPoemRow(params.id);
  if (!row) notFound();
  const col = getCollectionMeta(row.collection);
  const lines = row.text.split("\n").filter(Boolean);
  let notes: string[] | undefined;
  try {
    if (row.notes) notes = JSON.parse(row.notes) as string[];
  } catch {
    notes = undefined;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: row.title,
    author: { "@type": "Person", name: row.author || "佚名" },
    inLanguage: "zh-CN",
    text: row.text,
    isPartOf: { "@type": "Book", name: col?.name ?? row.collection },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="shell">
        <section className="detail">
          <div className="detail-meta">
            <span className="eyebrow">
              <span className="blue">{"//"}</span>{" "}
              <Link href={`/collections/${row.collection}`}>{col?.name ?? row.collection}</Link>
            </span>
            <span className="terminal">{row.id}</span>
          </div>
          <h1 className="poem-title">{row.title}</h1>
          <div className="poem-byline">
            <span>{row.author || "佚名"}</span>
            {row.section && <><span className="dot">·</span><span>{row.section}</span></>}
            {row.rhythmic && row.rhythmic !== row.title && (
              <><span className="dot">·</span><span>词牌 {row.rhythmic}</span></>
            )}
          </div>
          <AnnotatedText lines={lines} className="poem-text" lineClass="verse-line" />
          <PoemActions id={row.id} text={row.text} title={`${row.title} · ${row.author || "佚名"}`} />
          <TtsControl text={`${row.title}，${row.author || "佚名"}。${row.text}`} />
          {row.tr && (
            <div className="poem-note">
              <div className="eyebrow"><span className="blue">{"//"}</span> 白话译文</div>
              <p>{row.tr}</p>
            </div>
          )}
          {notes && notes.length > 0 && (
            <div className="poem-note">
              <div className="eyebrow"><span className="blue">{"//"}</span> 注释</div>
              <ul>
                {notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="poem-nav">
            <Link className="button dark" href={`/collections/${row.collection}`}>← {col?.name ?? "所在选集"}</Link>
            <Link className="button" href="/poems">全部诗文</Link>
            <Link className="button dark" href="/authors">作者索引 →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}