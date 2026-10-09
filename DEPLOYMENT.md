# アイカツDCB 公開準備（V0.1）

## 1. 現在の構成

HTML／CSS／JavaScriptの静的アプリ。フレームワークとバックエンドはありません。実番号OCRには固定版Tesseract.jsと英数字認識データを使用し、同一サイトから配信します。初回はnpm ciで依存を導入してください。Node.js標準機能で配信・ビルドします。開発時はnpm startで4173番、公開プレビューはnpm run previewで4174番を使用します。

既存画面はハッシュルーティングを継続。公開版は `/app/#binder` 等です。localStorageの所持情報・設定・表示形式・トレード条件と、IndexedDB `aikatsu-dcb-photos-v01` の写真保存を維持しています。同じoriginのパス変更では保存先は変わりません。localhost、別ポート、別ドメイン、HTTP→HTTPSは別originになり、データは自動移行されません。バックアップ／復元は未実装です。

## 2. 変更ファイル

| ファイル | 役割 |
| --- | --- |
| public/index.html | 検索向けの公開トップHTMLテンプレート |
| public/news.html | 既存4分類の公開ニュースHTMLテンプレート（現在はダミー） |
| public/public.css / public.js | 白・明るいピンクの紹介ページ、旧ルートハッシュの転送 |
| public/404.html | 実際に404で返すページ |
| public/icons/* / public/share.png | 独自の本型アイコン、PNGのPWA／共有画像 |
| build.cjs | SEO／manifest／robots／sitemapを生成し、許可した資産だけdistへコピー |
| vercel.json | ビルド・出力・URL・ヘッダー設定 |
| server.cjs | 開発用と公開プレビュー用の配信、404、許可した開発資産のみ配信 |
| index.html | アプリのnoindex、noscript、theme-color |
| app.js / trade.js | URL更新時に現在のパス・クエリを保つ |
| package.json / .gitignore / .env.example | コマンド、生成物・秘密情報の除外、環境変数例 |
| verify-public.cjs / verify-published-app.cjs | 公開構成と既存画面の検証 |
| README.md / DEPLOYMENT.md | 起動・公開手順 |

## 3. 公開トップ

名称・短い説明 → アプリを開く → 主な用途 → コレクション管理 → トレード → 最新カードニュース → 非公式表記・端末保存の説明 → フッター。

検索向け文章は静的HTMLにあります。カード番号、ブランド、タイプ、キャラクター、レアリティから探す用途と、所持／未所持・所持枚数・コーデ・コンプリート・交換候補・ほしいカードを自然な文章で説明します。ログイン画面だけを検索の入口にしません。

実装状態に合わせ、実カードMaster・デモログイン・ダミーQRを明記。QRによる実際の端末間交換照合が完成しているとは記載していません。実カード画像や公式ロゴは追加していません。

## 4. SEOと公開URL

本番URLはビルド時の `SITE_URL`（HTTPSのorigin、末尾パスなし）で管理します。`PUBLIC_INDEXING=true` を指定すると公開トップのindex/follow、absolute canonical、Open Graph、Twitter/X共有meta、WebApplicationのJSON-LD、robots.txt、sitemap.xmlを生成します。公開トップはlang=jaとh1/h2の意味構造を持ちます。評価・実績等を架空で構造化データへ追加していません。

URL未設定の通常ビルドはlocalhost:4174を使い、noindex＋robotsのDisallowで検索公開を止めます。Vercel PreviewではPUBLIC_INDEXING=trueでもnoindexです。VercelではSITE_URL未設定時にシステム環境変数のURLを利用します。ProductionはVERCEL_PROJECT_PRODUCTION_URL（なければVERCEL_URL）、PreviewはVERCEL_URLです。手動のSITE_URL指定があれば優先します。Vercel以外のProductionではHTTPS SITE_URLが必要です。検索公開は引き続き明示的なSITE_URLとPUBLIC_INDEXING=trueが必要です。

アプリはmetaとX-Robots-Tagでnoindex。検索除外はアクセス制御ではありません。個人データを静的HTMLや公開JSONへ出力しません。robotsだけでアプリを拒否するとnoindexを読めないため、本番robotsはクロールを許可し、アプリ側のnoindexを読ませます。[Googleのnoindex説明](https://developers.google.com/search/docs/crawling-indexing/block-indexing)

現在はダミー情報なので `/news` もnoindex、sitemapには公開トップだけを含めます。実在ニュースへ更新する際は、出典・期間・条件を確認し、build.cjsのnews用allowIndexとvercel.jsonの/newsヘッダー、sitemap登録を一緒に更新します。

将来の `/cards`、`/cards/ID`、コーデ一覧、ブランド一覧は公開HTMLテンプレートとbuild.cjsのSEO生成関数を追加して拡張できます。現在、未実装URLは404です。個人の所持数・お気に入り・メモ・交換候補・ほしいカード・ユーザー情報は公開ページの生成元にしません。

## 5. PWAの基礎

manifest.webmanifestにname、id、lang、start_url=/app/、scope=/app/、display=standalone、theme-color、background-colorを設定。192／512px、maskable 512px、Apple touch 180pxアイコンを用意しました。開始URLとスコープはアプリ領域です。[manifestの公式解説](https://web.dev/learn/pwa/web-app-manifest)

ホーム画面追加はブラウザのメニューから行う想定。インストール案内の自動表示・実機でのインストール可否は未確認です。Service Workerとオフラインキャッシュは追加していません。既存機能への影響を抑え、古いJSをキャッシュし続ける状態を避けています。HTTPS本番でカメラ権限とstandalone表示を実機確認してください。

## 6. 推奨デプロイ先

Vercelを推奨します。静的ファイルの出力先distとnpm run buildを設定でき、HTTPSの公開URL、Git連携、公開前のPreviewを利用できるため、この構成に合います。特定プランの料金・利用上限は今回判断していません。[Vercelの設定仕様](https://vercel.com/docs/project-configuration/vercel-json)

SPAの全URLをアプリへ飛ばす設定は使わず、公開トップとニュースを実際のHTMLとして配信します。`/app`は`/app/`へ転送し、アプリ領域だけindexへrewrite。未実装の公開URLは404です。Node.jsのローカル確認サーバーをVercel Functionとして公開する必要はありません。

## 7. 実際のデプロイ手順

現状はGitリポジトリがないため、最初の実機確認はCLIからのPreview配信が最短です。自動更新を使いたい場合は後から非公開GitリポジトリをImportできます。

1. このフォルダで `npx vercel login` を実行し、Vercelへログインする。
2. `npx vercel` を実行し、新規プロジェクトを作成する。FrameworkはOther、Build Commandは `npm run build`、Output Directoryは `dist`（vercel.jsonに定義済み）。公開フォルダはソースのpublicではなくdist。Node.jsのローカル配信サーバーは公開しない。
3. `SITE_URL` は最初は未設定でよい。`PUBLIC_INDEXING` は未設定またはfalseのままにする。Vercelのシステム環境変数を無効化している場合は有効にするか、SITE_URLにプロジェクトのHTTPS URLを指定する。
4. 表示されたPreview URLをスマホで開く。Deployment Protectionが有効な場合は同じVercelアカウントで認証するか、ダッシュボードで共有方法を確認する。`/app/#binder` の直接アクセス・再読み込み・写真保存・カメラ権限を確認する。
5. 実機確認後、固定URLで使い始める段階で `npx vercel --prod` を実行する。検索公開は引き続きfalseのまま。ProductionのプロジェクトURLをブックマークして使用する（毎回変わるDeployment URLでは保存先も変わる）。
6. SEO・独自ドメインは実機確認の後で設定する。検索公開するときだけ、確定したHTTPS SITE_URLとPUBLIC_INDEXING=trueを明示して再ビルドする。

CLIから送信するファイルは `.vercelignore` で整理済み。Master Excel、スクリーンショット、テスト・監査ファイルは送信対象から除外し、実カードJSON・アプリソース・public資産を含めます。distに公開するファイルはさらにbuild.cjsの許可リストで限定します。

ローカルで確認する場合：npm run build → npm run preview → http://localhost:4174 。環境変数はPowerShellの `$env:SITE_URL` と `$env:PUBLIC_INDEXING`、またはホスティング管理画面で設定します。`.env`は自動読込しません。

## 8. 人間側で必要な作業

公開ドメイン／Vercelアカウント／Gitリポジトリの用意、公開説明・非公式表記の確認、利用規約（現在はプレースホルダー）と必要なプライバシー説明・運営連絡先の準備、実カードMasterとニュースの出典確認、実機での確認が必要です。今回、有料決済・認証基盤・クラウド・広告・行動追跡は追加していません。

## 9. Search Console

確定した公開URLと、その所有権を確認する手段が必要です。DomainプロパティならDNSへ指定されたTXTレコードを追加する権限、URL-prefixプロパティなら指定されたHTML確認タグ等が必要です。HTMLタグ方式は公開トップテンプレートのheadへ検証タグを追加して再ビルドできます。[所有権確認の公式手順](https://support.google.com/webmasters/answer/9008080?hl=ja)

確認後、https://公開ドメイン/sitemap.xmlを送信し、公開トップをURL検査します。登録は検索掲載や順位を保証するものではありません。[sitemapの公式説明](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

## 10. 公開前の確認点

- 現段階はV0.1の試用公開準備。実認証や端末間同期はなく、実際のQR生成／復号も未実装です。一般の完成サービスとして誤認されない紹介が必要です。
- カードMasterはverified版Excelへ移行済みです。要確認の行・名称未検証のコーデを保持します。ニュースは引き続きダミーデータであり、実在の入手情報として公開しないでください。
- localStorage／IndexedDBはブラウザの削除・端末故障等で失われます。公開ドメイン変更時も自動移行はありません。写真のバックアップはありません。
- noindexはデータ保護やログイン認証ではありません。ユーザーデータは端末内保存を維持します。
- 利用規約は未完成。使用する名称・素材・説明と非公式表記を公開前に確認してください。
- HTTPSで実機のカメラ・写真容量・保存・standalone起動・safe-areaを確認してください。
- 配信はホワイトリストで必要なJS/CSSだけをコピー。監査JSON、テスト、開発サーバー、秘密情報、ユーザー写真はdistに含めません。追跡スクリプトはありません。
- バージョン付きファイル名をまだ導入していないため、配信キャッシュは再検証方式。長期間のimmutableキャッシュは設定していません。公式画像や大量のネットワーク画像は追加していません。

## 検証コマンド

- npm test
- node verify-public.cjs（公開プレビュー起動中）
- node verify-published-app.cjs（公開版に対して既存の画面別検証とUI／タップ監査）

Playwrightの配置が通常のnode_modulesでない場合はPLAYWRIGHT_PATHを設定してください。ローカルHTTPでのブラウザ検証であり、Vercelの実配信・実機インストールは未検証です。まだ外部デプロイは行っていません。

## 今回の検証結果

npm test、verify-public、公開版に対する11本の画面検証・監査がすべて通過しました。公開トップはJavaScript無効でも読め、320／390／1440px幅で横はみ出しはありません。公開版の既存UI監査232条件、4色×2テーマを含むタップ領域検証145条件も通過。公開パスでオープニング・ログイン、写真保存・カード登録・各バインダーモード・QR条件反映・設定保存が機能することを確認しました。

本番／PreviewのSEO切替、実URLのcanonical／OG／sitemap生成、アプリとダミーニュースのnoindex、開発ファイル非配信、404、manifest／アイコン、旧ハッシュURL／旧トレードURL、同一originの保存・再読み込みを検証。公開準備時点のdistは33ファイル・200,697 bytes、JS/CSSは138,141 bytesです。

確認画像：public-top-mobile.png。公開プレビュー：http://localhost:4174/ 。まだ外部公開・Search Console登録はしていません。

## 実Master移行後

カードMasterをverified Excel由来の139件へ置換しました。カードJSONを読み込むboot.jsと再変換スクリプトを追加。Excel更新→npm run master→npm run buildの順で更新します。現在の件数・変換方法・テスト結果はMASTER-MIGRATION.mdを参照してください。

2026-10-09：実番号OCRを追加。依存・自己配信・実機確認はOCR-IMPLEMENTATION.mdを参照。
