# QR Handoff Worker

`qr-handoff` is a Cloudflare Worker that delivers QR code and barcode values scanned on a phone to the Web inbox on a paired PC.

## Local checks

<a id="ローカル確認"></a>

```sh
npm install
npx wrangler d1 migrations apply DB --local
npm run check
npm run dev -- --local
```

Open `http://localhost:8787` in a browser. Local HTTP omits the cookie's `Secure` attribute, while production HTTPS always uses `HttpOnly; Secure; SameSite=Strict`.

## Required production Cloudflare settings

<a id="本番に必要なcloudflare設定"></a>

- Worker name: `qr-handoff`
- D1 binding: `DB`
- D1 ID: `47ec50ec-4820-4bb1-b4fb-dbcba5407978`
- D1 name: assumed to be `qr-handoff-prod`. If the Dashboard shows a different name, update `wrangler.jsonc` before deployment.
- Durable Object binding: `PAIR_DO` (`PairingRoom`)

Always apply production migrations and deploy the Worker in the following order:

```sh
npm run deploy:production
```

Configure Workers Builds so only `main` runs this command. Non-production branches must not apply migrations to production D1.

## DNS and notifications

<a id="dnsと通知"></a>

`qr.snkisk.com` already has DNS records, so this repository does not configure a Custom Domain yet. Check the current use of DNS after the first deployment before connecting it.

An open Web inbox receives new items over a Durable Object WebSocket. Web Push, which also works while the tab is closed, will be added after VAPID keys are registered as Cloudflare secrets. Never commit private keys or tokens to Git.

Edit the Web TypeScript sources described in [web/README.md](web/README.md). Edit `notification-state.ts`, `app.ts`, and `service-worker.ts`; `npm run build:web` performs strict type checking and then generates the matching `public/*.js` files. Type errors prevent the affected project's emit. Tests and Wrangler's custom build also invoke this command. Treat distributed JS as generated output, preserving existing distribution URLs, appearance, interactions, state decisions, and public assets. The custom build configuration is checked against the [official Cloudflare specification](https://developers.cloudflare.com/workers/wrangler/configuration/#custom-builds) and the schema of the Wrangler version in use.

The existing notification-state and Web inbox tests in `test/notification-state.test.ts` and `test/web-receiver.test.ts` undergo strict type checking. `test/web-receiver-fixtures.d.ts` covers only the substitute Cache, Fetch, and notification events used to evaluate the fixed service worker; it is neither a complete browser API implementation nor product input validation. `test/notification-state-contract.d.ts` declares test exports for reading distributed `public/notification-state.js` and preserves handling of ignored extra arguments. The implementation source remains `web/notification-state.ts` above.

## Receiver URL boundaries

<a id="受信画面のurl境界"></a>

Immediately before constructing API/WebSocket URLs, validate stored credentials and link codes in responses against the canonical eight-character uppercase alphabet. Do not apply normalization intended for human input here or reinterpret an invalid path as another valid code. API calls allow only known same-origin paths. The received event's Open action validates and normalizes an absolute HTTP/HTTPS URL and retains that string until the click. Confirmation phrases use rejection sampling to choose uniformly from the existing 30 words. These checks do not replace the Worker's authorization, mutual confirmation, expiration, or revocation.

Creating or recreating a link code immediately shows a pending state and disables both entry points to prevent duplicate activation. Language and theme changes preserve that pending state. Both success and failure restore the controls.
