import { describe, expect, it } from "vitest";
import { pairPath, receiverApiPath, safeEventUrl } from "../web/request-boundaries";
import { createConfirmationPhrase } from "../src/protocol";

describe("receiver URL boundaries", () => {
  it("rejects path traversal and noncanonical credentials at every endpoint", () => {
    for (const endpoint of ['status', 'confirm', 'events', 'ack', 'push-subscriptions', 'connector-status', 'connector-link', 'connector-disconnect', 'revoke', 'ws']) {
      expect(pairPath('AB2CDE3F', endpoint)).toBe(`/api/v1/pairs/AB2CDE3F/${endpoint}`);
      for (const code of [undefined, {}, '../../mobile/devices?x=', '%2e%2e', '//evil.test', 'AB2CDE3F/..', 'ab2cde3f', 'AB2CDE3F\n']) expect(() => pairPath(code, endpoint)).toThrow();
    }
    expect(() => pairPath('AB2CDE3F', '../mobile')).toThrow();
    for (const path of ['/api/v1/pairs', '/api/v1/vapid-public-key', '/api/v1/pairs/AB2CDE3F/events?receiver=a%2Fb']) expect(receiverApiPath(path)).toBe(path);
    for (const path of ['https://evil.test', '//evil.test', '/api/v1/pairs/../../mobile/devices?x=/status', '/api/v1/pairs/AB2CDE3F/events?receiver=x&event=y', '/api/v1/pairs/AB2CDE3F/status\n']) expect(() => receiverApiPath(path)).toThrow();
  });
  it("opens only absolute HTTP(S) event URLs", () => {
    expect(safeEventUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(safeEventUrl('http://example.com')).toBe('http://example.com/');
    for (const value of ['javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x', '//example.com', '/path', 'example.com', {}, null]) expect(safeEventUrl(value)).toBeNull();
  });
  it("gives all 30 confirmation words the same accepted byte count", () => {
    const counts = new Map<string, number>();
    for (let byte = 0; byte < 256; byte++) {
      if ((byte & 31) >= 30) continue;
      const phrase = createConfirmationPhrase(new Uint8Array([byte, 0]));
      const word = phrase.split('・')[0];
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
    expect(counts.size).toBe(30);
    expect([...counts.values()]).toEqual(Array(30).fill(8));
    expect(createConfirmationPhrase(new Uint8Array([30, 31, 255, 0, 1]))).toBe('あお・あさ');
  });
});
