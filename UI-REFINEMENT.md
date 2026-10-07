# 小型操作部品とCSS整理の追加修正

## タップ領域
- タイプ／レアリティチップ、compactボタン、トレードの削除・枚数増減、カード登録のサンプル操作を改善。
- ボタン本体は44px高、上下の透明部分は各6px。背景と枠線だけを::beforeで32px高に描画。文字サイズ・横配置・枠線・角丸を維持。
- 負の上下marginで既存のレイアウト高さを維持し、必要な親行だけ安全な余白を確保。横スクロールするレアリティ行は上下6pxのpaddingでタップ領域をクリップしない。
- 32px幅の削除・増減・サンプルは44px幅に広げ、左右marginで表示位置を維持。通常の44pxアイコン操作と非操作ラベルには拡張を追加しない。
- ニュース見出しの下だけ2px広げ、補助ボタンのタップ領域と最初のニュース行の接触を解消。
- 320pxバインダータブの10px文字は変更しない。

## CSS整理
- HTML、JavaScriptの動的class／状態、レスポンシブ規則を確認してから削除。旧ロゴ・プロフィール・ヒーロー・大型統計・旧ローダー・旧登録開始UI等の未使用スタイルと重複宣言を整理。
- ui-tokens.css／buttons.css／ui-controls.css／theme.cssを正式な共通UI定義とする。入力、タブ、ナビ、ヘッダー等の共通指定はui-controls.cssへ集約。
- styles.cssには使用中の画面レイアウト、カードトークン、写真／所持状態、オープニングとログインの遷移、カメラ／QR、レスポンシブ例外を残す。動的状態に必要なため削除しない。
- 比較用の旧CSSはcss-cleanup-baseline.jsonという検証専用データに保持。アプリのHTMLから読み込まれるスタイルシートではない。整理用の一時スクリプトは削除。
- 配信対象CSS5ファイル合計：56,416 → 49,927 bytes。6,489 bytes（11.5%）削減。タップ領域改善の追加CSSを含む。

## 検証
- npm test：データ、検索、所持・保管枚数、3モード、トレード、設定・保存の全テスト通過。
- verify-opening／login／binder／card-views／registration／trade／settings／display／browser：全通過。写真保存、模擬カメラ取得・停止、QR条件反映、画面遷移・再読み込みを含む。
- verify-hit-areas：145条件で4メインカラー×ホワイト／ダーク、320×568／390×844を確認。32pxの描画、44pxの実領域、同じ操作面の隣接領域の非重複、ページ横はみ出しを確認。実touchscreenイベントで表示枠の外側を押し、選択・遷移・削除・入力の成功を確認。
- 固定ナビの背後を通るスクロールコンテンツは、別レイヤーとして領域比較から除外。ナビ内のボタン相互の重複は検証対象。
- verify-ui-audit：4画面サイズ×2テーマ、232画面条件の共通寸法・文字切れ・横はみ出し・主要操作の可視性を監査。
- verify-css-cleanup：同じタップ領域改善ルールを比較の両側へ適用し、CSS削除／集約だけによる表示差分を232条件で検証。
- ブラウザのタッチエミュレーションによる検証。実機iPhone／Androidでの確認は未実施。

## 主な変更ファイル
buttons.css、ui-controls.css、styles.css、theme.css、verify-ui-audit.cjs、verify-hit-areas.cjs、verify-css-cleanup.cjs、UI-AUDIT.md。
結果：ui-audit-results.json、hit-area-results.json、css-cleanup-comparison.json。
