-- ==============================================================================
-- VGGC 12th: 通知 (notifications) テーブル定義 & RLSポリシー
-- Supabase SQL Editor に貼り付けて「RUN」を実行してください。
-- ==============================================================================

-- 1. notifications テーブル作成
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,                          -- 通知タイトル (例: 一般参加者受付が開始されました)
  body text not null,                           -- 通知本文・詳細
  type text not null default 'info',            -- 'info' (青) | 'success' (緑) | 'warning' (黄) | 'urgent' (赤) | 'feature' (紫)
  category text not null default 'announcement',-- 'announcement' (全体告知) | 'official' (公式予定) | 'maintenance' (システム)
  link_url text,                                -- リンクURL (任意: アプリ内タブや外部X告知)
  is_pinned boolean not null default false,      -- 最上部固定ピン留め
  expires_at timestamptz                        -- 自動非表示日時 (任意)
);

-- 2. Row Level Security (RLS) を有効化
alter table public.notifications enable row level security;

-- 3. 全員（未ログイン・匿名含む）に SELECT (閲覧) を許可
drop policy if exists "notifications_select_policy" on public.notifications;
create policy "notifications_select_policy"
  on public.notifications
  for select
  using (true);

-- 4. 認証ユーザーまたはサービスロールのみ INSERT / UPDATE / DELETE を許可
drop policy if exists "notifications_insert_policy" on public.notifications;
create policy "notifications_insert_policy"
  on public.notifications
  for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

drop policy if exists "notifications_update_policy" on public.notifications;
create policy "notifications_update_policy"
  on public.notifications
  for update
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');

drop policy if exists "notifications_delete_policy" on public.notifications;
create policy "notifications_delete_policy"
  on public.notifications
  for delete
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- 5. インデックス作成 (表示順の高速化)
create index if not exists idx_notifications_created_at on public.notifications (created_at desc);
create index if not exists idx_notifications_pinned on public.notifications (is_pinned desc, created_at desc);

-- 6. 初期プリセットアナウンスデータの投入 (サンプル)
insert into public.notifications (title, body, type, category, is_pinned, link_url)
values
  (
    'VGGC 12th お買い物支援ツールへようこそ！',
    '当日タイムスケジュール、お品書き拡大、複数推し絞り込みなど大型新機能が追加されました。オフラインでも安心してご利用いただけます。',
    'feature',
    'announcement',
    true,
    null
  ),
  (
    '【公式】11/14(土) 当日スケジュールのご案内',
    '09:45 受付開始、10:00 サークル入場/更衣室開場、12:00 即売会開会、15:30 終了、15:45 アフターイベントとなります。',
    'official',
    'official',
    false,
    null
  );
