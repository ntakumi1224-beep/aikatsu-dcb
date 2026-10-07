# スマホ公開前チェック（2026-10-08）

判定：V0.1のスマホ試用版としてVercelへ静的配信できる構成。まだ外部デプロイは行っていないため、Vercel実配信・iPhone Safari・Android Chrome実機の確認は次の段階です。既存画面のデザインと機能は変更していません。

## 配信設定

- 構成：HTML/CSS/JavaScript、Node.js標準機能のビルド。バックエンド・npm外部依存なし。
- 開発：`npm start` → localhost:4173。
- 公開確認：`npm run build` → `npm run preview` → localhost:4174。
- Vercel：Framework Other、Build Command `npm run build`、Output Directory `dist`。
- ソースの`public/`は紹介ページやアイコンの素材フォルダ。アプリ・Masterを含む配信先は`dist/`。
- 公開アプリURL：`https://プロジェクトURL/app/`。直接アクセス例：`/app/#binder`、`/app/#card/DCB-0001`。

## 25項目の確認

| # | 項目 | 結果 |
|---|---|---|
|1|構成|静的アプリ。package.json / build.cjs / vercel.json / public / data。Master Excelは配信しない。|
|2|起動|開発npm start、公開版npm run preview。Nodeサーバーはローカル確認専用。|
|3|build|必要。アプリ資産・JSONのコピーとmanifest等の生成を実施。VercelビルドにExcel変換・Pythonは不要。|
|4|公開対象|dist。37ファイル、885,756 bytes（今回ビルド時点）。|
|5|SPA|ハッシュルーティング。/app/内で#home、#binderなどに遷移。|
|6|直接URL・404|ローカル公開サーバーで/app/、/app/deep-linkは200、/appは308、未知の公開URLは404。Vercelの/app/:path* rewriteと拡張子なし/app/indexの指定は既存のまま。Vercel実配信は未確認。|
|7|localStorage|所持・メモ・表示設定の保存と再読込を検証。写真はIndexedDB。保存失敗処理も単体テスト済み。localhost・別ポート・別ドメイン・HTTP/HTTPS間は保存が別になる。|
|8|Master|dist/data/cards.json=139件、coordinates.json=23件。動的読込・検索・絞込・読込失敗再試行・写真表示を検証。|
|9|パス|公開app/index.htmlにbase href=/。JSONと資産はドメインルートから取得。Vercelのルート配信が前提。別サイトの任意サブディレクトリ配信には別調整が必要。|
|10|参照切れ|公開ページのネットワークエラー・JSエラー検査を通過。アイコンのHTTP200確認済み。写真は端末内Blob URL。|
|11|PWA|manifestとアイコンあり。ホーム画面追加を想定。完全なオフラインPWAではない。|
|12|manifest|ビルドで生成。start_url /app/、scope /app/、display standalone、lang ja。|
|13|Service Worker|なし。オフライン利用不可。古い版をSWが固定キャッシュする問題はない。|
|14|favicon / app icon|SVG favicon、192/512 PNG、maskable512、Apple touch180あり。|
|15|HTTPS|アプリの読込・保存は同一origin。公開資産にHTTP固定の外部依存なし。ローカルビルドのmetadataにlocalhostを使うが、VercelビルドではHTTPSのシステムURLを使用。|
|16|カメラ・QR|getUserMediaはHTTPSまたはlocalhostのsecure contextが必要。LANのhttp://PC-IPではカメラ確認に使えない。Vercelでcamera=(self)を許可。QR生成・復号はデモのため、本物の相手QRの認識は未実装。|
|17|iPhone Safari|playsinline/mutedのカメラ動画あり。入力時ズーム、キーボードと固定ナビ、アドレスバー伸縮、写真保存・復帰を実機確認。現在の入力文字サイズは16px未満のものがあり、フォーカス時ズームの確認が必要。|
|18|Android Chrome|カメラ許可/拒否/再試行、背面カメラ選択、画面回転、ブラウザ復帰、写真保存容量、ホーム画面追加を実機確認。QR自動認識はまだ行わない。|
|19|safe-area|下端env(safe-area-inset-bottom)あり。上端・左右のinsetを明示していないため、ノッチ付き端末の横向き・standaloneは実機確認が必要。|
|20|下部固定ナビ|下端paddingと本文の下部余白にsafe-areaを加算。通常縦画面の画面検証を通過。実物ホームインジケータとの干渉は未確認。|
|21|viewport|width=device-width, initial-scale=1, viewport-fit=cover。ユーザーのズームを禁止しない。|
|22|touch-action|詳細カード画像はpan-y pinch-zoom。横スワイプは横60px以上かつ縦の1.8倍以上、縦スクロールを維持。小型操作は44pxタップ領域を維持。|
|23|overscroll|全体の強制抑止なし。ブラウザ標準のバウンス/引っ張り再読み込みを維持。実機で誤操作があるか確認。|
|24|vh / dvh|アプリ・ログイン等は100dvhを使用。古いブラウザ向け100vhフォールバックなし。:has/color-mixなども使用するため現行Safari/Chromeで試用する。キーボード時の高さは実機確認。|
|25|横スクロール|公開トップ320/390/1440幅、主要画面の監査を実行。ページ全体の横はみ出しを検査。レアリティ列の局所横スクロールは意図した仕様。|

