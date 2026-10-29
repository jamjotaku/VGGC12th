// src/domain/receipt/receiptCalculator.js

/**
 * 買い物リストとサークルマスターデータから戦利品レシート明細・集計データを計算する純粋関数
 * （外部依存なし・単一責務・テスト容易）
 * 
 * @param {Object} savedList - App state (key: circle_id or special keys)
 * @param {Array} circles - サークルマスターデータ配列
 * @returns {Object} receiptData
 */
export function calculateReceiptSummary(savedList = {}, circles = []) {
  const circleMap = new Map();
  for (const c of circles) {
    circleMap.set(c.circle_id, c);
  }

  const budget = Number(savedList['__BUDGET__']) || 0;
  const items = [];
  let totalSpent = 0;

  for (const [key, val] of Object.entries(savedList)) {
    if (key.startsWith('__')) continue;
    if (!val || typeof val !== 'object') continue;

    // 「購入済み」サークルのみを対象（未購入はレシートに含めない）
    if (val.bought) {
      const circle = circleMap.get(key) || {
        circle_id: key,
        circle_name: '登録サークル',
        space_sym: '?',
        space_num: '00',
        author: ''
      };

      const price = Number(val.price) || 0;
      totalSpent += price;

      items.push({
        id: key,
        name: circle.circle_name || 'サークル名未設定',
        space: `${circle.space_sym || '?'}-${circle.space_num || '00'}`,
        author: circle.author || '',
        price,
        priority: val.priority || 'B',
        memo: val.memo || ''
      });
    }
  }

  // スペース配置順（A-01 -> N-xx）にソート
  items.sort((a, b) => a.space.localeCompare(b.space, undefined, { numeric: true }));

  // レシート番号（日付 + ランダム4桁）
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const receiptNo = `VGGC-1114-${randNum}`;

  // 予算との差額
  const budgetDiff = budget > 0 ? (totalSpent - budget) : 0;

  return {
    receiptNo,
    issuedAt: new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }),
    items,
    itemCount: items.length,
    totalSpent,
    budget,
    budgetDiff,
    isOverBudget: budgetDiff > 0
  };
}

/**
 * X (Twitter) シェア用テキスト整形
 * @param {Object} summary - calculateReceiptSummary の戻り値
 * @returns {string}
 */
export function generateReceiptShareText(summary) {
  const lines = [
    `🏆 本日のVGGC 12th 戦利品レシート！`,
    `【合計】¥${summary.totalSpent.toLocaleString()} (${summary.itemCount}サークル制覇)`
  ];

  if (summary.budget > 0) {
    if (summary.isOverBudget) {
      lines.push(`⚠️ 予算オーバー: +¥${summary.budgetDiff.toLocaleString()}`);
    } else {
      lines.push(`✨ 予算内セーフ！ 残り: ¥${Math.abs(summary.budgetDiff).toLocaleString()}`);
    }
  }

  lines.push('');
  lines.push('#VGGC12th #VGGC戦利品 #ぶいすぽ');
  lines.push('https://vggc-12th.vercel.app/');

  return lines.join('\n');
}
