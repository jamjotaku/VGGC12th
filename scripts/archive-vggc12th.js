import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SUPABASE_URL = 'https://lgcwzlzrovdcjaywvmdk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3d6bHpyb3ZkY2pheXd2bWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMjA1NzksImV4cCI6MjEwNDY5NjU3OX0.-axEWTfGBNrtt2POQn7VgkCSCgQH2v3Wn2SIQSgvKYo';

function csvEscape(val) {
  const s = String(val ?? '');
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function cleanTwitterHandle(raw) {
  return String(raw || '').trim().replace(/^@+/, '');
}

function extractHandles(rawStr) {
  if (!rawStr) return [];
  const s = String(rawStr).trim();
  if (!s) return [];
  const tokens = /[,、\n]/.test(s) ? s.split(/[,、\n]+/) : s.split(/\s+/);
  const seen = new Set();
  const list = [];
  for (const rawToken of tokens) {
    const t = rawToken.trim();
    if (!t) continue;
    let handle = '';
    const colonMatch = t.match(/^([^:：]+)[:：]\s*@?([A-Za-z0-9_]+)$/);
    const parenMatch = t.match(/^([^(@（]+)\s*[(（]@?([A-Za-z0-9_]+)[)）]$/);
    if (colonMatch) handle = colonMatch[2];
    else if (parenMatch) handle = parenMatch[2];
    else handle = cleanTwitterHandle(t);

    if (handle && !seen.has(handle.toLowerCase())) {
      seen.add(handle.toLowerCase());
      list.push(handle);
    }
  }
  return list;
}

async function main() {
  const dataJsonPath = path.join(rootDir, 'public', 'data.json');
  const dataJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
  const circles = Array.isArray(dataJson.circles) ? dataJson.circles : [];

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let circleInfoRows = [];
  let supabaseFetched = false;

  try {
    const { data, error } = await supabase.from('circle_info').select('*');
    if (error) {
      console.warn('Supabase circle_info fetch warning:', error.message);
    } else if (Array.isArray(data)) {
      circleInfoRows = data;
      supabaseFetched = true;
    }
  } catch (e) {
    console.warn('Supabase connection skipped or failed:', e.message);
  }

  const infoMap = new Map();
  for (const row of circleInfoRows) {
    if (row && row.circle_id) {
      infoMap.set(row.circle_id, row);
    }
  }

  const archivedCircles = circles.map((c) => {
    const extra = infoMap.get(c.circle_id) || {};
    const space = `${c.space_sym || ''}-${c.space_num || ''}`;
    const rawTwitter = extra.twitter_id || c.twitter_id || '';
    const handles = extractHandles(rawTwitter);
    const xUrls = handles.map((h) => `https://x.com/${h}`);
    const staffHandles = extractHandles(extra.staff_twitter || '');
    const rawTags = Array.isArray(extra.tags) ? extra.tags : [];
    const isAbsent = Boolean(extra.is_absent) || rawTags.includes('__ABSENT__') || rawTags.includes('不参加') || rawTags.includes('欠席');
    const cleanTags = rawTags.filter((t) => !String(t).startsWith('__'));

    return {
      space,
      space_sym: c.space_sym || '',
      space_num: c.space_num || '',
      circle_name: c.circle_name || '',
      circle_kana: c.circle_kana || '',
      penname: c.penname || '',
      penname_kana: c.penname_kana || '',
      twitter_id_raw: rawTwitter,
      twitter_handles: handles,
      x_urls: xUrls,
      staff_twitter_raw: extra.staff_twitter || '',
      staff_twitter_handles: staffHandles,
      oshinagaki_url: extra.oshinagaki_url || '',
      pixiv_url: c.pixiv_url || '',
      site_url: c.site_url || '',
      members: Array.isArray(extra.members) ? extra.members : [],
      tags: cleanTags,
      items: Array.isArray(extra.items) ? extra.items : [],
      is_absent: isAbsent,
      circle_id: c.circle_id || ''
    };
  });

  const archiveDir = path.join(rootDir, 'archive');
  fs.mkdirSync(archiveDir, { recursive: true });

  // 1. JSONアーカイブ
  const jsonArchive = {
    event: 'VGGC 12th',
    archived_at: new Date().toISOString(),
    supabase_circle_info_fetched: supabaseFetched,
    total_circles: archivedCircles.length,
    circles_with_twitter: archivedCircles.filter((c) => c.twitter_handles.length > 0).length,
    circles: archivedCircles
  };
  fs.writeFileSync(
    path.join(archiveDir, 'vggc12th_circles_archive.json'),
    JSON.stringify(jsonArchive, null, 2),
    'utf-8'
  );

  // 2. Supabase circle_info 生データ（取得できた場合）
  if (supabaseFetched) {
    fs.writeFileSync(
      path.join(archiveDir, 'vggc12th_supabase_circle_info_raw.json'),
      JSON.stringify(circleInfoRows, null, 2),
      'utf-8'
    );
  }

  // 3. UTF-8 BOM付き CSVアーカイブ（Excel等で文字化けせず開ける形式）
  const csvHeaders = [
    'サークル番号',
    'ブロック',
    '番号',
    'サークル名',
    'サークル名カナ',
    '代表者名',
    'サークル主Xアカウント',
    'X_URL',
    '売り子Xアカウント',
    'お品書きURL',
    'Pixiv_URL',
    'Webサイト',
    'メンバー',
    'タグ',
    '不参加',
    'circle_id'
  ];

  const csvRows = [csvHeaders.map(csvEscape).join(',')];
  for (const c of archivedCircles) {
    const row = [
      c.space,
      c.space_sym,
      c.space_num,
      c.circle_name,
      c.circle_kana,
      c.penname,
      c.twitter_handles.map((h) => `@${h}`).join(' / ') || c.twitter_id_raw,
      c.x_urls.join(' / '),
      c.staff_twitter_handles.map((h) => `@${h}`).join(' / ') || c.staff_twitter_raw,
      c.oshinagaki_url,
      c.pixiv_url,
      c.site_url,
      c.members.join(' / '),
      c.tags.join(' / '),
      c.is_absent ? '不参加' : '',
      c.circle_id
    ];
    csvRows.push(row.map(csvEscape).join(','));
  }

  fs.writeFileSync(
    path.join(archiveDir, 'vggc12th_circles_archive.csv'),
    '\uFEFF' + csvRows.join('\r\n'),
    'utf-8'
  );

  console.log(`✅ Archive created successfully!`);
  console.log(`- Total circles: ${archivedCircles.length}`);
  console.log(`- Supabase circle_info rows fetched: ${supabaseFetched ? circleInfoRows.length : 'FAILED (offline/blocked)'}`);
  console.log(`- Circles with X account: ${jsonArchive.circles_with_twitter}`);
}

main();
