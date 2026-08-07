import type { Metadata } from "next";
import { AuthorBrowser } from "@/components/author-browser";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getAuthors, getIndex } from "@/lib/poetry";

export const metadata: Metadata = {
  title: "作者索引",
  description: "按作者浏览 Letter Poetry 收录的全部诗人、词人与文人。",
  openGraph: { title: "作者索引", description: "按作者浏览全部诗文", type: "website", locale: "zh_CN", images: [{ url: "/og.png", width: 1200, height: 630, alt: "作者索引" }] },
};

export default function AuthorsPage() {
  const authors = getAuthors();
  const index = getIndex();
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> AUTHORS / 作者索引</div>
          <h1>从人读起，<br />顺着笔迹找诗。</h1>
          <p>按作者浏览 {authors.length} 位诗人、词人与文人，覆盖全库 {index.total.toLocaleString()} 篇诗文。</p>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <AuthorBrowser authors={authors.map((a) => ({ name: a.name, count: a.ids.length }))} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}