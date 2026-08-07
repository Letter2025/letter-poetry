"use client";

import { useMemo, useState } from "react";
import * as OpenCC from "opencc-js";
import { pinyin } from "pinyin-pro";
import { useScript } from "@/lib/script";

// [LETTER-POETRY-PLAN-008] 拼音注音：全文注音模式（ruby）+ 悬停拼音（title）+ 点击发声（SpeechSynthesis）
const toTrad = OpenCC.Converter({ from: "cn", to: "t" });

type Char = { ch: string; py: string; isCjk: boolean };

function analyze(text: string, trad: boolean): Char[] {
  const disp = trad ? toTrad(text) : text;
  const arr = pinyin(disp, { type: "array", toneType: "symbol" });
  return Array.from(disp).map((ch, i) => ({
    ch,
    py: typeof arr[i] === "string" ? arr[i] : "",
    isCjk: /[\u4e00-\u9fff]/.test(ch),
  }));
}

export function AnnotatedText({ lines, className, lineClass }: { lines: string[]; className?: string; lineClass?: string }) {
  const script = useScript();
  const trad = script === "trad";
  const [pinyinMode, setPinyinMode] = useState(false);
  const rows = useMemo(() => lines.map((l) => analyze(l, trad)), [lines, trad]);

  const speakChar = (ch: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(ch);
    u.lang = "zh-CN";
    window.speechSynthesis.speak(u);
  };

  return (
    <>
      <div className="annot-bar">
        <button className="button" onClick={() => setPinyinMode((v) => !v)} aria-pressed={pinyinMode}>
          {pinyinMode ? "关闭注音" : "全文注音"}
        </button>
      </div>
      <div className={className} lang={trad ? "zh-Hant" : "zh-Hans"}>
        {rows.map((chars, li) => (
          <p key={li} className={lineClass}>
            {chars.map((c, ci) => {
              if (!c.isCjk) return c.ch;
              if (pinyinMode) {
                return (
                  <ruby key={ci}>{c.ch}<rt>{c.py}</rt></ruby>
                );
              }
              return (
                <span key={ci} className="annot-char" title={c.py} onClick={() => speakChar(c.ch)}>
                  {c.ch}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </>
  );
}