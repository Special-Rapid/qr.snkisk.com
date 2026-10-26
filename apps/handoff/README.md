# QR Handoff Worker

`qr-handoff` は、スマホで読み取ったQRコード・バーコードの値を、ペアリング済みPCのWeb受信箱へ渡すCloudflare Workerです。

## ローカル確認

```sh
npm install
npx wrangler d1 migrations apply DB --local
npm run check
npm run dev -- --local
```

ブラウザは `http://localhost:8787` を開きます。ローカルHTTPではCookieの`Secure`属性を外しますが、本番HTTPSでは必ず`HttpOnly; Secure; SameSite=Strict`になります。

## 本番に必要なCloudflare設定

- Worker名: `qr-handoff`
- D1 binding: `DB`
- D1 ID: `47ec50ec-4820-4bb1-b4fb-dbcba5407978`
- D1名: `qr-handoff-prod` を前提にしています。Dashboardで異なる名前なら、デプロイ前に `wrangler.jsonc` を修正してください。
- Durable Object binding: `PAIR_DO` (`PairingRoom`)

本番マイグレーションとWorkerデプロイは、必ず次の順で実行します。

```sh
npm run deploy:production
```

`main` のみがこのコマンドを実行するWorkers Builds構成にします。非本番ブランチは本番D1へマイグレーションを適用してはいけません。

## DNSと通知

`qr.snkisk.com`には既存DNSレコードがあるため、このリポジトリはCustom Domainをまだ設定しません。最初のデプロイ後に現在のDNSの用途を確認してから接続します。

開いたWeb受信箱にはDurable Object WebSocketで新着が届きます。タブを閉じた状態でも届くWeb Pushは、VAPID鍵をCloudflare secretとして登録してから追加します。秘密鍵やトークンはGitへ入れません。

## WebのQR読み取り

[Issue #6](https://github.com/Special-Rapid/QRCodeExtension/issues/6)の「読み取る」画面は連携なしでも使えます。カメラはHTTPS/localhostとブラウザ許可が必要で、非対応・拒否・カメラなしの場合は画像選択を使います。映像・画像を送信せず、結果はコピーまたはHTTP(S)リンクを明示して開きます。結果後は停止し、次の読取を再開します。離脱・非表示・停止中に解決した権限要求の映像も解放します。

`public/scan-decoder.js`は拡張と同じjsQRデコーダーを同梱した生成済みコードです。rootの依存を用意して`node apps/handoff/scripts/build-scanner.mjs`で再生成します。実カメラ、Safari/Firefoxの実機は未検証です。

表示言語は日本語/英語、未保存時はOS localeのexact/base一致、それ以外は日本語です。手動言語・System/Light/DarkはlocalStorageに保存し、画面遷移やreloadなしで切り替えます。SystemはOSのappearance変更に追従し、色は共有semantic token、browser theme-colorは解決したcanvas色を使います。Webに標準のOS accent-color取得APIはないため非適用です。RTL localeは現在サポートしていません。

映像領域の`--camera-canvas`は映像未到着時の黒背景を定義する共通tokenです。

同梱jsQRの著作権・Apache-2.0本文は`public/jsqr-LICENSE.txt`に保持し、再生成時にコピーします。
Webの編集元は [web/README.md](web/README.md) のTypeScriptです。`notification-state.ts`・`app.ts`・`service-worker.ts` を編集し、`npm run build:web` はstrict型検査後に同名の `public/*.js` を生成します。型エラー時は該当projectのemitを拒否します。test前とWranglerのcustom buildからも呼びます。配布JSは生成物として扱い、既存の配布URL・表示・操作・状態判定・public assetsを保持します。custom buildの設定は [Cloudflare公式仕様](https://developers.cloudflare.com/workers/wrangler/configuration/#custom-builds) と使用中のWrangler schemaで確認しています。

通知状態とWeb受信箱の既存テストは `test/notification-state.test.ts` と `test/web-receiver.test.ts` をstrict型検査します。`test/web-receiver-fixtures.d.ts` は固定service-workerを評価する代替Cache・Fetch・通知イベントの使用範囲だけで、実ブラウザーAPIの完全実装や製品入力検証ではありません。`test/notification-state-contract.d.ts` は配布 `public/notification-state.js` を読むテスト用のexport契約で、無視される追加引数も既存どおり扱います。実装の編集元は前述の `web/notification-state.ts` です。

## 受信画面のURL境界

保存済みcredentialと応答中の連携コードは、API/WebSocketのURLを作る直前に大文字8文字のcanonical alphabetで検証する。人の入力用の正規化をここで使わず、不正なpathを別の有効コードへ解釈しない。API呼出しも既知の同一origin pathだけを許可する。受信イベントの「開く」は絶対HTTP/HTTPS URLを検証・正規化し、その文字列をクリック時まで保持する。確認フレーズは既存30語から棄却法で均等に選ぶ。これらはWorker側の権限確認・相互確認・期限・失効処理を置き換えない。

連携コードの作成・再作成中は即座に待機状態を表示し、両入口を無効にして重複起動を防ぐ。待機中の言語・テーマ切替でも状態を保ち、成功・失敗のどちらでも操作可能な状態へ戻す。

Scanner integration uses `web/app.ts` as the app source and a narrow `web/scanner-contract.d.ts` declaration for the existing scanner module. The declaration describes the consumed API; it does not claim strict type checking of scanner internals. `build:web` regenerates the decoder from the current extension TypeScript sources before emitting the app.
