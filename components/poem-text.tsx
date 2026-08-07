"use client";

import { useMemo } from "react";
import * as OpenCC from "opencc-js";
import { useScript } from "@/lib/script";

// [LETTER-POETRY-PLAN-001#2] 简体 → 繁体转换器（模块级缓存，opencc 质量优于 chinese-conv 的 tify）
const toTrad = OpenCC.Converter({ from: "cn", to: "t" });

// [LETTER-POETRY-PLAN-001#2] 正文渲染：按当前繁简脚本转换文本并设置正确 lang（数据本身为简体）
export function PoemText({
  lines,
  className,
  lineClass,
}: {
  lines: string[];
  className?: string;
  lineClass?: string;
}) {
  const script = useScript();
  const trad = script === "trad";
  const display = useMemo(
    () => (trad ? lines.map((l) => toTrad(l)) : lines),
    [lines, trad]
  );
  return (
    <div className={className} lang={trad ? "zh-Hant" : "zh-Hans"}>
      {display.map((line, i) => (
        <p key={i} className={lineClass}>{line}</p>
      ))}
    </div>
  );
}