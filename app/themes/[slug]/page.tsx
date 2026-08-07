import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getCollections, getTheme } from "@/lib/poetry";
import { searchPoems } from "@/lib/db";

// [LETTER-POETRY-PLAN-009] 策展详情页：按精选 ids 批量查 D1
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = getTheme(params.slug);
  if (!g) return { title: "未找到" };
  return {
    title: `${g.name} · 策展`,
    description: g.desc,
    openGraph: { title: `${g.name} · 策展`, description: g.desc, type: "website", locale: "zh_CN", images: [{ url: "/og.png", width: 1200, height: 630, alt: g.name }] },
  };
}

export default async function ThemePage({ params }: { params: { slug: string } }) {
  const g = getTheme(params.slug);
  if (!g) notFound();
  const res = await searchPoems({ ids: g.ids, size: 100 });
  const colShort = Object.fromEntries(getCollections().map((c) => [c.key, c.short]));

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> {g.kind === "season" ? "SEASON" : "THEME"} / 策展</div>
          <h1>{g.name}</h1>
          <p className="section-summary" style={{ margin: "0 auto", maxWidth: 640 }}>{g.title} · {g.desc}</p>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            <span className="blue">{"//"}</span> {res.items.length} SELECTED
          </div>
          <div className="poem-list">
            {res.items.map((p) => (
              <Link key={p.id} href={`/poem/${p.id}`} className="poem-row">
                <div className="poem-row-main">
                  <h3>{p.title}</h3>
                  <p className="poem-row-first">{p.text.split("\n")[0] ?? ""}</p>
                </div>
                <div className="poem-row-meta">
                  <span>{p.author || "佚名"}</span>
                  <span className="terminal">{colShort[p.collection] ?? p.collection}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="hero-actions" style={{ marginTop: 30 }}>
            <Link className="button" href="/themes">← 全部策展</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}