"use client";

import { toggleScript, useScript } from "@/lib/script";

// [LETTER-POETRY-PLAN-001#2] 繁简切换按钮：当前为简体显示「繁」（点击转繁体），反之亦然
export function ScriptToggle() {
  const script = useScript();
  const trad = script === "trad";
  return (
    <button
      className="icon-button"
      aria-label={trad ? "切换为简体" : "切换为繁体"}
      title={trad ? "切换为简体" : "切换为繁体"}
      onClick={() => toggleScript()}
    >
      {trad ? "繁" : "简"}
    </button>
  );
}