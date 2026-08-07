/** Cloudflare Worker entry point for the Letter Poetry archive. */
import handler from "vinext/server/app-router-entry";

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// [LETTER-POETRY-PLAN-003#1] CDN 边缘缓存策略：详情页/页面长缓存，列表/搜索 API 短缓存，随机不缓存
// 站点无用户系统与个性化内容，页面可安全缓存；命中后不进 Worker、不查 D1。
function cacheControlFor(pathname: string): string | null {
  if (
    pathname === "/" ||
    pathname.startsWith("/poem/") ||
    pathname.startsWith("/collections/") ||
    pathname.startsWith("/authors") ||
    pathname.startsWith("/mengxue") ||
    pathname.startsWith("/poems") ||
    pathname.startsWith("/favorites")
  ) {
    return "public, max-age=3600, s-maxage=86400";
  }
  if (pathname.startsWith("/api/poem/random")) {
    return "no-store";
  }
  if (pathname.startsWith("/api/")) {
    return "public, max-age=60, s-maxage=300";
  }
  return null;
}

const worker = {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext): Promise<Response> {
    const res = await handler.fetch(request, env, ctx);
    if (request.method !== "GET" || res.status !== 200) return res;
    const cc = cacheControlFor(new URL(request.url).pathname);
    if (!cc) return res;
    const cached = new Response(res.body, res);
    cached.headers.set("Cache-Control", cc);
    return cached;
  },
};

export default worker;