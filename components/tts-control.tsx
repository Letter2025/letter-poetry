"use client";

import { useEffect, useRef, useState } from "react";

// [LETTER-POETRY-PLAN-007] 浏览器 TTS 朗读：中文语音 + 分段 + 播放/暂停/停止/语速

// 按行/标点切分为 ≤200 字符片段（规避浏览器单条 utterance 长度限制）
export function splitText(text: string): string[] {
  const segs = text
    .split(/\n+/)
    .flatMap((line) => line.match(/[^。！？；：，、\s]+[。！？；：，、]?/g) ?? (line ? [line] : []));
  const chunks: string[] = [];
  let cur = "";
  for (const s of segs) {
    if (!s) continue;
    if ((cur + s).length > 200) {
      if (cur) chunks.push(cur);
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export function TtsControl({ text, compact = false }: { text: string; compact?: boolean }) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const textRef = useRef(text);
  const rateRef = useRef(rate);

  useEffect(() => {
    textRef.current = text;
  }, [text]);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  // 异步加载系统语音列表（部分浏览器 onvoiceschanged）
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.getVoices();
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = onVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  // 组件卸载时停止
  useEffect(() => {
    if (!supported) return;
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  // 轮询结束状态（多 utterance 队列结束后置回）
  useEffect(() => {
    if (!supported || !speaking) return;
    const id = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        setSpeaking(false);
        setPaused(false);
      }
    }, 500);
    return () => clearInterval(id);
  }, [supported, speaking]);

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  const speak = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const zh = voices.find((v) => v.lang.toLowerCase().startsWith("zh"));
    for (const chunk of splitText(textRef.current)) {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = zh?.lang ?? "zh-CN";
      if (zh) u.voice = zh;
      u.rate = rateRef.current;
      synth.speak(u);
    }
    setSpeaking(true);
    setPaused(false);
  };

  const togglePause = () => {
    if (!supported) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  if (!supported) return null;

  if (compact) {
    return (
      <div className="tts-control tts-compact">
        <button className="button" onClick={speak} disabled={speaking} title="朗读">听诗 ▶</button>
        <button className="button dark" onClick={stop} disabled={!speaking} title="停止">停止</button>
      </div>
    );
  }

  return (
    <div className="tts-control">
      <button className="button" onClick={speak} disabled={speaking} title="朗读">朗读 ▶</button>
      <button className="button" onClick={togglePause} disabled={!speaking} title={paused ? "继续" : "暂停"}>
        {paused ? "继续" : "暂停"}
      </button>
      <button className="button dark" onClick={stop} disabled={!speaking} title="停止">停止</button>
      <select
        className="tts-rate"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        aria-label="朗读语速"
        disabled={speaking}
      >
        <option value={0.8}>慢速</option>
        <option value={1}>正常</option>
        <option value={1.2}>快速</option>
      </select>
    </div>
  );
}