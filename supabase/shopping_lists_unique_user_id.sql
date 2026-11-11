-- ==============================================================================
-- VGGC 12th: shopping_lists.user_id の UNIQUE 制約確認・追加 & RLS ポリシー整備
-- 目的: upsert(..., { onConflict: 'user_id' }) による確実なリスト保存・端末間同期の担保
-- Supabase Dashboard の SQL Editor に貼り付けて「RUN」を実行してください（何回実行しても安全です）。
-- ==============================================================================

-- 1. 万一同一 user_id の重複行が存在する場合、データ量が多く更新が新しい1行だけを残して重複を整理
DELETE FROM public.shopping_lists a
USING (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY
             length(COALESCE(list_data::text, '{}')) DESC,
             COALESCE(updated_at, '1970-01-01'::timestamptz) DESC,
             id DESC
         ) AS rn
  FROM public.shopping_lists
  WHERE user_id IS NOT NULL
) b
WHERE a.id = b.id
  AND b.rn > 1;

-- 2. shopping_lists.user_id に UNIQUE 制約（または PRIMARY KEY）がまだ無い場合のみ追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.shopping_lists'::regclass
      AND c.contype IN ('u', 'p')
      AND array_length(c.conkey, 1) = 1
      AND a.attname = 'user_id'
  ) THEN
    ALTER TABLE public.shopping_lists
      ADD CONSTRAINT shopping_lists_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3. RLS（Row Level Security）ポリシーの確認・整備（本人の INSERT / UPDATE / SELECT + 公開リストの SELECT）
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own shopping_list" ON public.shopping_lists;
CREATE POLICY "Users can manage own shopping_list"
  ON public.shopping_lists
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read public shopping_lists" ON public.shopping_lists;
CREATE POLICY "Anyone can read public shopping_lists"
  ON public.shopping_lists
  FOR SELECT
  USING (is_public = true);