## 今回の変更

- build.cjs：SITE_URL未指定のVercelビルドはシステム環境変数からHTTPS originを取得。ProductionはVERCEL_PROJECT_PRODUCTION_URLを優先し、PreviewはVERCEL_URL。明示SITE_URLが最優先。資格情報・パス混入・予約ドメインの拒否を継続。
- .env.example：SITE_URLを任意設定として説明。PUBLIC_INDEXING=falseを維持。
- .vercelignore（新規）：Master Excel、テスト、監査結果、ルートのスクリーンショット、開発サーバー、ローカル環境ファイルをCLIアップロードから除外。public配下の画像と実カードJSONは含む。
- verify-public.cjs：初回Production/Previewの自動URL、noindex、無効なURLの拒否を追加検証。
- DEPLOYMENT.md：Git不要のCLI手順と検索非公開のまま実機確認する方針へ更新。
- vercel.json：既存設定が今回の用途を満たすため変更なし。

## 実機で確認する順番

1. HTTPSの/app/でオープニング→ログイン→ホーム。/app/#binder直接アクセスと再読み込み。
2. 通常ブラウザでカード枚数・メモ・4色・2テーマを変更し、閉じて再度開いて保存を確認。
3. カード登録でカメラ許可→背面映像→撮影→写真表示。拒否→再試行、他画面へ移動してカメラ停止、アプリ復帰も確認。
4. バインダー3モード、検索/フィルター/同名統合、詳細の前後移動・横スワイプ・縦スクロール、一覧へ戻る。
5. トレード条件→QR表示、カメラプレビューとデモ読み込み。本物QRの端末間照合は今回の完成範囲外。
6. 入力時キーボード、ナビ最下段、縦/横回転、Safariのツールバー開閉、ホーム画面追加時のノッチと余白。

保存は端末・ブラウザ・originごとです。ローカル版のデータは公開URLへ自動移行しません。Previewの毎回異なるURLから固定Production URLへ移る場合も別保存先です。実認証・同期・バックアップは未実装です。

## 根拠

- [Vercel静的設定・rewrites・cleanUrls](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercelのシステム環境変数](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Vercel CLI deploy](https://vercel.com/docs/cli/deploy)
- [カメラのsecure context要件（MDN）](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [iPhoneのsafe-areaとviewport-fit（WebKit）](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

## 検証結果

単体テスト5本、公開ビルド、verify-public（自動URL/直接URL/404/資産/manifest/保存）、verify-master（実Master139件/23コーデ/写真/登録/トレード/4幅）通過。公開パスで既存画面テスト11本もすべて通過。UI監査232条件、32px見た目/44pxタップ領域・隣接非重複検査も通過（4メインカラー×2テーマ含む）。ブラウザ検証はWindows Edgeの自動化とスマホ寸法エミュレーションであり、Safari/Android実機やVercel実配信を検証したものではありません。
