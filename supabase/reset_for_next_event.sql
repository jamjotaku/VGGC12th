-- ==============================================================================
-- VGGC 次回イベント（VGGC 13th）向け データベース初期化（入れ物化）SQL
-- ⚠️ 実行タイミング: VGGC 12th 終了1週間後（2026-11-21 以降）に実行してください。
-- ⚠️ 実行前に archive/vggc12th_circles_archive.* が作成済みであることを確認してください。
--
-- この SQL はテーブル構造・制約・RLSポリシーをすべて保持したまま、
-- 今回限りのイベントデータおよび他ユーザーの個人データのみを消去します。
-- ==============================================================================

-- 1. ユーザー買い物リスト（他ユーザーの個人データ）を全削除
TRUNCATE TABLE public.shopping_lists RESTART IDENTITY CASCADE;

-- 2. サークル参加レジデータ（売上履歴・在庫データ）を全削除
TRUNCATE TABLE public.register_data RESTART IDENTITY CASCADE;

-- 3. 今回のお品書き・タグ・補足情報（circle_info）を全削除
TRUNCATE TABLE public.circle_info RESTART IDENTITY CASCADE;

-- 4. 今回のお知らせ（notifications）を全削除
TRUNCATE TABLE public.notifications RESTART IDENTITY CASCADE;

-- 5. （任意）一般ユーザーアカウント（auth.users）の整理
-- ※ 管理者アカウント（admin_permissions に登録されているユーザー）以外の一般ユーザーを削除する場合のみ、
--    以下のコメントを外して実行してください。
/*
DELETE FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM public.admin_permissions WHERE user_id IS NOT NULL
);
*/

-- 確認用クエリ（すべて 0 件になっていれば完了）
SELECT 'shopping_lists' AS table_name, count(*) AS row_count FROM public.shopping_lists
UNION ALL
SELECT 'register_data', count(*) FROM public.register_data
UNION ALL
SELECT 'circle_info', count(*) FROM public.circle_info
UNION ALL
SELECT 'notifications', count(*) FROM public.notifications;
