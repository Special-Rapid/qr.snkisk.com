# QR Scan Mobile

A QR and barcode scanner for iPhone and Android. Camera images are analyzed on the device, and URLs open only after confirmation.

## Development

<a id="開発"></a>

```sh
npm install
npm run check
./scripts/build_and_run.sh
```

Scan the displayed QR code with Expo Go to run on a physical iOS or Android device. Pass `--ios` or `--android` to launch directly.

## EAS builds

<a id="easビルド"></a>

`eas.json` provides development, preview, and production profiles. After logging into Expo, build with:

```sh
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest build --platform android --profile production
```

Configure initial EAS project initialization, Apple Developer and Google Play Console credentials, and store submission information through user-owned accounts.

### Preview builds from GitHub PRs

<a id="github-prからのpreview-build"></a>

Connect the Expo GitHub App to this repository and set the base directory to `apps/mobile`. Apply `eas-build-android:preview` to a PR to create an Android internal preview. Ordinary pushes do not create mobile builds. Before using the PR labels `eas-build-ios:preview` or `eas-build-all:preview` for iOS or both platforms, prepare a successful EAS build for each platform and `preview.ios.image`.

## ESLint configuration type checking and the JS exception

<a id="eslint設定の型検査とjs例外"></a>

`eslint.config.js` remains a JavaScript editing source to retain Expo CLI's existing flat-config discovery (JS/MJS/CJS). Loading a TS config directly with the currently locked ESLint requires an additional loader or a native-TS flag. Do not mix in a TS rename that starts another setup path, or add dependencies, flags, or a generating builder.

This config undergoes strict `checkJs` / `noEmit` checking with `tsconfig.eslint.json`. `npm run typecheck:eslint-config` checks the config alone; `npm run typecheck` checks the app and config. `npm run lint` reads the same config through the existing Expo entry point. Array order, ignores, rules, and runtime execution are preserved. JSDoc describes ESLint's actual API types and the array API of the locked Expo flat config; it does not add runtime validation for unknown data. The config is not generated: edit it directly, without regenerating MJS/CJS.

`config-types/eslint-config-expo.d.ts` declares only the config array returned by the locked `eslint-config-expo/flat`, which supplies no type declarations. It uses ESLint's own config types and does not guarantee the vendor's complete internal implementation or the safety of unknown JSON.

## Contract test type checking

<a id="契約テストの型検査"></a>

The three existing `test/*.test.mts` tests are included in strict checking through `tsconfig.test.json`. The Node type environment is separate from the app's Expo configuration. Paths to fixed repository files are represented as strings, preserving the existing 10 regression cases and assertions. Run `npm run check` with Node.js 22.18 or later. These source-contract tests are separate from acceptance checks for physical-device cameras, Share Sheet, Control Center, and Quick Settings.

## Dependency security compatibility patches

<a id="依存セキュリティ互換patch"></a>

Retain SDK57's Expo Router and `query-string@7.1.3`, using the ESM default from `decode-uri-component@0.5.0` through synchronous CJS. Valid percent encoding uses the native decoder without a length limit. Recovery of malformed encoding first converts plus signs to spaces and passes the entire component upstream; malformed components longer than 65,536 characters are rejected with `URIError`. This contract applies per query value or fragment, not as an input-length limit for the entire Router.

The RSA DigestAlgorithm tightening in `node-forge@1.4.0` and the container-depth limit of 128 in `braces@3.0.3` are also applied through [hash-pinned patches](scripts/security-patches/README.md). The `npm ci` postinstall step and regression tests are required. Version warnings for the two issues without official fixes remain; do not confuse runtime remediation with clearing those warnings. This does not include Android physical-device or Store distribution verification.
