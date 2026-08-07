import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { getMengxue } from "@/lib/poetry";
import type { MengxueDoc } from "@/lib/types";

export default function MengxuePage() {
  const docs = getMengxue();
  const classics = docs.filter((d) => !d.id.startsWith("guwen-"));
  const guwen = docs.filter((d) => d.id.startsWith("guwen-"));

  // [LETTER-POETRY-PLAN-001#7] 古文观止按卷分组（数据源卷名如「卷一・周文」）
  const groups = guwen.reduce<{ section: string; docs: MengxueDoc[] }[]>((acc, d) => {
    const sec = d.section || "古文观止";
    let g = acc.find((x) => x.section === sec);
    if (!g) {
      g = { section: sec, docs: [] };
      acc.push(g);
    }
    g.docs.push(d);
    return acc;
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> MENGXUE / 蒙学经典</div>
          <h1>开蒙读物，<br />历代童蒙的起点。</h1>
          <p>三字经、百家姓、千字文、声律启蒙与古文观止，共 {docs.length} 篇。识字、对仗、格言与文章，从这里开始。</p>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow"><span className="blue">{"//"}</span> 蒙学启蒙</div>
              <h2 className="section-title">童蒙读物</h2>
            </div>
          </div>
          <div className="poem-list">
            {classics.map((d) => (
              <Link key={d.id} href={`/mengxue/${d.id}`} className="poem-row">
                <div className="poem-row-main">
                  <h3>{d.title}</h3>
                  <p className="poem-row-first">{d.paragraphs[0] ?? ""}</p>
                </div>
                <div className="poem-row-meta">
                  <span>{d.author}</span>
                  <span className="terminal">{d.paragraphs.length} 段</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section" style={{ borderBottom: 0 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow"><span className="blue">{"//"}</span> 文章选本</div>
              <h2 className="section-title">古文观止 · {guwen.length} 篇</h2>
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.section} style={{ marginBottom: 30 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}><span className="blue">{"//"}</span> {g.section}</div>
              <div className="poem-list">
                {g.docs.map((d) => (
                  <Link key={d.id} href={`/mengxue/${d.id}`} className="poem-row">
                    <div className="poem-row-main">
                      <h3>{d.title}</h3>
                      <p className="poem-row-first">{d.paragraphs[0]?.slice(0, 42) ?? ""}</p>
                    </div>
                    <div className="poem-row-meta">
                      <span>{d.author}</span>
                      <span className="terminal">古文观止</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}