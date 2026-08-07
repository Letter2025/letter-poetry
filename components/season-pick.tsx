"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// [LETTER-POETRY-PLAN-009] 首页当季推荐：按月份选季节策展，展示 3 首精选
function seasonForMonth(m: number): string {
  if (m >= 3 && m <= 5) return "season-spring";
  if (m >= 6 && m <= 8) return "season-summer";
  if (m >= 9 && m <= 11) return "season-autumn";
  return "season-winter";
}

type Row = { id: string; title: string; author: string; text: string };
type ApiResult = { items: Row[] };

export function SeasonPick() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [slug, setSlug] = useState("");
  const [items, setItems] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const ym = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" }).split("-");
        const s = seasonForMonth(Number(ym[1]));
        const meta = await fetch("/data/themes.json").then((r) => r.json());
        const g = meta.groups.find((x: { slug: string }) => x.slug === s);
        if (!g) return;
        setName(g.name);
        setDesc(g.desc);
        setSlug(g.slug);
        const ids = g.ids.slice(0, 3).join(",");
        const res = await fetch(`/api/poems?ids=${encodeURIComponent(ids)}&size=3`).then((r) => r.json()) as ApiResult;
        setItems(res.items ?? []);
      } catch {
        /* keep empty */
      }
    })();
  }, []);

  if (!name) return null;
  return (
    <div className="season-pick">
      <div className="season-head">
        <div className="eyebrow"><span className="blue">{"//"}</span> 当季策展 · {name}</div>
        {slug && <Link className="button" href={`/themes/${slug}`}>浏览全部 →</Link>}
      </div>
      <p className="season-desc">{desc}</p>
      <div className="season-lines">
        {items.map((p) => (
          <Link key={p.id} href={`/poem/${p.id}`} className="season-line">
            <span className="season-title">{p.title}</span>
            <span className="season-author">{p.author || "佚名"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}