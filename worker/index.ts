/** Cloudflare Worker entry point for the Letter Poetry archive. */
import handler from "vinext/server/app-router-entry";

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// [LETTER-POETRY-PLAN-003#1] 页面边缘缓存：Cloudflare 默认不缓存 Worker 响应，需用 Cache API 显式缓存。
// 仅缓存页面 HTML（非 RSC 请求）；API 由 route handler 自控（no-store/短缓存）。
const PAGE_CC = "public, max-age=3600, s-maxage=86400";
const PAGE_PREFIXES = ["/poem/", "/collections/", "/authors", "/mengxue", "/poems", "/favorites"];

function isPage(pathname: string): boolean {
  return pathname === "/" || PAGE_PREFIXES.some((p) => pathname.startsWith(p));
}

const worker = {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const accept = request.headers.get("Accept") ?? "";
      // RSC 导航请求（text/x-component）不缓存，避免缓存错变体
      if (isPage(url.pathname) && !accept.includes("text/x-component")) {
        const cache = caches.default;
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await handler.fetch(request, env, ctx);
        if (res.status === 200) {
          const out = new Response(res.body, res);
          out.headers.set("Cache-Control", PAGE_CC);
          const store = out.clone();
          store.headers.set("Cache-Control", PAGE_CC);
          ctx.waitUntil(cache.put(request, store));
          return out;
        }
        return res;
      }
    }
    return handler.fetch(request, env, ctx);
  },
};

export default worker;