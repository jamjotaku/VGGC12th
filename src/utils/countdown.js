import { EVENT_INFO } from '../constants';

/**
 * イベント開催までの日数カウントダウン、および当日のリアルタイム進行状況を計算
 */
export const getEventCountdown = (now = new Date()) => {
  const targetStart = new Date(EVENT_INFO.start);
  const targetEnd = new Date(EVENT_INFO.end);
  const targetDayStart = new Date(EVENT_INFO.dayStart);

  const diffStart = targetStart - now;
  const diffEnd = targetEnd - now;

  // 終了後
  if (diffEnd <= 0) {
    return { status: 'ended', text: '本日の即売会は終了しました。お疲れ様でした！', badge: '終了' };
  }
  // 即売会開催中 (12:00 - 15:30)
  if (diffStart <= 0 && diffEnd > 0) {
    const h = Math.floor(diffEnd / (1000 * 60 * 60));
    const m = Math.floor((diffEnd % (1000 * 60 * 60)) / (1000 * 60));
    return { status: 'running', text: `🔥 即売会開催中！ 終了まで あと${h}時間${m}分`, badge: '開催中' };
  }
  // 当日 朝〜開会前
  if (now >= targetDayStart && diffStart > 0) {
    const h = Math.floor(diffStart / (1000 * 60 * 60));
    const m = Math.floor((diffStart % (1000 * 60 * 60)) / (1000 * 60));
    return { status: 'today_before', text: `✨ 開会(12:00)まで あと${h}時間${m}分！`, badge: '本日開催' };
  }
  // イベント前 (日数カウントダウン)
  const days = Math.ceil(diffStart / (1000 * 60 * 60 * 24));
  return { status: 'countdown', text: `🎉 VGGC 12th まで あと ${days}日`, badge: `あと${days}日` };
};

/**
 * 当日のタイムスケジュール各項目のアクティブ状態（NOW）を判定
 */
export const checkScheduleActive = (timeKey, now = new Date()) => {
  const targetDay = new Date(EVENT_INFO.dayStart);
  const nextDay = new Date(EVENT_INFO.dayEnd);
  if (now < targetDay || now >= nextDay) return false;

  const hm = now.getHours() * 60 + now.getMinutes();
  if (timeKey === '9:45' && hm >= 9 * 60 + 45 && hm < 10 * 60) return true;
  if (timeKey === '10:00' && hm >= 10 * 60 && hm < 12 * 60) return true;
  if (timeKey === '12:00' && hm >= 12 * 60 && hm < 15 * 60 + 30) return true;
  if (timeKey === '15:30' && hm >= 15 * 60 + 30 && hm < 15 * 60 + 45) return true;
  if (timeKey === '15:45' && hm >= 15 * 60 + 45 && hm < 17 * 60) return true;
  return false;
};
