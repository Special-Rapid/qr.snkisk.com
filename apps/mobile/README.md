# QR Scan Mobile

iPhoneとAndroidで動くQR／バーコードスキャナーです。カメラ画像は端末内で解析し、URLは確認後にだけ開きます。

## 開発

```sh
npm install
npm run check
./scripts/build_and_run.sh
```

Expo Goで表示されたQRコードを読み取ると、iOS／Androidの実機で起動できます。直接起動する場合は `--ios` または `--android` を渡してください。

## EASビルド

`eas.json` にdevelopment／preview／productionプロファイルを用意しています。Expoへログイン後、次のコマンドでビルドできます。

```sh
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest build --platform android --profile production
```

初回のEASプロジェクト初期化、Apple Developer・Google Play Consoleの資格情報、ストア提出情報はユーザー所有のアカウントで設定してください。

### GitHub PRからのpreview build

Expo GitHub Appをこのrepositoryへ接続し、base directoryを`apps/mobile`にすると、PRへ`eas-build-android:preview`を付けてAndroid internal previewを作れます。通常のpushではmobile buildを作りません。iOSまたは両方をPR labelで起動する場合は、先に各platformの成功済みEAS buildと`preview.ios.image`を用意したうえで、`eas-build-ios:preview`または`eas-build-all:preview`を使います。

## ESLint設定の型検査とJS例外

`eslint.config.js` はExpo CLIの既存flat-config検出（JS/MJS/CJS）を保つためJavaScriptの編集元として残します。現在のlocked ESLintでTS設定を直接読む経路は追加loaderまたはnative TS用flagが必要です。TSへrenameして別のセットアップ経路を起動する変更は混ぜず、新しい依存・flag・生成builderも追加しません。

この設定を `tsconfig.eslint.json` のstrict `checkJs` / `noEmit`で型検査します。`npm run typecheck:eslint-config` が設定単体、`npm run typecheck` がappと設定の検査です。`npm run lint` は従来のExpo入口で同じ設定を読みます。配列の順序・ignore・rule・runtime実行は保持します。JSDocはESLintの実API型とlocked Expo flat-configの配列API範囲を表し、未知データのruntime validationを追加するものではありません。生成物ではないため設定自体を編集し、MJS/CJSの再生成は不要です。

`config-types/eslint-config-expo.d.ts` は、型宣言を同梱しないlocked `eslint-config-expo/flat` が返す設定配列だけを宣言します。ESLint本体の設定型を使い、vendorの内部実装全体や未知のJSONの安全性を保証しません。

## 契約テストの型検査

`test/*.test.mts` の既存3テストを `tsconfig.test.json` のstrict検査へ含めます。Node用の型環境はアプリのExpo設定から分けます。固定repoファイルを読むpathをstringで表し、既存の10回帰とassertionを保持します。Node.js 22.18以降で `npm run check` を実行してください。これらのソース契約テストは、実機のカメラ・Share Sheet・Control Center・Quick Settingsの受入確認とは別です。


## 依存セキュリティ互換patch

SDK57のExpo Routerと`query-string@7.1.3`を維持し、`decode-uri-component@0.5.0`のESM defaultを同期CJSから利用する。正常なpercent encodingは長さを制限せずnative decoderで処理する。不正encodingの復旧はplusを空白へ変換した後、component全体をupstreamへ渡し、65,536文字を超える不正componentは`URIError`で拒否する。これはquery値およびfragment単位の契約で、Router全体の入力長制限ではない。

`node-forge@1.4.2` includes upstream RSA DigestInfo validation; the former 1.4.0 backport is no longer applied. The `braces@3.0.3` container-depth limit remains a [hash-pinned patch](scripts/security-patches/README.md). Run `npm ci` with its postinstall and the regression tests. GitHub advisory and alert status must be checked separately from runtime behavior. Android device and store distribution are not verified here.
