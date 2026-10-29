/**
 * VGGC 12th: タイムライン予定 当日通知 & リマインダーエンジン
 * 11/14(土) 当日の時刻と連動し、予定開始10分前や開始時刻に自動リマインド通知を生成します。
 */

// 重複通知管理用 LocalStorage キー ＆ インメモリフォールバック
const STORAGE_NOTIFIED_KEYS = 'vggc_timeline_notified_keys';
let memoryNotifiedKeys = [];

// 既に通知送信済みのキー一覧を取得
export function getNotifiedKeys() {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_NOTIFIED_KEYS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return memoryNotifiedKeys;
    }
  }
  return memoryNotifiedKeys;
}

// 通知送信済みキーを保存
export function markKeyAsNotified(key) {
  if (!memoryNotifiedKeys.includes(key)) {
    memoryNotifiedKeys.push(key);
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const keys = getNotifiedKeys();
      if (!keys.includes(key)) {
        keys.push(key);
        localStorage.setItem(STORAGE_NOTIFIED_KEYS, JSON.stringify(keys));
      }
    } catch (e) {
      console.error('Failed to mark notification key in localStorage:', e);
    }
  }
}

/**
 * タイムライン予定リストから、現在時刻に即した新しい通知をチェックして生成
 * @param {Array} timelineEvents - ユーザーのタイムライン予定配列
 * @param {Array} circles - 全サークルリスト
 * @param {Date} [simulatedDate] - シミュレーション用Date (テスト時用)
 * @returns {Array} 新たに生成された通知オブジェクト配列
 */
export function checkUpcomingTimelineReminders(timelineEvents, circles = [], simulatedDate = null) {
  if (!timelineEvents || timelineEvents.length === 0) return [];

  const now = simulatedDate || new Date();
  
  // VGGC 12th 当日（2026年11月14日）判定 (simulatedDate指定時はスキップ)
  const isEventDay = simulatedDate ? true : (
    now.getFullYear() === 2026 && 
    now.getMonth() === 10 && // 11月 (0-indexed: 10)
    now.getDate() === 14
  );

  // 当日以外、かつシミュレーション指定がない場合は通常のリマインダーは生成しない
  if (!isEventDay) return [];

  const curH = now.getHours();
  const curM = now.getMinutes();
  const curMinutes = curH * 60 + curM;

  const notifiedKeys = getNotifiedKeys();
  const newNotifications = [];

  for (const evt of timelineEvents) {
    if (evt.done) continue;
    if (!evt.time || !evt.title) continue;

    const [evtH, evtM] = evt.time.split(':').map(Number);
    if (isNaN(evtH) || isNaN(evtM)) continue;
    const evtMinutes = evtH * 60 + evtM;
    const diffMinutes = evtMinutes - curMinutes;

    // 1. 開始前リマインド (diffMinutes が 1〜10 の範囲)
    const key10m = `tl_10m_${evt.id}_${evt.time}`;
    if (diffMinutes > 0 && diffMinutes <= 10 && !notifiedKeys.includes(key10m)) {
      const notif = createReminderNotification(evt, diffMinutes, '10m', circles);
      newNotifications.push(notif);
      markKeyAsNotified(key10m);
    }

    // 2. 開始時刻リマインド (diffMinutes が 0 または 開催中 -5分以内)
    const keyNow = `tl_now_${evt.id}_${evt.time}`;
    if (diffMinutes <= 0 && diffMinutes >= -5 && !notifiedKeys.includes(keyNow)) {
      const notif = createReminderNotification(evt, 0, 'now', circles);
      newNotifications.push(notif);
      markKeyAsNotified(keyNow);
    }
  }

  // 3. ブラウザネイティブ通知 (許可されている場合)
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    newNotifications.forEach(n => {
      try {
        new Notification(n.title, {
          body: n.body,
          icon: '/icons/icon-192.png',
          tag: n.id
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    });
  }

  return newNotifications;
}

/**
 * 通知オブジェクトのファクトリ
 */
function createReminderNotification(evt, diffMinutes, stage, circles) {
  const isNow = stage === 'now' || diffMinutes <= 0;
  
  let title = '';
  if (isNow) {
    title = `🟢【開催中】${evt.time}〜 ${evt.title}`;
  } else {
    title = `⏳【あと${diffMinutes}分】${evt.time}〜 ${evt.title}`;
  }

  let body = '';
  if (evt.space) {
    body += `スペース: ${evt.space}`;
  }
  if (evt.location) {
    body += (body ? ' / ' : '') + `場所: ${evt.location}`;
  }
  if (evt.memo) {
    body += (body ? '\n' : '') + `メモ: ${evt.memo}`;
  }
  if (!body) {
    body = isNow ? '予定の開始時刻になりました！' : 'まもなく開始時間になります。移動の準備をしましょう！';
  }

  // サークル詳細やマップジャンプなどのアクション定義
  let action = null;
  if (evt.circleId) {
    action = { type: 'open_circle', circleId: evt.circleId, label: 'サークル詳細' };
  } else if (evt.space) {
    const spaceClean = evt.space.replace(/\s+/g, '').toUpperCase();
    const matched = circles.find(c => `${c.space_sym}-${c.space_num}`.toUpperCase() === spaceClean);
    if (matched) {
      action = { type: 'open_circle', circleId: matched.circle_id, label: 'サークル詳細' };
    } else {
      action = { type: 'jump_to_timeline', label: 'タイムラインを開く' };
    }
  } else {
    action = { type: 'jump_to_timeline', label: 'タイムラインを開く' };
  }

  return {
    id: `tl_notif_${evt.id}_${stage}_${Date.now()}`,
    created_at: new Date().toISOString(),
    title,
    body,
    type: isNow ? 'success' : 'warning',
    category: 'timeline',
    is_pinned: false,
    action
  };
}

/**
 * テスト実行用：登録されているタイムライン予定からデモリマインド通知を生成
 */
export function generateTestTimelineNotification(timelineEvents, circles = []) {
  if (!timelineEvents || timelineEvents.length === 0) {
    return {
      id: `test_notif_${Date.now()}`,
      created_at: new Date().toISOString(),
      title: '⏰ タイムライン通知テスト',
      body: 'タイムスケジュールに予定（ポスターじゃんけんやサイン会等）を登録すると、当日に自動リマインド通知が届きます！',
      type: 'feature',
      category: 'timeline',
      is_pinned: false,
      action: { type: 'jump_to_timeline', label: '予定を追加する' }
    };
  }

  // 直近の予定または最初の予定を選択
  const target = timelineEvents[0];
  return {
    id: `test_notif_${Date.now()}`,
    created_at: new Date().toISOString(),
    title: `⏳【リマインド動作テスト】${target.time}〜 ${target.title}`,
    body: `当日はこのように開始前にお知らせが届きます！\n${target.space ? `スペース: ${target.space}` : ''} ${target.memo ? `(メモ: ${target.memo})` : ''}`,
    type: 'warning',
    category: 'timeline',
    is_pinned: false,
    action: target.circleId 
      ? { type: 'open_circle', circleId: target.circleId, label: 'サークル詳細' }
      : { type: 'jump_to_timeline', label: 'タイムラインを見る' }
  };
}
