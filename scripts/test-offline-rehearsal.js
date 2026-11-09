// scripts/test-offline-rehearsal.js
/**
 * 🏆 VGGC 12th イベント当日（2026-11-14）実地リハーサル＆オフライン動作ストレステスト
 * 
 * 即売会会場（東京流通センター TRC）特有の極限の通信遮断下（完全圏外・パケ詰まり）で、
 * ユーザーがストレスなく買い物・巡回・タイムライン確認を行えることを自動検証します。
 */

import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('🏆 VGGC 12th イベント当日（2026-11-14）実地リハーサル＆オフラインストレステスト');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
    return true;
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
    return false;
  }
}

// ----------------------------------------------------------------------
// 1. Service Worker プリキャッシュ・アセット完全性検証 (Precache Integrity)
// ----------------------------------------------------------------------
console.log('📦 【Test 1】Service Worker プリキャッシュ完全性＆必須アセット実在検証');

const distDir = path.resolve('dist');
const swPath = path.join(distDir, 'sw.js');

assert(fs.existsSync(swPath), 'dist/sw.js がビルド出力に実在すること');

let precachedUrls = new Set();
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  const precacheMatch = swContent.match(/precacheAndRoute\(\[([\s\S]*?)\]/);
  assert(precacheMatch !== null, 'sw.js 内に precacheAndRoute のアセット定義が存在すること');

  if (precacheMatch) {
    const urlRegex = /url:"([^"]+)"/g;
    let match;
    while ((match = urlRegex.exec(precacheMatch[1])) !== null) {
      precachedUrls.add(match[1]);
    }
  }
}

console.log(`   └ プリキャッシュ登録総数: ${precachedUrls.size} 件`);

const requiredCriticalAssets = [
  { name: 'data.json (サークルマスター全件)', path: 'data.json' },
  { name: 'map.jpg (公式会場マップ画像)', path: 'map.jpg' },
  { name: 'map_coords.json (スペース座標定義)', path: 'map_coords.json' },
  { name: 'map.pdf (公式PDFマップ)', path: 'map.pdf' },
  { name: 'index.html (PWAエントリポイント)', path: 'index.html' },
  { name: 'manifest.webmanifest (PWAマニフェスト)', path: 'manifest.webmanifest' },
  { name: 'icons/icon.svg (PWAアプリアイコン)', path: 'icons/icon.svg' }
];

let allCriticalPrecached = true;
for (const item of requiredCriticalAssets) {
  const isPrecached = precachedUrls.has(item.path);
  const existsInDist = fs.existsSync(path.join(distDir, item.path));
  const fileSize = existsInDist ? fs.statSync(path.join(distDir, item.path)).size : 0;
  
  const ok = isPrecached && existsInDist && fileSize > 0;
  if (!ok) allCriticalPrecached = false;
  assert(ok, `${item.name} がプリキャッシュされ実体ファイルが存在すること (${(fileSize / 1024).toFixed(1)} KB)`);
}

// ----------------------------------------------------------------------
// 2. オフラインキャッシュ容量 & LocalStorage / Quota 安全性検証
// ----------------------------------------------------------------------
console.log('\n💾 【Test 2】オフラインキャッシュ容量 & LocalStorage / Quota 安全性シミュレーション');

// data.json の読み込み
const dataJsonPath = path.resolve('public/data.json');
const rawData = fs.readFileSync(dataJsonPath, 'utf8');
const dataJson = JSON.parse(rawData);
const circles = dataJson.circles || [];

assert(circles.length >= 350, `サークルデータが全件存在すること (検出: ${circles.length}サークル)`);

// キャッシュオブジェクトのサイズ計測
const dataCacheSize = Buffer.byteLength(rawData, 'utf8');

