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
 * 1つのアカウントトークンをパース
 * サポート形式:
 * - "たなか:tanaka_id", "たなか：tanaka_id"
 * - "たなか(@tanaka_id)", "たなか（@tanaka_id）"
 * - "@tanaka_id", "tanaka_id"
 * @param {string} token 
 * @returns {{ name: string | null, handle: string } | null}
 */
export const parseSingleTwitterAccount = (token) => {
  if (!token) return null;
  const s = String(token).trim();
  if (!s) return null;

  // 1. "名前:ID" または "名前：ID" (コロン区切り)
  const colonMatch = s.match(/^([^:：]+)[:：]\s*@?([A-Za-z0-9_]+)$/);
  if (colonMatch) {
    const name = colonMatch[1].trim();
    const handle = colonMatch[2].trim();
    if (handle) return { name: name || null, handle };
  }

  // 2. "名前(@ID)" または "名前（@ID）" (カッコ区切り)
  const parenMatch = s.match(/^([^(@（]+)\s*[(（]@?([A-Za-z0-9_]+)[)）]$/);
  if (parenMatch) {
    const name = parenMatch[1].trim();
    const handle = parenMatch[2].trim();
    if (handle) return { name: name || null, handle };
  }

  // 3. "ID" のみ (先頭の@は除去)
  const handle = cleanTwitterHandle(s);
  if (handle) {
    return { name: null, handle };
  }

  return null;
};

/**
 * カンマ・読点・改行（または空白）区切りの文字列からアカウント配列 ({ name, handle }) を抽出
 * @param {string} rawStr 
 * @returns {Array<{ name: string | null, handle: string }>}
 */
export const parseTwitterAccounts = (rawStr) => {
  if (!rawStr) return [];
  const s = String(rawStr).trim();
  if (!s) return [];

  // カンマ、読点、改行があればそれらで分割。なければ空白で分割。
  let tokens = [];
  if (/[,、\n]/.test(s)) {
    tokens = s.split(/[,、\n]+/);
  } else {
    tokens = s.split(/\s+/);
  }

  const results = [];
  const seenHandles = new Set();

  for (const rawToken of tokens) {
    const parsed = parseSingleTwitterAccount(rawToken);
    if (parsed && parsed.handle && !seenHandles.has(parsed.handle.toLowerCase())) {
      seenHandles.add(parsed.handle.toLowerCase());
      results.push(parsed);
    }
  }

  return results;
};

/**
 * カンマや空白・読点区切りのX ID文字列を配列に分解 (合同サークルや複数売り子に対応)
 * 名前:ID 形式が含まれていても安全に純粋なハンドル名配列を返す
 */
export const parseTwitterHandles = (handlesStr) => {
  return parseTwitterAccounts(handlesStr).map(acc => acc.handle);
};

// 後方互換性のためのエイリアス
export const parseStaffTwitterIds = parseTwitterHandles;

/**
 * 代表ペンネームが連名 (例: "ムチムチP, カリカリ大学芋", "A / B", "A & B") の場合に分割
 * @param {string} pennameStr 
 * @returns {string[]}
 */
export const splitPennames = (pennameStr) => {
  if (!pennameStr) return [];
  const s = String(pennameStr).trim();
  if (!s) return [];
  return s.split(/[,、/／&＆\n]+/).map(p => p.trim()).filter(Boolean);
};

/**
 * サークル主 (合同サークル含む複数人) のアカウント情報配列を取得
 * 名前が明示されていない場合、代表ペンネーム (連名の場合は順に対応) をデフォルト適用！
 * @param {Object} circle サークル情報
 * @param {Object} extraInfo Supabaseの追加情報
 * @returns {Array<{ name: string | null, handle: string }>}
 */
export const getCircleAuthorAccounts = (circle, extraInfo = null) => {
  if (!circle) return [];
  const rawAuthors = [
    circle.twitter_id,
    extraInfo?.twitter_id
  ].filter(Boolean).join(', ');

  const accounts = parseTwitterAccounts(rawAuthors);
  if (accounts.length === 0) return [];

  // サークル代表者のペンネーム (連名の場合は分割配列)
  const defaultNames = splitPennames(circle.penname);

  return accounts.map((acc, index) => {
    // 明示的な名前指定がない場合、対応するインデックスのペンネームを充当
    const displayName = acc.name || (defaultNames[index] || null);
    return {
      name: displayName,
      handle: acc.handle
    };
  });
};

/**
 * 売り子 (複数人) のアカウント情報配列を取得
 * @param {Object} extraInfo 
 * @returns {Array<{ name: string | null, handle: string }>}
 */
export const getCircleStaffAccounts = (extraInfo = null) => {
  if (!extraInfo) return [];
  return parseTwitterAccounts(extraInfo.staff_twitter);
};

/**
 * サークル主 (合同サークル含む複数人) の Twitter ID 配列を取得 (公式速報検索用)
 */
export const getCircleAuthorTwitterIds = (circle, extraInfo = null) => {
  return getCircleAuthorAccounts(circle, extraInfo).map(a => a.handle);
};

/**
 * 売り子 (複数人) の Twitter ID 配列を取得 (公式速報検索用)
 */
export const getCircleStaffTwitterIds = (extraInfo = null) => {
  return getCircleStaffAccounts(extraInfo).map(a => a.handle);
};

/**
 * サークル主 (合同サークル主含む) ＆ 売り子による最新公式アナウンス・完売・在庫告知を検索するURLを生成
 * @param {Object} circle サークル情報 (twitter_id, circle_name, space_sym, space_num 等)
 * @param {Object} extraInfo Supabaseの追加情報 (twitter_id, staff_twitter 等)
 */
export const getCircleOfficialSearchUrl = (circle, extraInfo = null) => {
  if (!circle) return '';

  const keywords = '(完売 OR 終了 OR 列 OR 在庫 OR 頒布 OR なくなり OR 残り OR お品書き OR 完売報告 OR 設営完了)';

  // 1. サークル主IDの取得 (合同サークルの複数IDもすべてパース)
  const authorIds = getCircleAuthorTwitterIds(circle, extraInfo);

  // 2. 売り子IDの取得
  const staffIds = getCircleStaffTwitterIds(extraInfo);

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
