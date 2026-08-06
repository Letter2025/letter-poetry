import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell detail">
      <div className="eyebrow"><span className="blue">{"//"}</span> 404 / NOT FOUND</div>
      <h1 className="poem-title">此篇不在此处。</h1>
      <p className="lede">可能链接有误，或者这篇诗文尚未收录。</p>
      <div className="hero-actions">
        <Link className="button solid" href="/">返回首页 ←</Link>
        <Link className="button" href="/poems">检索诗文</Link>
      </div>
    </main>
  );
}