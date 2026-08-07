import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://poetry.myletter.top";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Letter Poetry｜古典诗文档案", template: "%s｜Letter Poetry" },
  description: "Letter Poetry 古典诗文档案：唐诗三百首、宋词三百首、诗经、楚辞、元曲、花间集、纳兰性德与蒙学经典，可检索、可细读、可收藏的在线诗文集。",
  keywords: ["Letter Poetry", "诗词", "唐诗三百首", "宋词三百首", "诗经", "楚辞", "元曲", "古诗文", "在线诗词"],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/favicon.ico", sizes: "16x16 32x32 48x48" }, { url: "/favicon-64.png", type: "image/png", sizes: "64x64" }], apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Letter Poetry", statusBarStyle: "default" },
  openGraph: {
    title: "Letter Poetry｜古典诗文档案",
    description: "唐诗、宋词、诗经、楚辞与蒙学经典的在线诗文集",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Letter Poetry｜古典诗文档案" }],
  },
  twitter: { card: "summary_large_image", title: "Letter Poetry｜古典诗文档案", description: "唐诗宋词诗经楚辞的在线诗文集", images: ["/og.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#175cd3",
};

// [LETTER-POETRY-PLAN-001#2/6] 首屏同步初始化深色模式与繁简脚本，避免闪烁
const themeScript = `try{var t=localStorage.getItem("theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}try{var s=localStorage.getItem("poetry-script");document.documentElement.dataset.script=s||"simp"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script defer src="https://letter-analytics.zhouyujun-work.workers.dev/a.js"></script>
        {children}
      </body>
    </html>
  );
}