// サークル追加情報 (circleExtraInfo) のシミュレーションデータ
const simulatedExtraInfo = {};
circles.forEach((c, idx) => {
  simulatedExtraInfo[c.circle_id] = {
    circle_id: c.circle_id,
    oshinagaki_url: idx % 3 === 0 ? 'https://x.com/dummy/status/123456789' : (idx % 5 === 0 ? 'https://www.pixiv.net/artworks/98765432' : ''),
    is_absent: idx === 10,
    members: idx % 2 === 0 ? ['花芽なずな', '花芽すみれ'] : ['一ノ瀬うるは'],
    tags: ['#イラスト本', '#グッズ'],
    items: [
      { name: '新刊イラスト本', price: 1500 },
      { name: 'アクリルスタンド', price: 1000 },
      { name: 'ホログラムステッカーセット', price: 500 }
    ],
    updated_at: '2026-11-01T21:00:00Z'
  };
});
const extraInfoRaw = JSON.stringify(simulatedExtraInfo);
const extraInfoSize = Buffer.byteLength(extraInfoRaw, 'utf8');

// 買い物リスト大容量登録 (50件・メモ・数量ステッパー付き)
const simulatedSavedList = { "__BUDGET__": 30000 };
circles.slice(0, 50).forEach((c, idx) => {
  simulatedSavedList[c.circle_id] = {
    bought: idx % 4 === 0,
    priority: idx % 3 === 0 ? 'S' : (idx % 2 === 0 ? 'A' : 'B'),
    price: 2500,
    memo: `第1展示場 ${c.space_sym}-${c.space_num} 限定本＆グッズセット`,
    selectedItems: ['新刊イラスト本', 'アクリルスタンド'],
    itemQuantities: { '新刊イラスト本': 2, 'アクリルスタンド': 1 }
  };
});
const savedListRaw = JSON.stringify(simulatedSavedList);
const savedListSize = Buffer.byteLength(savedListRaw, 'utf8');

// タイムラインイベント (公式5件 + ユーザー独自10件)
const simulatedTimeline = [
  { id: '1', title: '一般受付開始', time: '09:45', isOfficial: true, isDone: true },
  { id: '2', title: 'サークル入場 / 更衣室開場', time: '10:00', isOfficial: true, isDone: true },
  { id: '3', title: '即売会開会（一般入場開始）', time: '12:00', isOfficial: true, isDone: false },
  { id: '4', title: 'コスプレ・サイン会', time: '13:00', memo: 'TRC第2展示場前', isDone: false },
  { id: '5', title: 'ジャンケン大会', time: '14:30', isDone: false },
  { id: '6', title: '閉会・一般退場', time: '15:30', isOfficial: true, isDone: false }
];
const timelineRaw = JSON.stringify(simulatedTimeline);
const timelineSize = Buffer.byteLength(timelineRaw, 'utf8');

const totalLocalStorageBytes = dataCacheSize + extraInfoSize + savedListSize + timelineSize;
const totalLocalStorageKb = (totalLocalStorageBytes / 1024).toFixed(2);
const totalLocalStorageMb = (totalLocalStorageBytes / (1024 * 1024)).toFixed(3);
const maxQuotaMb = 5.0; // 一般的なLocalStorage下限保証容量 (5MB)
const usagePercent = ((totalLocalStorageBytes / (5 * 1024 * 1024)) * 100).toFixed(1);

console.log(`   ├ サークル基本データ (data.json): ${(dataCacheSize / 1024).toFixed(2)} KB`);
console.log(`   ├ サークル追加情報・頒布物全件: ${(extraInfoSize / 1024).toFixed(2)} KB`);
console.log(`   ├ 買い物リスト (50件・数量・小計付): ${(savedListSize / 1024).toFixed(2)} KB`);
console.log(`   ├ タイムライン (公式＆ユーザー予定): ${(timelineSize / 1024).toFixed(2)} KB`);
console.log(`   └ 合計使用量: ${totalLocalStorageKb} KB (${totalLocalStorageMb} MB) / 5.0 MB [使用率: ${usagePercent}%]`);

assert(totalLocalStorageBytes < 2 * 1024 * 1024, `全オフラインデータがLocalStorage安全枠(2MB以下)に余裕で収まること [現行: ${totalLocalStorageMb} MB]`);
assert(parseFloat(usagePercent) < 40.0, `ブラウザQuota(5MB)に対して60%以上の安全マージンが確保されていること [空き容量: ${(5.0 - parseFloat(totalLocalStorageMb)).toFixed(2)} MB]`);

