/**
 * 商品名からバッジ（新刊・既刊・特典・グッズ・セット）を自動判定
 */
export const getItemBadge = (name) => {
  if (!name) return null;
  // 特典・ノベルティを最優先で判定
  if (name.includes('特典') || name.includes('ノベルティ') || name.includes('プレゼント')) {
    return { label: '特典', bg: 'bg-green-50 text-green-700 border-green-200' };
  }
  if (name.includes('セット')) return { label: 'セット', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
  if (name.includes('新刊')) return { label: '新刊', bg: 'bg-red-50 text-red-700 border-red-200' };
  if (name.includes('既刊')) return { label: '既刊', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (name.includes('チェキ') || name.includes('アクスタ') || name.includes('アクリル') || name.includes('グッズ') || name.includes('色紙') || name.includes('キーホルダー')) {
    return { label: 'グッズ', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  return null;
};
