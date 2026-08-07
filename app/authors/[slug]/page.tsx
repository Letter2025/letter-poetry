import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorPoems } from "@/components/author-poems";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getAuthor } from "@/lib/poetry";
import { getAuthorPoems } from "@/lib/db";

// [LETTER-POETRY-PLAN-002#5] 作者页：动态渲染，首屏服务端查 D1，加载更多走 /api/poems?author=
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = params.slug;
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

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const name = params.slug;
  const author = getAuthor(name);
  if (!author) notFound();
  const first = await getAuthorPoems(name, 1, 100);
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> AUTHOR / 作者</div>
          <h1>{name}</h1>
          <p>收录 {author.ids.length} 篇作品。</p>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <AuthorPoems name={name} initial={first.items} total={first.total} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}