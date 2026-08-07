import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { StyleQuiz } from "@/components/style-quiz";

export const metadata: Metadata = {
  title: "诗词风格自测",
  description: "5 道小题，让 AI 判定你的诗词风格偏好并推荐适合你的诗。",
  openGraph: { title: "诗词风格自测", description: "5 道小题，判定你的诗词风格", type: "website", locale: "zh_CN", images: [{ url: "/og.png", width: 1200, height: 630, alt: "诗词风格自测" }] },
};

export default function QuizPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="portal-hero">
          <div className="portal-kicker"><span className="blue">{"//"}</span> STYLE QUIZ / 风格自测</div>
          <h1>5 道小题，<br />遇见你的诗风。</h1>
          <p>凭直觉作答，AI 判定你的诗词风格偏好——豪放、婉约、田园还是边塞？再为你推荐几首。</p>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <StyleQuiz />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