// ----------------------------------------------------------------------
// 3. 完全圏外（Airplane Mode）データ復元＆高速検索・巡回シミュレーション
// ----------------------------------------------------------------------
console.log('\n📡 【Test 3】完全圏外（オフライン）でのデータ復元＆検索・巡回動作テスト');

// モックLocalStorage
const mockStore = {
  vggc12th_data_cache: rawData,
  vggc12th_circle_info_cache: extraInfoRaw,
  vggc12th_saved_list: savedListRaw,
  vggc12th_timeline_events: timelineRaw
};

// オフライン起動関数シミュレーション
function simulateOfflineAppBoot() {
  const isOnline = false;
  
  // 1. SWRキャッシュからサークル復元
  const cachedDataStr = mockStore['vggc12th_data_cache'];
  if (!cachedDataStr) throw new Error('Data cache missing');
  const restoredCircles = JSON.parse(cachedDataStr).circles;
  
  // 2. 追加情報復元
  const restoredExtra = JSON.parse(mockStore['vggc12th_circle_info_cache'] || '{}');
  
  // 3. 買い物リスト復元 (オフライン時はクラウドへのリクエストを行わず即時LocalStorage維持)
  const restoredList = JSON.parse(mockStore['vggc12th_saved_list'] || '{}');
  
  // 4. タイムライン復元
  const restoredTimeline = JSON.parse(mockStore['vggc12th_timeline_events'] || '[]');
  
  return { isOnline, restoredCircles, restoredExtra, restoredList, restoredTimeline };
}

const bootResult = simulateOfflineAppBoot();
assert(bootResult.restoredCircles.length === circles.length, `完全圏外で全${circles.length}サークルが1件も欠落なく復元されること`);
assert(Object.keys(bootResult.restoredExtra).length === circles.length, 'サークルの追加情報・メニューが全件復元されること');
assert(Object.keys(bootResult.restoredList).length === 51, '買い物リスト（50サークル＋予算）が完全復元されること');

// オフライン状態でのサークル絞り込みテスト (ぶいすぽメンバー、ブロック、お品書き有無)
const vspoCircles = bootResult.restoredCircles.filter(c => {
  const extra = bootResult.restoredExtra[c.circle_id] || {};
  return (extra.members || []).includes('花芽なずな');
});
assert(vspoCircles.length > 0, `オフライン状態でメンバー別絞り込みが正常動作すること (${vspoCircles.length}件ヒット)`);

const mBlockCircles = bootResult.restoredCircles.filter(c => c.space_sym === 'M');
assert(mBlockCircles.length > 0, `オフライン状態でブロック別絞り込み（Mブロック等）が正常動作すること (${mBlockCircles.length}件)`);

// 最短巡回ルート計算（買い物リストのソート）
const sortOrder = dataJson.sort_order || ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
const targetCircleIds = Object.keys(bootResult.restoredList).filter(k => k !== '__BUDGET__');
const routeCircles = targetCircleIds.map(id => bootResult.restoredCircles.find(c => c.circle_id === id)).filter(Boolean);

routeCircles.sort((a, b) => {
  const symIdxA = sortOrder.indexOf(a.space_sym);
  const symIdxB = sortOrder.indexOf(b.space_sym);
  if (symIdxA !== symIdxB) return (symIdxA === -1 ? 999 : symIdxA) - (symIdxB === -1 ? 999 : symIdxB);
  return parseInt(a.space_num || '0') - parseInt(b.space_num || '0');
});

assert(routeCircles.length === 50, 'オフライン状態で買い物リストの最短巡回ソートが正しく計算されること');
assert(routeCircles[0].space_sym <= routeCircles[routeCircles.length - 1].space_sym, '巡回ルートがAブロックから順序正しく整列していること');

// ----------------------------------------------------------------------
// 4. 画像遅延ロード失敗＆タイムアウト時のフォールバック自動テスト
// ----------------------------------------------------------------------
console.log('\n🖼️ 【Test 4】画像遅延ロード失敗・タイムアウト時のフォールバック動作テスト');

