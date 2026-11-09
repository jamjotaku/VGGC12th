-- ==============================================================================
-- VGGC 12th: サークル参加モード（簡易レジ機能 v1）用テーブル & RLS 設定
-- 対象サークル: M-15-16「Black Stance」(circle_id: 10ebdde686d91dfe1ab4a63376c7b377)
-- 対象アカウント: Jamj__Otaku (jamj__otaku@vggc.dummy.local)
-- Supabase Dashboard の SQL Editor に貼り付けて「RUN」を実行してください。
-- ==============================================================================

-- 1. register_data テーブル作成 (shopping_lists と同じ user_id キー + JSONB 方式)
CREATE TABLE IF NOT EXISTS public.register_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  circle_id text NOT NULL DEFAULT '10ebdde686d91dfe1ab4a63376c7b377',
  state_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS (Row Level Security) 有効化
ALTER TABLE public.register_data ENABLE ROW LEVEL SECURITY;

-- 3. 本人の行のみ読み書き許可するポリシー
DROP POLICY IF EXISTS "Users can manage own register_data" ON public.register_data;

CREATE POLICY "Users can manage own register_data"
  ON public.register_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. 既存の Jamj__Otaku アカウントがあれば初期行を自動シード (任意・フロント側でも自動初期化されます)
INSERT INTO public.register_data (user_id, circle_id, state_data)
SELECT id, '10ebdde686d91dfe1ab4a63376c7b377', '{}'::jsonb
FROM auth.users
WHERE lower(email) = 'jamj__otaku@vggc.dummy.local'
ON CONFLICT (user_id) DO NOTHING;
