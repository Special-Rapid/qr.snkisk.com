# Web TypeScript sources

<a id="webのtypescript編集元"></a>

`notification-state.ts` currently determines notification permission states. It accepts permission as unknown and returns states created by this module after the existing comparison with granted. It adds neither input validation nor language switching.

Running `npm run build:web` in `apps/handoff` performs strict type checking with `tsconfig.web.json` and generates `public/notification-state.js`. Type errors prevent emit. Tests and Wrangler's custom build perform the same generation. Browsers require JavaScript, so distributed JS is tracked as small generated output; the TypeScript in this folder is the editing source. Do not edit generated files directly. After all checks, CI verifies that this distributed JS has no Git diff, rejecting divergence between source and tracked output.

`app.ts` also generates `public/app.js` after strict type checking. The browser import of `/notification-state.js` is preserved and resolves to the same TypeScript source only during type checking. Preserve distribution URLs and existing public assets; do not serve this source folder or private materials as assets.

Web type errors at the start of this command fail the local build in `deploy:production` before DB migration or Worker deployment is reached. This assumes build → existing migration → existing deployment in a fixed checkout; it adds neither ACID across the DB and publication nor rollback on remote failure.

`service-worker.ts` generates the same `public/service-worker.js` using WebWorker types and strict checks in `tsconfig.worker.json`. To preserve classic-script format, it emits neither modules nor a new strict directive. Distribution URLs and registration steps are preserved. All three generated files are checked before tests, during Wrangler builds, and by CI synchronization checks.

The ACK Cache is the authoritative retry record storing pair codes and event IDs. It does not store scanned content or URLs. Records are removed after successful sending and retained for Sync or inbox-startup retries after failure. Preserve replacement of existing keys, server-side event-ID idempotency, same-origin credential retrieval on notification clicks, and the HTTP(S) restriction. Type projections for unvalidated JSON properties and standard API arguments describe existing coercion only; they add neither validation nor ACID across stores.

App credentials, API data, storage, and bridge data remain unvalidated values. Type projections describe existing property access and standard API coercion only. Separate types for fixed HTML elements from state, Maps, and timers created by this module. Preserve server authentication, ACK deduplication, retry cancellation on success, deadlines and backoff on failure, and cleanup after unlinking. HTML/CSS, Japanese/English dictionaries, appearance, state transitions, and interactions are unchanged.