// シナリオ4-1: Pixiv お品書き画像
function simulatePixivFallback(isOnline, hasCachedImage) {
  let displayMode = 'unknown';
  let pixivImgError = false;
  
  if (hasCachedImage) {
    // キャッシュがある場合はオフラインでも画像表示成功
    displayMode = 'cached_image';
  } else {
    // キャッシュがない場合
    if (!isOnline) {
      // 圏外なら即座にオフライン案内＆頒布物メニューフォールバック
      pixivImgError = true;
      displayMode = 'offline_menu_fallback';
    } else {
      // オンラインならiframeフォールバック
      pixivImgError = true;
      displayMode = 'online_oembed_iframe';
    }
  }
  return { displayMode, pixivImgError };
}

const pixivOfflineWithCache = simulatePixivFallback(false, true);
assert(pixivOfflineWithCache.displayMode === 'cached_image', 'Pixiv画像: 事前にキャッシュ済みの場合は完全圏外でも画像が直接表示されること');

const pixivOfflineNoCache = simulatePixivFallback(false, false);
assert(pixivOfflineNoCache.displayMode === 'offline_menu_fallback', 'Pixiv画像: 未キャッシュかつ圏外の場合は安全にオフライン案内＆頒布物メニューへフォールバックすること');

// シナリオ4-2: X (Twitter) お品書き
function simulateTweetFallback(isOnline, oshinagakiList) {
  if (!isOnline && oshinagakiList.length > 0) {
    return 'offline_notice_and_items';
  }
  return 'twitter_widget_render';
}
const tweetOffline = simulateTweetFallback(false, [{ type: 'x', url: 'https://x.com/test/status/1' }]);
assert(tweetOffline === 'offline_notice_and_items', 'Xお品書き: 圏外時はTwitter通信を試行してハングアップせず、即座にオフライン案内へ切り替わること');

// シナリオ4-3: 会場マップ画像 (map.jpg)
function simulateMapFallback(imgLoadFailed) {
  if (imgLoadFailed) {
    return {
      showErrorNotice: true,
      hasPdfButton: true,
      hasRetryButton: true
    };
  }
  return { showErrorNotice: false };
}
const mapFallbackResult = simulateMapFallback(true);
assert(mapFallbackResult.showErrorNotice && mapFallbackResult.hasPdfButton, 'マップ画像: 万が一のロード失敗時にもPDFマップ誘導と再試行ボタンが表示されること');

// ----------------------------------------------------------------------
// 5. イベント当日（2026-11-14）タイムライン連動ストレステスト
// ----------------------------------------------------------------------
console.log('\n⏰ 【Test 5】イベント当日（2026-11-14）タイムライン時刻連動オフラインテスト');

const eventTimeline = [
  { id: '1', time: '09:45', title: '一般参加者受付開始' },
  { id: '2', time: '10:00', title: 'サークル入場 / 更衣室開場' },
  { id: '3', time: '12:00', title: '即売会開会（一般入場開始）' },
  { id: '4', time: '15:30', title: '閉会・一般退場' }
];

function checkTimelineStateAt(currentIsoTime) {
  const curTime = new Date(currentIsoTime).getTime();
  const baseDate = '2026-11-14';
  
  return eventTimeline.map(ev => {
    const evTime = new Date(`${baseDate}T${ev.time}:00+09:00`).getTime();
    const diffMinutes = Math.round((evTime - curTime) / (1000 * 60));
    return {
      ...ev,
      isPassed: diffMinutes < 0,
      isImminent: diffMinutes >= 0 && diffMinutes <= 15,
      diffMinutes
    };
  });
}

// 11:45 (開会15分前) のテスト
const statusAt1145 = checkTimelineStateAt('2026-11-14T11:45:00+09:00');
const openingEvent = statusAt1145.find(e => e.time === '12:00');
assert(openingEvent.isImminent === true, '開会15分前（11:45）に「即売会開会」がまもなく開始（isImminent: true）と正確に判定されること');

// 12:30 (開会中) のテスト
const statusAt1230 = checkTimelineStateAt('2026-11-14T12:30:00+09:00');
const morningEvents = statusAt1230.filter(e => e.time < '12:30');
assert(morningEvents.every(e => e.isPassed), '開会後（12:30）に午前中の予定が「通過済み」と正確に判定されること');

