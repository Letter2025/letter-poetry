// [LETTER-POETRY-PLAN-001#2] 繁简脚本状态（客户端）
import { useEffect, useState } from "react";

export type Script = "simp" | "trad";

export const SCRIPT_KEY = "poetry-script";
export const SCRIPT_EVENT = "poetry-script-change";

export function getScript(): Script {
  if (typeof window === "undefined") return "simp";
  return localStorage.getItem(SCRIPT_KEY) === "trad" ? "trad" : "simp";
}

export function setScript(s: Script) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SCRIPT_KEY, s);
  document.documentElement.dataset.script = s;
  window.dispatchEvent(new Event(SCRIPT_EVENT));
}

export function toggleScript(): Script {
  const next = getScript() === "simp" ? "trad" : "simp";
  setScript(next);
  return next;
}

export function useScript(): Script {
  const [script, setScriptState] = useState<Script>(getScript);
  useEffect(() => {
    const on = () => setScriptState(getScript());
    window.addEventListener(SCRIPT_EVENT, on);
    return () => window.removeEventListener(SCRIPT_EVENT, on);
  }, []);
  return script;
}