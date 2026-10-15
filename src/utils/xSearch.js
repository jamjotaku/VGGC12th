/**
 * X (旧Twitter) のリアルタイム検索・速報ディープリンク生成ユーティリティ
 * すべて `&f=live` (最新順) を指定して現地での即時性を最大化
 */

const BASE_X_SEARCH_URL = 'https://x.com/search';

/**
 * Twitter IDから余分な@や空白を除去
 */
export const cleanTwitterHandle = (id) => {
  if (!id) return '';
  return String(id).trim().replace(/^@+/, '');
};

/**
 * カンマや空白・読点区切りのX ID文字列を配列に分解 (合同サークルや複数売り子に対応)
 */
export const parseTwitterHandles = (handlesStr) => {
  if (!handlesStr) return [];
  return String(handlesStr)
    .split(/[,、\s]+/)
    .map(s => cleanTwitterHandle(s))
    .filter(s => s.length > 0);
};

// 後方互換性のためのエイリアス
export const parseStaffTwitterIds = parseTwitterHandles;

/**
 * サークル主 (合同サークル主含む) ＆ 売り子による最新公式アナウンス・完売・在庫告知を検索するURLを生成
 * @param {Object} circle サークル情報 (twitter_id, circle_name, space_sym, space_num 等)
 * @param {Object} extraInfo Supabaseの追加情報 (twitter_id, staff_twitter 等)
 */
export const getCircleOfficialSearchUrl = (circle, extraInfo = null) => {
  if (!circle) return '';

  const keywords = '(完売 OR 終了 OR 列 OR 在庫 OR 頒布 OR なくなり OR 残り OR お品書き OR 完売報告 OR 設営完了)';

  // 1. サークル主IDの取得 (合同サークルの複数IDもすべてパース)
  const authorIds = [
    ...parseTwitterHandles(circle.twitter_id),
    ...parseTwitterHandles(extraInfo?.twitter_id)
  ];

  // 2. 売り子IDの取得
  const staffIds = parseTwitterHandles(extraInfo?.staff_twitter);

  // 全公式IDリスト (サークル主 + 合同サークル主 + 売り子)
  const allOfficialIds = Array.from(new Set([...authorIds, ...staffIds].filter(Boolean)));

  let query = '';

  if (allOfficialIds.length > 0) {
    // 【公式ID指定モード】サークル主（合同サークル含む）または売り子のアカウントからの投稿をピンポイント抽出
    const fromConditions = allOfficialIds.map(id => `from:${id}`).join(' OR ');
    query = `(${fromConditions}) ${keywords}`;
  } else {
    // 【フェイルセーフ複合クエリモード】ID未登録でも同名の一般日常ツイートを100%弾く
    const spaceWithHyphen = `${circle.space_sym}-${circle.space_num}`;
    const circleName = circle.circle_name;
    const penname = circle.penname || '';
    
    query = `("${circleName}" OR "${penname}") ("${spaceWithHyphen}" OR "#VGGC12th") ${keywords}`;
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
