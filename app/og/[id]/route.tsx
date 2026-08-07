// [LETTER-POETRY-PLAN-004] 动态 OG 分享卡片图：satori（SVG）+ @resvg/resvg-wasm（PNG，静态导入适配 Workers）
import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasmModule from "@resvg/resvg-wasm/index_bg.wasm?module";
import { getPoemRow } from "@/lib/db";
import { getCollectionMeta } from "@/lib/poetry";

declare module "*.wasm?module" {
  const mod: WebAssembly.Module;
  export default mod;
}

export const dynamic = "force-dynamic";

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.1.0/files/noto-sans-sc-chinese-simplified-400-normal.woff2";

let fontPromise: Promise<ArrayBuffer | null> | null = null;
function loadFont(): Promise<ArrayBuffer | null> {
  if (!fontPromise) {
    fontPromise = fetch(FONT_URL)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
  }
  return fontPromise;
}

// resvg-wasm 静态导入：Workers 禁止动态编译 WASM，必须用编译好的 Module 初始化
let wasmPromise: Promise<void> | null = null;
function ensureWasm(): Promise<void> {
  if (!wasmPromise) wasmPromise = initWasm(resvgWasmModule);
  return wasmPromise;
}

export async function GET(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
  const row = await getPoemRow(params.id);
  if (!row) return new Response("not found", { status: 404 });
  const col = getCollectionMeta(row.collection);
  const lines = row.text.split("\n").filter(Boolean).slice(0, 4);
  const [font] = await Promise.all([loadFont(), ensureWasm()]);

  const svg = await satori(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0d1117",
          color: "#e6edf3",
          padding: "64px 72px",
          fontFamily: font ? "Noto Sans SC" : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#78a9ff", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
          <span>{"//"}</span> LETTER POETRY · 古典诗文档案
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#97a3b3", fontSize: 30 }}>
            <span>{row.author || "佚名"}</span>
            {col && <span style={{ color: "#45c4b0" }}>{col.name}</span>}
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.25, marginTop: 16, color: "#e6edf3" }}>
            {row.title}
          </div>
          {lines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 32, gap: 10, fontSize: 34, lineHeight: 1.7, color: "#c9d1d9" }}>
              {lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#687181", fontSize: 24 }}>
          <span>poetry.myletter.top</span>
          <span>{row.id}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: font ? [{ name: "Noto Sans SC", data: font, weight: 400, style: "normal" }] : [],
    }
  );

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
  } catch (err) {
    console.error("[og] render error", err);
    return new Response("og error: " + (err instanceof Error ? err.message : String(err)), { status: 500 });
  }
}