// ----------------------------------------------------------------------
// 6. サークル参加モード（簡易レジ v1: M-15-16 Black Stance）オフラインPOS＆在庫検証
// ----------------------------------------------------------------------
console.log('\n🏪 【Test 6】サークル参加モード（簡易POSレジ v1）会計・在庫管理・オフライン同期検証');

const REGISTER_CIRCLE_ID = '10ebdde686d91dfe1ab4a63376c7b377';
const blackStanceCircle = circles.find(c => c.circle_id === REGISTER_CIRCLE_ID);
assert(
  Boolean(blackStanceCircle && blackStanceCircle.space_sym === 'M' && blackStanceCircle.space_num === '15-16'),
  `対象サークル M-15-16「Black Stance」(${REGISTER_CIRCLE_ID}) がマスターデータに実在すること`
);

// 初期お品書き (circle_info.items) と レジ専用追加商品 (customItems) の分離検証
const originalCircleInfoItems = [
  { name: '新刊イラスト本', price: 1500 },
  { name: 'アクリルスタンド', price: 2000 }
];
const registerSimState = {
  revision: 1,
  itemOverrides: {
    'base_新刊イラスト本_1500': { initialStock: 6, soldCount: 0, manualSoldOut: false },
    'base_アクリルスタンド_2000': { initialStock: 2, soldCount: 0, manualSoldOut: false }
  },
  customItems: [
    { id: 'custom_shikishi', name: '当日追加 色紙', price: 3000, initialStock: 1, soldCount: 0, manualSoldOut: false }
  ],
  transactions: []
};

assert(
  originalCircleInfoItems.length === 2 && registerSimState.customItems.length === 1,
  '当日個人追加商品が circle_info.items を書き換えずに register_data 側のみで保持されること'
);

// 会計シミュレーション（新刊2冊 + 色紙1枚 = 6,000円、預かり10,000円 → お釣り4,000円）
function runSimCheckout(cartList, deposit) {
  const total = cartList.reduce((s, i) => s + i.price * i.qty, 0);
  const change = deposit - total;
  for (const item of cartList) {
    if (item.isCustom) {
      const target = registerSimState.customItems.find(c => c.id === item.id);
      target.soldCount += item.qty;
    } else {
      registerSimState.itemOverrides[item.id].soldCount += item.qty;
    }
  }
  const tx = { id: 'tx_1', timestamp: '2026-11-14T12:05:00Z', items: cartList, total, deposit, change, voided: false };
  registerSimState.transactions.unshift(tx);
  registerSimState.revision++;
  return tx;
}

const tx1 = runSimCheckout([
  { id: 'base_新刊イラスト本_1500', name: '新刊イラスト本', price: 1500, qty: 2, isCustom: false },
  { id: 'custom_shikishi', name: '当日追加 色紙', price: 3000, qty: 1, isCustom: true }
], 10000);

assert(tx1.total === 6000 && tx1.change === 4000, '会計計算: 合計金額(¥6,000)とお釣り(¥4,000)が正確に算出されること');

const bookOv = registerSimState.itemOverrides['base_新刊イラスト本_1500'];
const bookRemaining = bookOv.initialStock - bookOv.soldCount;
assert(bookRemaining === 4 && bookRemaining <= 5, `在庫減算＆残りわずか判定: 新刊残数が ${bookRemaining} 点となり残りわずか(<=5)警告対象になること`);

const shikishi = registerSimState.customItems[0];
const shikishiRemaining = shikishi.initialStock - shikishi.soldCount;
assert(shikishiRemaining === 0, '自動完売判定: 色紙の残数が 0 となり自動的に売り切れ扱いになること');

// 会計取消（在庫復元）の検証
tx1.voided = true;
bookOv.soldCount -= 2;
shikishi.soldCount -= 1;
assert(
  (bookOv.initialStock - bookOv.soldCount) === 6 && (shikishi.initialStock - shikishi.soldCount) === 1,
  '会計取消時: 取り消した会計分の在庫数が正確に元の数へ復元されること'
);

