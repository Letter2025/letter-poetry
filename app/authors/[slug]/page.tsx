import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getAuthor, getAuthors, getCollection, getCollections } from "@/lib/poetry";

export const dynamicParams = false;

export function generateStaticParams() {
  // [LETTER-POETRY-PLAN-001#4] slug 用 encodeURIComponent，规避作者名中的特殊字符
  return getAuthors().map((a) => ({ slug: encodeURIComponent(a.name) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const name = decodeURIComponent(params.slug);
  const author = getAuthor(name);
  if (!author) return { title: "未找到" };
  return {
    title: `${name} · 作品`,
    description: `${name}在 Letter Poetry 中的 ${author.ids.length} 篇作品。`,
    openGraph: {
      title: `${name} · 作品`,
      description: `共 ${author.ids.length} 篇`,
      type: "website",
      locale: "zh_CN",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${name} · 作品` }],
    },
  };
}

export default function AuthorPage({ params }: { params: { slug: string } }) {
  const name = decodeURIComponent(params.slug);
  const author = getAuthor(name);
  if (!author) notFound();
  const colShort = Object.fromEntries(getCollections().map((c) => [c.key, c.short]));
  const rows = author.ids
    .map((id) => {
      const key = id.split("-")[0];
      const poem = getCollection(key).find((x) => x.id === id);
      return poem
        ? { id: poem.id, t: poem.t, a: poem.a, first: poem.p[0] ?? "", short: colShort[poem.c] ?? poem.c }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> AUTHOR / 作者</div>
          <h1>{name}</h1>
          <p>收录 {rows.length} 篇作品。</p>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <div className="poem-list">
            {rows.map((p) => (
              <Link key={p.id} href={`/poem/${p.id}`} className="poem-row">
                <div className="poem-row-main">
                  <h3>{p.t || "（无题）"}</h3>
                  <p className="poem-row-first">{p.first}</p>
                </div>
                <div className="poem-row-meta">
                  <span className="terminal">{p.short}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}