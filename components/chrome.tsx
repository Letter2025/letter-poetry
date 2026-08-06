"use client";

import Link from "next/link";
import { useState } from "react";

const github = "https://github.com/Letter2025";
const portal = "https://www.myletter.top";

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const toggle = () => {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  const close = () => setMenu(false);
  return (
    <header className="shell">
      <div className="header">
        <Link href="/" className="brand" onClick={close}>
          <img className="brand-mark" src="/favicon-64.png" alt="" />
          <span>LETTER POETRY</span>
          <small>古典诗文档案</small>
        </Link>
        <nav className={`nav ${menu ? "open" : ""}`}>
          <Link href="/" onClick={close}>首页</Link>
          <Link href="/poems" onClick={close}>全部诗文</Link>
          <Link href="/mengxue" onClick={close}>蒙学</Link>
          <a href={portal} target="_blank" rel="noreferrer">门户 ↗</a>
          <a href={github} target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
        <div className="nav-actions">
          <button className="icon-button" aria-label="切换深色模式" onClick={toggle}>◐</button>
          <a className="top-link" href={portal} target="_blank" rel="noreferrer">LETTER NETWORK ↗</a>
          <button className="menu-button" aria-label="打开导航" onClick={() => setMenu(!menu)}>☰</button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="shell footer">
      <div>© 2026 Letter Poetry · 数据来自 chinese-poetry 开源项目，文本以原始古籍为准。</div>
      <div>
        <a href={portal} target="_blank" rel="noreferrer">Letter Network</a>　
        <a href="https://zhouyujun.myletter.top" target="_blank" rel="noreferrer">Field Notes</a>　
        <a href={github} target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </footer>
  );
}