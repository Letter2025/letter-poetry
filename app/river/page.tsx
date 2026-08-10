import type { Metadata } from "next";
import RiverScene from "@/components/river-scene";

// [LETTER-POETRY-PLAN-013#2] 诗河：三维沉浸页（全屏场景，自带 HUD，无站点导航）
export const metadata: Metadata = {
  title: "诗河",
  description: "把三千年的诗流成一条河：四万七千余首真实诗作化作河灯，从《诗经》源头一路流向明清，可漫游、可拾取、可细读。",
  alternates: { canonical: "/river" },
  openGraph: {
    title: "诗河｜Letter Poetry",
    description: "把三千年的诗流成一条河：四万七千余首真实诗作化作河灯。",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "诗河｜Letter Poetry" }],
  },
};

export default function RiverPage() {
  return <RiverScene />;
}