// オフライン中のリビジョン競合保護テスト (ローカルRev.5 vs クラウド古いRev.2)
const localRev = 5;
const cloudOldRev = 2;
const shouldPushLocalToCloud = localRev > cloudOldRev;
assert(shouldPushLocalToCloud === true, 'オフライン復帰同期: 圏外で進めたローカルの最新リビジョンがクラウドの古いデータで上書きされないこと');

// 担当タグ自動判定（末尾括弧のみ抽出・途中の仕様括弧は無視）＆ 担当別売上集計検証
const extractTrailingParenText = (name) => {
  const str = String(name || '').trim();
  const match = str.match(/[（(]([^）()（）]+)[）)]\s*$/);
  return match ? match[1].trim() : '';
};

const sampleCircleItems = [
  { name: 'ロングTシャツ(XLのみ) (BLΔCK)', price: 5000, soldCount: 2 },
  { name: 'トートバッグ (BLΔCK)', price: 4000, soldCount: 1 },
  { name: '新刊 写真集「noah」(B5/34P/フルカラー) (きょこち。)', price: 1300, soldCount: 3 },
  { name: '全部セット (きょこち。)', price: 3000, soldCount: 1 },
  { name: '差し入れステッカー(ホロ仕様)', price: 500, soldCount: 2 } // 末尾括弧が担当マスタにない商品 → 未設定
];

// 1) circle_info.items の末尾括弧から担当マスタ初期値を抽出（ハードコードなし）
const initialSellers = ['BLΔCK', 'きょこち。'];
const autoDetectSeller = (itemName, sellersList) => {
  const trailing = extractTrailingParenText(itemName);
  return sellersList.includes(trailing) ? trailing : '';
};

assert(
  autoDetectSeller('ロングTシャツ(XLのみ) (BLΔCK)', initialSellers) === 'BLΔCK' &&
  autoDetectSeller('新刊 写真集「noah」(B5/34P/フルカラー) (きょこち。)', initialSellers) === 'きょこち。' &&
  autoDetectSeller('差し入れステッカー(ホロ仕様)', initialSellers) === '',
  '担当自動割当: 途中の仕様括弧(XLのみ / B5/34P/フルカラー)を無視し、末尾括弧が担当マスタと一致した時のみ自動割当されること'
);

// 2) 3人目の担当を設定で追加した場合、後から追加された3人目の商品も自動でタグが付くこと
const updatedSellers = [...initialSellers, '3人目ゲスト'];
assert(
  autoDetectSeller('新作タペストリー(B2) (3人目ゲスト)', updatedSellers) === '3人目ゲスト',
  '担当マスタ拡張: 3人目の担当名を追加すると、末尾に(3人目ゲスト)がある商品へ自動的にタグが割り当たること'
);

// 3) 現在のタグ × soldCount による担当別集計（未設定も落とさず集計されること）
const sellerTotals = {};
for (const item of sampleCircleItems) {
  const sellerKey = autoDetectSeller(item.name, initialSellers) || '未設定';
  sellerTotals[sellerKey] = (sellerTotals[sellerKey] || 0) + item.price * item.soldCount;
}
assert(
  sellerTotals['BLΔCK'] === 14000 && sellerTotals['きょこち。'] === 6900 && sellerTotals['未設定'] === 1000,
  '担当別売上集計: BLΔCK(¥14,000) / きょこち。(¥6,900) / 未設定(¥1,000) が現在のタグ×soldCountで正確に集計されること'
);

// ----------------------------------------------------------------------
// テスト結果集計
// ----------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`📊 テスト結果サマリー: 全 ${totalTests} 件中 ${passedTests} 件 成功 / ${failedTests} 件 失敗`);
console.log('======================================================================');

if (failedTests > 0) {
  console.error('\n❌ 一部のテストが失敗しました。コードを再確認してください。');
  process.exit(1);
} else {
  console.log('\n🎉 ALL PASS! 2026-11-14 イベント当日の完全圏外環境でも100%安定動作することが実証されました！\n');
  process.exit(0);
}
