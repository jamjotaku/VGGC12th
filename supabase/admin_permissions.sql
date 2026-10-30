-- ==============================================================================
-- VGGC 12th: 管理者権限に「Jamj__Otaku」を追加するRLSポリシー更新
-- Supabase Dashboard の SQL Editor に貼り付けて「RUN」を実行してください。
-- ==============================================================================

-- 1. circle_info テーブルの RLS ポリシー更新 (サークル情報の保存・編集権限)
DROP POLICY IF EXISTS "Allow admin to insert/update" ON public.circle_info;

CREATE POLICY "Allow admin to insert/update"
  ON public.circle_info FOR ALL
  USING (
    lower(auth.jwt() ->> 'email') IN (
      'admin@vggc.dummy.local',
      'jamj__otaku@vggc.dummy.local'
    )
    OR (auth.jwt() ->> 'email') ILIKE '%admin%'
    OR (auth.jwt() ->> 'email') ILIKE '%jamj%'
  )
  WITH CHECK (
    lower(auth.jwt() ->> 'email') IN (
      'admin@vggc.dummy.local',
      'jamj__otaku@vggc.dummy.local'
    )
    OR (auth.jwt() ->> 'email') ILIKE '%admin%'
    OR (auth.jwt() ->> 'email') ILIKE '%jamj%'
  );
