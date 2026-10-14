/**
 * 買い物リストから両替・金種目安（千円札、500円玉、100円玉）を自動逆算
 */
export const calculateCurrencyBreakdown = (savedList) => {
  let bills1000 = 0; // 千円札
  let coins500 = 0;  // 500円玉
  let coins100 = 0;  // 100円玉
  let totalAmount = 0;

  if (!savedList) {
    return { totalAmount: 0, bills1000: 0, coins500: 0, coins100: 0 };
  }

  Object.entries(savedList).forEach(([key, item]) => {
    if (key.startsWith('__')) return;
    const price = Number(item.price) || 0;
    if (price <= 0) return;

    totalAmount += price;

    // 各サークルの支払いごとにお釣りが出ない内訳を算出
    let rem = price;
    const b1000 = Math.floor(rem / 1000);
    bills1000 += b1000;
    rem %= 1000;

    const c500 = Math.floor(rem / 500);
    coins500 += c500;
    rem %= 500;

    const c100 = Math.floor(rem / 100);
    coins100 += c100;
  });

  return {
    totalAmount,
    bills1000,
    coins500,
    coins100
  };
};
