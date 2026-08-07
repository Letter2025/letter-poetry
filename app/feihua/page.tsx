import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { Feihua } from "@/components/feihua";

export const metadata: Metadata = {
  title: "AI 飞花令",
  description: "你出字，AI 接句——与古典诗词来一场飞花令。",
  openGraph: { title: "AI 飞花令", description: "你出字，AI 接句", type: "website", locale: "zh_CN", images: [{ url: "/og.png", width: 1200, height: 630, alt: "AI 飞花令" }] },
};

export default function FeihuaPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> AI FEIHUA / 飞花令</div>
          <h1>你出字，<br />AI 接句。</h1>
          <p>出一个字，AI 接 3-5 句含该字的经典诗句并注明出处；可以连续出字，多轮对诗。</p>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <Feihua />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
