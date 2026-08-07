import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PoemText } from "@/components/poem-text";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getMengxue, getMengxueDoc } from "@/lib/poetry";

export const dynamicParams = false;

export function generateStaticParams() {
  return getMengxue().map((d) => ({ id: d.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const doc = getMengxueDoc(params.id);
  if (!doc) return { title: "未找到" };
  return {
    title: `${doc.title} · ${doc.author}`,
    description: doc.paragraphs[0]?.slice(0, 80) ?? doc.title,
    openGraph: {
      title: `${doc.title} · ${doc.author}`,
      description: "蒙学经典全文",
      type: "article",
      locale: "zh_CN",
      // [LETTER-POETRY-PLAN-001#6] 详情页分享卡片图
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${doc.title} · ${doc.author}` }],
    },
  };
}

export default function MengxueDetailPage({ params }: { params: { id: string } }) {
  const doc = getMengxueDoc(params.id);
  if (!doc) notFound();
  const isGuwen = doc.id.startsWith("guwen-");

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="detail">
          <div className="detail-meta">
            <span className="eyebrow"><span className="blue">{"//"}</span> <Link href="/mengxue">{isGuwen ? "古文观止" : "蒙学经典"}</Link></span>
            <span className="terminal">{doc.id}</span>
          </div>
          <h1 className="poem-title">{doc.title}</h1>
          <div className="poem-byline"><span>{doc.author}</span></div>
          <PoemText lines={doc.paragraphs} className="mengxue-text" />
          <div className="poem-nav">
            <Link className="button" href="/mengxue">← 返回蒙学</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}