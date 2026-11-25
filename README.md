[日本語](README-ja.md)

# QR Scan

This project combines a camera-free Chrome extension for scanning QR codes with a mobile app and Web inbox for handing scanned values to a paired PC.

## Features

### Chrome extension

- Scan QR codes in the visible area of the current tab by opening the popup.
- Scan QR codes from PNG, JPEG, WebP, and GIF images.
- Copy results and explicitly open validated HTTP(S) URLs in a new tab.
- Scan locally without camera permission or persistent access to all websites.

### Mobile-to-PC handoff

- Detect QR codes, barcodes, and printed URLs on iOS and Android.
- Select one result when multiple candidates are found and explicitly send it to a paired PC.
- Receive results in the PC's Web inbox or an optional Chrome extension connector.
- Review the content and destination host before opening a URL in the Web inbox. Non-URL values can only be copied.
- Clicking a Chrome connector notification directly opens only a validated HTTP(S) URL; other values open the Web inbox.

## Project structure

| Path | Contents |
| --- | --- |
| [apps/extension/](apps/extension/README.md) | Manifest V3 Chrome extension with camera-free QR scanning and an optional inbox connector. |
| [apps/mobile/](apps/mobile/README.md) | Expo-based iOS and Android scanner. |
| [apps/handoff/](apps/handoff/README.md) | Cloudflare Worker, D1, Durable Object, and PC Web inbox for `qr.snkisk.com`. |
| [.github/workflows/](.github/workflows/README.md) | Checks for all apps and build/analysis conditions for each CodeQL language. |

## Try the Chrome extension locally

```sh
npm install
npm run check:extension
```

Open `chrome://extensions` in Chrome, enable Developer mode, select **Load unpacked**, and choose the generated `apps/extension/dist/` directory.

## Security and privacy

- The Chrome extension analyzes page and image data locally after a user action. It does not send or store image data externally.
- Values sent from mobile to PC are delivered only to an explicitly paired destination. Pairings can be reviewed in each interface and revoked at any time.
- The Web inbox does not automatically open links. Only HTTP(S) URLs are shown as links and opened after confirmation and an explicit action.
- Chrome extension notifications do not include the scanned text or full URL. Clicking a notification directly opens only a validated HTTP(S) URL from a paired event.

## Development

See each component's README for details.

- [Mobile app](apps/mobile/README.md)
- [PC inbox and Worker](apps/handoff/README.md)

## Brand assets

`assets/brand/qr-scan-icon.svg` is the source of truth for brand generation. Required Chrome extension and native icons are generated locally and bundled. The Web inbox serves its favicon and logo as the same generated 128px PNG from `images.snkisk.com`, so no copies are generated in the handoff public directory. When updating the brand, publish the new PNG first, then update the favicon/logo URLs and brand contract tests together.

## CI and distribution builds

GitHub Actions `Verify` runs `npm run check` for pull requests and pushes to `main` when app, tooling, lockfile, or relevant workflow files change, and also supports manual runs. Changes only to `docs/` do not trigger it. A newer commit on the same PR or branch cancels the older verification run.

iOS and Android distribution binaries are not built on every push. Connect this repository to the mobile project through the Expo GitHub App, set the base directory to `apps/mobile`, and apply the appropriate label to a PR when needed:

- `eas-build-android:preview` — Android internal preview
- `eas-build-ios:preview` — iOS internal preview
- `eas-build-all:preview` — Internal preview for both platforms

Production builds and store submissions run only for release candidates with a SemVer version tag, through the EAS dashboard or an explicit EAS workflow. Ordinary pushes to `main` do not trigger production mobile builds.

## License

Owner-authored code is licensed under the [MIT License](LICENSE). Third-party code and dependencies retain their respective copyright notices and license terms.

### Build images and Git

The editable `assets/brand/qr-scan-icon.svg`, editable Icon Composer SVGs, and inline SVGs are versioned as source. Copies of PNGs, derived SVGs, and generated Android vector XML are not stored in Git; they are generated or restored to the existing paths before a build. Final extension and native packages still bundle their images and do not fetch them from a CDN at app startup. The iOS project's Icon Composer definitions and the definitions in Expo configuration remain unchanged by this asset migration.

```sh
npm ci
npm --prefix apps/handoff ci
npm --prefix apps/mobile ci
npm run prepare:native-assets
npm run check
```

`tooling/native-assets.lock.json` pins verified CDN URLs, SHA-256 hashes, byte sizes, MIME types, and bundle destinations. Downloads use HTTPS only from `images.snkisk.com/QRCodeExtension/`, reject redirects, and validate every input before writing to bundle destinations. HTTP, MIME, size, or hash mismatches and unpublished URLs stop the build. Existing untracked images are not used as fallbacks. The 25 Android `.webp` paths already contain PNG bytes, so their existing bytes and paths are preserved.

The cache is outside Git at `~/.cache/qr-scan/sha256`. Set `QR_ASSET_CACHE_DIR` to use another directory outside Git. Once prepared online, the image cache can restore identical bytes without network access:

```sh
QR_ASSETS_OFFLINE=1 npm run prepare:native-assets
# Or: node tooling/prepare-build-assets.mjs --native --offline
```

The dependency installation cache is separate. Missing or corrupt image cache entries stop preparation safely. Investigate a corrupt hash file before explicitly removing it and preparing again online. Do not overwrite a PNG source without updating its pinned URL and hash. Brand updates require checking the editable source, pinned originals, generation recipe, and distributed assets together.

Preparation is wired into root CI; mobile npm postinstall before EAS prebuild; start/android/ios/web/check; EAS post-install; direct Gradle preBuild; and Xcode before resource compilation. Extension builds and tests generate assets from the source SVG without a CDN. Before invoking `npx expo` directly, run `npm run prepare:native-assets`. With matching cache and inputs in a clean checkout, verify generated pixels/dimensions and the complete hashes of pinned inputs.

See [tooling/README.md](tooling/README.md) for the TypeScript editing sources and generated MJS used for image generation and native asset preparation.

## Type checking, generated files, and configuration exceptions

Owner-authored source, development scripts, and existing tests are covered by type checking. Four files from the [Web editing sources](apps/handoff/web/README.md) and three from the [tooling editing sources](tooling/README.md) generate the required tracked JavaScript artifacts. Regenerate them through each folder's build instead of editing them directly. Chrome distribution bundles are generated in the existing ignored `dist/` directory.

The [mobile ESLint configuration](apps/mobile/README.md#eslint設定の型検査とjs例外) remains JavaScript for Expo's existing discovery mechanism and is checked with strict checkJs/noEmit. This is a platform exception, not a completed rename to TypeScript. Vendor code and node_modules remain locked third-party dependencies outside this owner-authored source migration.

The type migration of the original 29 candidates in parent Issue #15 has been merged into main. Additional source in the separate feature PRs #8/#9 is outside that migration. Type checking and successful native CI builds do not establish real-device/Push acceptance, signed APK/key readiness, or Store distribution. Individual Draft PRs and local checks do not establish production adoption or release readiness for those features.
