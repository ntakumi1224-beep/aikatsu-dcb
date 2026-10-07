# iPhoneカメラ起動の調査・修正（2026-10-08）

## 確認できた既存実装

カード登録は「カメラを起動」のタップでgetUserMedia。背面ideal + 1280×720のideal指定。videoにはautoplay / muted / playsinlineが存在した。QRは画面遷移後の自動起動で、facingModeはenvironment。画面移動、hidden、pagehide時にtrack停止は実装済みだった。

不十分だった点：取得失敗は原因を区別しない表示、フォールバックなし。カード登録は全体再描画でvideoを再作成し、video.playの失敗を空catchで無視。QRは再生失敗後にstreamが残る可能性があった。これらは起動・再生・復帰の不安定要因だが、今回のiPhoneで発生した原因は未確定。公開URL受領後、実配信を読み取り確認した。HTTPSでHTTP200、Permissions-Policyはcamera=(self)を許可。Windows Edgeで当該URLのisSecureContext=true、mediaDevicesとgetUserMediaあり、camera policy許可、videoのautoplay/muted/playsinlineありを確認した。配信版にはcamera.jsがまだなく、旧処理のまま。iPhoneでのAPI/権限/デバイス状態は未確認。

## 修正

camera.jsを共通モジュールに追加。カード登録とQRプレビューで使用する。

- isSecureContext、mediaDevices/getUserMedia、取得可能な範囲でPermissions-Policyのcamera許可を事前確認。診断値をconsole.infoに記録。
- 最初は `{video:{facingMode:{ideal:"environment"}},audio:false}`。サイズ・exact指定なし。
- 背面優先取得が失敗したら `{video:true,audio:false}` へ一度フォールバック。NotAllowedError / SecurityErrorは拒否・制限を尊重し自動再要求しない。
- autoplay、muted、defaultMuted、playsInlineのプロパティと属性をstream設定前に設定。srcObjectへ取得streamを代入し、video.playをawaitする。
- カード登録は同じvideoノードを再描画後も利用。srcObjectの不要な再代入・再生要求を避ける。
- 起動ボタンはユーザータップから開始。「もう一度試す」でページ再読込なしの再試行。
- QRは従来の即カメラを維持し、失敗時は手動の「もう一度試す」、中断後は「カメラを起動」で復帰できる。実QR生成/復号は未実装のまま。
- 取得失敗と再生失敗をconsole.warnにerror.name/error.messageで記録。再生失敗時にもstreamを停止。
- 再起動前・登録終了・遷移・ブラウザバック・hidden・pagehideでtrack停止。非同期取得中に離れた場合も、遅れて返ったstreamを停止。登録とQRで同時にカメラを保持しない。
- pagehideでは登録画面のマウントを維持し、BFCacheからのpageshowで操作状態を復元する。外部ページから戻った場合も起動ボタンを使えるようにする。
- ロック・バックグラウンド復帰後は勝手にカメラを再開せず、起動ボタンで再開。

## エラー表示

|名前|表示|
|---|---|
|NotAllowedError（取得）|カメラへのアクセスが許可されていません。ブラウザまたは端末の設定からカメラを許可してください。|
|NotFoundError / OverconstrainedError（フォールバックも失敗）|利用できるカメラが見つかりません。|
|NotReadableError|カメラを開始できません。他のアプリがカメラを使用していないか確認してください。|
|SecurityError / HTTPSやAPIの不在 / Policyで禁止|この環境ではカメラを使用できません。|
|その他|カメラを開始できませんでした。|
|NotAllowedError（映像再生）|映像を再生できませんでした。「もう一度試す」をタップしてください。|

権限拒否、端末故障・占有などの実原因をWebページからすべて判別できるわけではない。エラー名と発生段階で案内し、設定変更や他アプリ終了後に再試行する。

## 実機確認手順（人間側）

1. 修正版をVercelへ再デプロイし、Safariで固定HTTPS URLを通常タブから開く。アプリ内埋込ブラウザの確認は後に行う。
2. カード登録へ進む。自動で権限要求されないこと、「カメラを起動」タップで許可ダイアログが出ることを確認。許可して縦持ちで背面映像を確認。
3. 確認登録/高速登録の切替、番号照合、撮影の前後で映像が維持されることを確認。撮影後の写真と所持枚数を確認。
4. 登録終了→もう一度登録、ホームへ移動→戻る、ブラウザバックを繰り返す。離れた画面ではカメラ使用表示が消えることを確認。
5. カメラ動作中に画面ロック・解除、他アプリへ切替・復帰を行う。「カメラを起動」から再開できることを確認。
6. 一度権限を拒否する。原因別文言と「もう一度試す」が出ることを確認。Safari/ブラウザのサイト設定や端末側のカメラ許可を変更して再試行。
7. トレード→QRを読み取る。カメラプレビューを確認し、自動起動失敗時は「もう一度試す」。実QRの復号を期待せずデモ動作を確認。
8. iOS上の普段使用する他ブラウザでも2〜7を確認。埋込ブラウザでAPIがない場合はSafariで開いて比較。
9. 失敗時は公開URL、iOS/ブラウザバージョン、表示文言、許可の選択結果を記録。MacのSafari Web Inspectorを使える場合は[DCBCamera] environmentとerror.name/error.messageを確認する。

## テスト

- npm test：既存5本と新規test-camera.cjs通過。
- test-camera：背面失敗→汎用取得、拒否時の再要求抑止、API/HTTPS/Policy不在、6種エラーとログ、再試行、再生失敗の停止、取得中キャンセル、hidden/pagehide、カメラ排他を再現。
- verify-camera：公開/app/で登録の手動起動、原因別表示、videoノード維持、再試行、hidden/復帰、終了、QR再試行、遷移/バック/ページ離脱の停止を検証。
- 既存の登録・トレード画面テストも公開パスで通過。公開ビルド・verify-public・UI監査232条件・タップ領域監査も通過。テスト用映像はcanvasの合成MediaStream。

Windows Edgeの自動検証であり、iPhoneの物理カメラ・権限UI・iOSブラウザで動作確認済みとは判定していない。外部デプロイも今回の作業では実施していない。

## 参照

[WebKit：iOS video再生ポリシー](https://webkit.org/blog/6784/new-video-policies-for-ios/)

[MDN：getUserMediaのsecure context、constraints、エラー](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

## 提供された実機環境・実配信確認

URL：https://aikatsu-dcb.vercel.app 。使用ブラウザとしてGoogle・Opera、バージョンとして26.6.1の回答を受領（どのアプリ/OSのバージョンかは未確定）。Safari実機での結果はまだない。Googleアプリ内ブラウザとChromeは区別して記録する。埋込WebViewはアプリ側の権限・設定に依存するため、Web側だけで一律に有効化できない。

配信中の/app/・boot.js・registration.js・trade.jsはHTTP200。camera.jsはHTTP404だが、旧boot.jsはcamera.jsを参照しないため現在の参照切れではない。今回の修正を利用するには再デプロイが必要。
