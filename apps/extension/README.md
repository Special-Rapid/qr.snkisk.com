# Chrome extension

<a id="chrome拡張機能"></a>

A Manifest V3 extension that handles the current Web page URL and QR codes on the page without a camera. See the [root README](../../README.md) for features and local setup.

## Incremental TypeScript migration

<a id="typescriptへの段階移行"></a>

Edit URL validation and current-tab URL retrieval in `src/safe-url.ts` and `src/current-url.ts`. The image decoder source, `src/qr-decoder.ts`, also includes pixel input, regions, detected coordinates, and results in strict type checking. The options-page source, `src/options.ts`, and `src/chrome.d.ts` type-check the fixed DOM and responses to the extension's own runtime messages. Connector contents remain `unknown`; only the existing presence check is performed. Type annotations retain the existing assumption of a new canvas's 2D context and do not change runtime failure handling. `npm run typecheck` strictly checks the TypeScript sources and tests in this stage; `npm run check` also checks bundles and regression tests. Use Node.js 22.18 or later.

JavaScript distributed to Chrome is generated into `dist/` by the existing esbuild pipeline. Edit sources rather than distributed output. This integrated diff includes the extension's own sources, build scripts, and existing tests in strict type checking. It does not indicate completed adoption into main or release readiness.

Work records, state matrices, and verification evidence stay in private local `docs/`; never stage, commit, push, or publicly serve them. When using a dedicated worktree, update and read back existing records in the primary checkout. Public PRs summarize only directly verified results. Do not add the private records themselves to public diffs.

The existing manifest regression test, `test/manifest.test.mts`, also undergoes strict type checking. Its test-only structure describes the fixed manifest in this repository and preserves assertions for permissions, supported Chrome versions, and distributed files. This declaration is not runtime validation for external JSON.

The image decoder's existing regression tests in `test/qr-decoder.test.mts` also undergo strict type checking. `test/fixture-libraries.d.ts` declares only the QR-generation and PNG-pixel APIs used by fixtures; assertions and test execution remain unchanged.

All existing extension regression tests use `.mts` and strict type checking. Substitute DOM, Chrome, and worker APIs for popup and background tests are fixture-only structures, not complete implementations of real browser APIs. Brand-asset tests use MJS and declarations generated from the TypeScript sources described in [tooling/README.md](../../tooling/README.md). `tooling/generate-brand-assets.d.mts` is generated from the same implementation source; do not edit it directly.

The popup source, `src/popup.mts`, strictly type-checks the fixed HTML DOM, settings membership checks, display states, QR results, the Chrome tabs/storage APIs, and the QR-generation library APIs in use. `src/qrcode-browser.d.ts` declares only the Promise-based API used here. Stored values are received as `unknown` and narrowed to settings only after existing checks. Annotations for fixed HTML datasets and successful FileReader readAsDataURL values do not add runtime validation. Preserve the output `dist/popup.js` and its behavior.

The build entry point, `scripts/build.mts`, also undergoes strict type checking. Node.js 22.18 or later executes TypeScript directly, performing existing asset generation, static-file copying, and esbuild bundling in the same order. Output filenames and the manifest are preserved.

The communication helper source, `src/handoff-client.ts`, types request options and still returns external JSON as `unknown`. Error-property type projections preserve the existing typeof checks and do not treat the entire JSON value as a validated object. Existing behavior, including null and parse failures, is preserved; input validation, APIs, authentication, and URL decisions are unchanged.

The background source, `src/handoff-background.mts`, describes the Chrome/worker APIs it uses in `src/background-contracts.d.ts`. Messages, JSON, and storage are received as unknown; property projections retain existing reads and guards. Local projections for JavaScript coerce-or-throw calls and arithmetic do not mark inputs as validated. Pending ACK types are marked as validated only after the existing typeof filter.

Chrome local storage is the authoritative ACK state. Preserve Promise serialization within one service worker, connector-first deletion and the null deletion sentinel, connector ID/code matching, eventId deduplication, the local ACK's 10-minute TTL, and resending after restart. No ACID is claimed across network ACKs and local storage. The existing server ACK stores an event's acknowledgedAt only the first time. Real Chrome/Push acceptance is separate from Node fixtures.

The content-script source, `src/connector-bridge.mts`, receives messages and claim responses as unknown, retaining existing origin/source/extensionId/token guards and property reads. The token:string projection occurs only after the preceding typeof check. The build generates `dist/connector-bridge.js` as a classic script without bundling or module conversion, preserving the manifest and Web communication contract. Only this distribution entry uses `alwaysStrict: false` to prevent adding a strict directive absent from the existing script; strict source type checking is retained. Declared Chrome APIs cover only the APIs used here, not schema validation for arbitrary responses.
