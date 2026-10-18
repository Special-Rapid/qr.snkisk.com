// 保存済みcredentialもサーバー応答もURLへ組み込む直前に検証する。
export function isCanonicalPairCode(code: unknown): code is string {
  return typeof code === "string" && /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}(?![\s\S])/.test(code);
}
export function pairPath(code: unknown, endpoint: string): string {
  if (!isCanonicalPairCode(code)) throw new Error("Invalid pair code");
  if (!/^(?:status|confirm|events|ack|push-subscriptions|connector-status|connector-link|connector-disconnect|revoke|ws)(?![\s\S])/.test(endpoint)) throw new Error("Invalid pair endpoint");
  return `/api/v1/pairs/${encodeURIComponent(code)}/${endpoint}`;
}

export function receiverApiPath(path: string): string {
  if (path === "/api/v1/pairs" || path === "/api/v1/vapid-public-key") return path;
  if (!/^\/api\/v1\/pairs\/[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}\/(?:status|confirm|events|ack|push-subscriptions|connector-status|connector-link|connector-disconnect|revoke)(?:\?receiver=[A-Za-z0-9%_.!~*'()-]*)?(?![\s\S])/.test(path)) throw new Error("Invalid receiver API path");
  return path;
}

export function safeEventUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}
