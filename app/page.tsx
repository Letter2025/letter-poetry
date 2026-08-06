import Link from "next/link";
import { DailyPoem } from "@/components/daily-poem";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getIndex, getMengxue, getPoem } from "@/lib/poetry";

export default function Home() {
  const index = getIndex();
  const mengxue = getMengxue();
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const dailyMeta = index.poems[seed % index.poems.length];
  const daily = getPoem(dailyMeta.id) ?? {
    id: dailyMeta.id,
    t: dailyMeta.t,
    a: dailyMeta.a,
    c: dailyMeta.c,
    r: dailyMeta.r,
    s: dailyMeta.s,
    p: ["……"],
  };
  const guwenCount = mengxue.filter((d) => d.id.startsWith("guwen-")).length;
  const classics = mengxue.filter((d) => !d.id.startsWith("guwen-"));

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> POETRY ARCHIVE / 诗文档案</div>
          <h1>把古典诗文，<br />读进日常。</h1>
          <p>唐诗、宋词、诗经、楚辞、元曲与蒙学经典，从一个入口抵达。可以检索、可以细读、可以收藏的在线诗文集。</p>
          <form className="portal-search" action="/poems" role="search">
            <input name="q" placeholder="搜索诗句、标题或作者，如「明月」「李白」「春晓」…" aria-label="搜索诗文" />
            <span className="portal-search-icon">⌕</span>
          </form>
          <div className="stats" style={{ marginTop: 30 }}>
            <div className="stat"><strong>{index.collections.length}</strong><span>诗文选集</span></div>
            <div className="stat"><strong>{index.total.toLocaleString()}</strong><span>篇目</span></div>
            <div className="stat"><strong>{mengxue.length.toLocaleString()}</strong><span>蒙学篇目</span></div>
          </div>
        </section>

        <section className="section">
          <DailyPoem initial={daily} />
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow"><span className="blue">{"//"}</span> COLLECTIONS / 诗文选集</div>
              <h2 className="section-title">十二部选集，<br />从源头读起。</h2>
            </div>
            <Link className="button" href="/poems">全部诗文 →</Link>
          </div>
          <div className="portal-grid">
            {index.collections.map((c, i) => (
              <Link key={c.key} href={`/collections/${c.key}`} className="portal-card">
                <div className="portal-body">
                  <div className="portal-meta">
                    <span className="portal-cat-name">{String(i + 1).padStart(2, "0")} / {c.dynasty}</span>
                    <span className="portal-status">{c.count} 篇</span>
                  </div>
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                  <div className="tags"><span className="tag">{c.short}</span></div>
                </div>
                <span className="portal-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section" style={{ borderBottom: 0 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow"><span className="blue">{"//"}</span> MENGXUE / 蒙学经典</div>
              <h2 className="section-title">开蒙读物，<br />历代童蒙的起点。</h2>
            </div>
            <Link className="button" href="/mengxue">进入蒙学 →</Link>
          </div>
          <div className="meng-grid">
            {classics.slice(0, 8).map((d) => (
              <Link key={d.id} href={`/mengxue/${d.id}`} className="meng-card">
                <h3>{d.title}</h3>
                <p>{d.author}</p>
              </Link>
            ))}
            <Link href="/mengxue" className="meng-card meng-more">
              <h3>古文观止 · {guwenCount} 篇</h3>
              <p>历代散文名篇 →</p>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}