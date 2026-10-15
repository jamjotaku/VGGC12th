/**
 * X (旧Twitter) のリアルタイム検索・速報ディープリンク生成ユーティリティ
 * すべて `&f=live` (最新順) を指定して現地での即時性を最大化
 */

const BASE_X_SEARCH_URL = 'https://x.com/search';

/**
 * サークル主本人の最新アナウンス・完売・在庫告知を検索するURLを生成
 * @param {Object} circle サークル情報 (twitter_id, circle_name 等)
 */
export const getCircleOfficialSearchUrl = (circle) => {
  if (!circle) return '';

  let query = '';
  const keywords = '(完売 OR 終了 OR 列 OR 在庫 OR 頒布 OR なくなり OR 残り OR お品書き OR 完売報告)';

  if (circle.twitter_id) {
    // サークル主本人の直近ツイートから在庫・列情報を絞り込み
    const cleanId = circle.twitter_id.replace(/^@/, '');
    query = `from:${cleanId} ${keywords}`;
  } else {
    // Twitter ID未設定の場合はサークル名で検索
    query = `"${circle.circle_name}" ${keywords}`;
  }

  return `${BASE_X_SEARCH_URL}?q=${encodeURIComponent(query)}&f=live`;
};

/**
 * 一般参加者によるサークルの口コミ・目撃情報・列状況を検索するURLを生成
 * @param {Object} circle サークル情報 (circle_name, space_sym, space_num)
 */
export const getCirclePublicSearchUrl = (circle) => {
  if (!circle) return '';

  const spaceWithHyphen = `${circle.space_sym}-${circle.space_num}`;
  const spaceCompact = `${circle.space_sym}${circle.space_num}`;
  const circleName = circle.circle_name;

  // サークル名 または スペース番号、かつ 完売/列/最後尾 などの現地ワード
  const query = `("${circleName}" OR "${spaceWithHyphen}" OR "${spaceCompact}") (完売 OR 列 OR 最後尾 OR 売り切れ OR 並び OR 混雑)`;

  return `${BASE_X_SEARCH_URL}?q=${encodeURIComponent(query)}&f=live`;
};

/**
 * 会場全体（#VGGC12th）のカテゴリ別リアルタイム速報URLを生成
 * @param {'soldout' | 'line' | 'all'} type 
 */
export const getEventLiveSearchUrl = (type = 'all') => {
  let query = '#VGGC12th';

  if (type === 'soldout') {
    query = '#VGGC12th (完売 OR 売り切れ OR 終了 OR なくなった)';
  } else if (type === 'line') {
    query = '#VGGC12th (列 OR 最後尾 OR 待機列 OR 混雑 OR シャッター)';
  }

  return `${BASE_X_SEARCH_URL}?q=${encodeURIComponent(query)}&f=live`;
};
