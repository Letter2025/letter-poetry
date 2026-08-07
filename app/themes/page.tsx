import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { AiCreate } from "@/components/ai-create";
import { getThemes } from "@/lib/poetry";

export const metadata: Metadata = {
  title: "策展",
  description: "四季与主题的诗文策展：春日、秋声、明月、送别、思乡、边塞……",
  openGraph: { title: "策展", description: "四季与主题的诗文策展", type: "website", locale: "zh_CN", images: [{ url: "/og.png", width: 1200, height: 630, alt: "策展" }] },
};

function GroupCard({ slug, name, title, desc, ids }: { slug: string; name: string; title: string; desc: string; ids: string[] }) {
  return (
    <Link href={`/themes/${slug}`} className="curation-card">
      <div className="curation-meta"><span className="curation-name">{name}</span><span className="curation-count">{ids.length} 篇</span></div>
      <h3 className="curation-title">{title}</h3>
      <p className="curation-desc">{desc}</p>
      <span className="portal-arrow">→</span>
    </Link>
  );
}

export default function ThemesPage() {
  const groups = getThemes();
  const seasons = groups.filter((g) => g.kind === "season");
  const themes = groups.filter((g) => g.kind === "theme");
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> CURATION / 策展</div>
          <h1>按季节与主题，<br />重新遇见一首诗。</h1>
          <p>从 47,000+ 篇中精选名篇，按春夏秋冬与经典主题编排——不知道读什么时，从这里开始。</p>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow"><span className="blue">{"//"}</span> SEASONS / 四季</div>
              <h2 className="section-title">四季的节气与光影。</h2>
            </div>
          </div>
          <div className="curation-grid">
            {seasons.map((g) => <GroupCard key={g.slug} {...g} />)}
          </div>
        </section>

        <section className="section" style={{ borderBottom: 0 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow"><span className="blue">{"//"}</span> THEMES / 主题</div>
              <h2 className="section-title">母题与离愁。</h2>
            </div>
          </div>
          <div className="curation-grid">
            {themes.map((g) => <GroupCard key={g.slug} {...g} />)}
          </div>
        </section>

        <section className="section" style={{ borderBottom: 0 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow"><span className="blue">{"//"}</span> AI CREATE / 即兴创作</div>
              <h2 className="section-title">藏头字，<br />或一个主题。</h2>
            </div>
          </div>
          <AiCreate />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}