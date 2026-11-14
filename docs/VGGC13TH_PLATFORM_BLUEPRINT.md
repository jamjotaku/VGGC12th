# VGGC 13th 次回移行＆進化ブループリント（「ハコ」の汎用化と10倍使いやすいアプリへ）

本ドキュメントは、**VGGC 12th（2026-11-14開催）** で実証されたオフラインPWA・通路グラフ巡回ルート・簡易POSレジ等の全システムを「入れ物（ハコ）」として保存し、次回 **VGGC 13th** でデータを入れるだけで最低でも現状以上の性能を発揮し、さらに一般参加者・サークル参加者双方にとって圧倒的に使いやすいアプリへ進化させるための設計書です。

---

## 1. アーカイブ済みデータ（2026-11-14 取得完了）

12th の全サークル情報（リポジトリの `public/data.json` ＋ Supabase `circle_info` の最新Xアカウント・お品書き等）は以下のファイルに保存済みです：

- `archive/vggc12th_circles_archive.csv`（Excel/Googleスプレッドシート対応・UTF-8 BOM付、全365サークル）
- `archive/vggc12th_circles_archive.json`（プログラム再利用可能な完全JSON）
- `archive/vggc12th_supabase_circle_info_raw.json`（Supabase `circle_info` テーブル生データ 362件）
- 再取得スクリプト: `scripts/archive-vggc12th.js`

---

## 2. イベント終了1週間後（2026-11-21 以降）の「入れ物化」手順

他ユーザーの振り返り・戦利品確認期間を確保するため、データ消去は **2026-11-21 以降** に以下2ステップで実行します。

### Step A: Supabase データベースのクリーンアップ
Supabase Dashboard の SQL Editor で `supabase/reset_for_next_event.sql` を実行します。
- `shopping_lists` / `register_data` / `circle_info` / `notifications` の中身だけを `TRUNCATE` し、テーブル定義・RLSポリシー・制約はそのまま残します。
- 一般ユーザー（`auth.users`）を削除する場合は、同 SQL 内の Step 5 のコメントを外して実行します（`admin_permissions` に登録された管理者は保持されます）。

### Step B: リポジトリ内のイベント固有データを空にする
```bash
# 対象ファイル確認（ドライラン）
node scripts/reset-to-shell.js

# 実際に空の入れ物状態へリセット
node scripts/reset-to-shell.js --execute
```
実行後、`git add` → `git commit` して「完全な入れ物状態」のベースラインを確定させます。

---

## 3. VGGC 13th で「データを追加するだけ」で最低でも現状の性能を発揮させるチェックリスト

次回イベントの開催情報とサークルリストが公開されたら、以下のデータと設定を差し替えるだけで全機能（検索・マップ・巡回ルート・タイムライン・完全オフラインPWA・簡易POSレジ）がそのまま稼働します。

### A. 差し替えるデータファイル（5点）
1. `public/data.json`: 新しい `circles` 配列とブロック順 `sort_order`
2. `public/map.jpg` & `public/map.pdf`: 新会場の公式マップ画像・PDF
3. `src/map_coords.json` & `public/map_coords.json`: 新マップ上の各スペース座標（`public/map_editor.html` で作成可能）
4. `src/map_routes.json` & `public/map_routes.json`: 新マップの通路グラフ（`public/map_editor.html` の「巡回ルートグラフ編集」＆「552ブース交差＆到達チェック」で貫通0件を検証）
5. `public/ogp.png` & `public/icons/`: 必要に応じて13th用のOGP画像を更新

### B. 13th 準備フェーズで `src/eventConfig.js` に一元化すべきハードコード箇所
現状、以下のファイルに `VGGC 12th` / `2026-11-14` / `Black Stance` 固有の文字列が残っています。次回立ち上げ時に `src/eventConfig.js` 1ファイルへ集約することで、14th 以降は設定1ファイル＋データ差し替えだけで完全対応できるようになります：
- `src/constants.js`: `STORAGE_KEY`（`vggc13th_saved_list` 等）、`EVENT_INFO`（イベント名、開催日 `YYYY-MM-DD`、開始/終了時刻）
- `vite.config.js`: PWA `manifest.name` / `short_name` / `description`
- `src/App.vue`: ナビバー表示名、localStorage キープレフィックス、`DEFAULT_NOTIFICATIONS`、Xシェア用ハッシュタグ（`#VGGC13th`）、`REGISTER_CIRCLE_ID` / 解放アカウント設定
- `src/components/EventCountdownBar.vue` / `PersonalTimeline.vue` / `MemoDashboard.vue` / `ReceiptModal.vue`: 当日日付表示・公式タイムテーブル定義・レシートファイル名
- `scripts/test-offline-rehearsal.js` / `scripts/test-route-graph.js`: 新データ件数・新サークルIDに合わせた自動テストの更新

---

## 4. 10倍・20倍使いやすくするための VGGC 13th 進化ロードマップ

### 🛍️ 一般参加者向けアップグレード
1. **リアルタイム通行規制・一方通行対応の巡回ルート**
   - 当日「この通路は待機列で通行止め」「ここは一方通行」となった際に、マップ上のエッジを1タップで一時通行止め／片側通行にして即座に迂回ルートを再計算。
2. **お品書き・新刊情報の一括取り込み（Admin効率化）**
   - カタログ公開直後に X（Twitter）リストやフォーム回答から CSV/JSON で `circle_info` を一括インポートし、更新漏れゼロ・高速反映を実現。
3. **代行・同行者向け「複数リスト切替 ＆ リアルタイム共有」**
   - 「自分用」「友達の代行分」をタブやフィルタで分け、買えたものをリアルタイムに相手へ共有可能に。
4. **オフライン画像プリフェッチボタン**
   - 会場へ出発する前に自宅の Wi-Fi で「買い物リストに入れたサークルのお品書き画像をすべて事前キャッシュ」するワンタップボタン。

### 🏪 サークル参加者向けアップグレード（簡易レジ v2）
1. **全参加サークルへの汎用開放（セルフ紐付け）**
   - 今回の `Jamj__Otaku` 固定を卒業し、管理画面またはサークル専用招待コードで希望するどのサークルでも自分のブース専用POSレジを利用可能に。
2. **複数端末同時レジ打ち（売り子2〜3人対応）**
   - 親タブレット＋売り子スマホで同一サークルの在庫・売上をリアルタイム同期（加算イベントログ方式でオフライン復帰時の競合も完全解決）。
3. **決済方法の記録（現金 / PayPay 等）＆ 金種別つり銭準備ガイド**
   - 会計時に「現金 / キャッシュレス」を記録でき、終了後の現金実査（レジ内の現金と理論売上の照合）が一瞬で完了。
4. **セット割・まとめ買い自動割引 ＆ イベント後精算CSV出力**
   - 「3種セットで〇〇円引き」の自動計算や、担当別の売上・残数・頒布率をそのまま確定申告やメンバー精算に使える CSV/PDF として出力。
