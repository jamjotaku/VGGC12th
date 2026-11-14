import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * VGGC 次回イベント（VGGC 13th）向け リポジトリデータ初期化スクリプト
 * ⚠️ 実行タイミング: 2026-11-21 以降（--execute フラグ付きで実行）
 *
 * 使い方:
 *   node scripts/reset-to-shell.js           # ドライラン（対象ファイル確認のみ）
 *   node scripts/reset-to-shell.js --execute # 実際に空の入れ物状態へリセット
 */
const isExecute = process.argv.includes('--execute');

const emptyDataJson = {
  circles: [],
  sort_order: []
};

const emptyCoordsJson = {};

const emptyRoutesJson = {
  coordinate_system: {
    width: 900,
    note: 'マップ画像幅900px基準の座標系。次回マップ画像差し替え後に map_editor.html で再定義してください。'
  },
  entrance: { x: 190, y: 140 },
  aisles: {
    vertical_x: [],
    horizontal_y: {}
  },
  nodes: {},
  edges: []
};

const targets = [
  { file: 'public/data.json', content: JSON.stringify(emptyDataJson, null, 2) },
  { file: 'src/map_coords.json', content: JSON.stringify(emptyCoordsJson, null, 2) },
  { file: 'public/map_coords.json', content: JSON.stringify(emptyCoordsJson, null, 2) },
  { file: 'src/map_routes.json', content: JSON.stringify(emptyRoutesJson, null, 2) },
  { file: 'public/map_routes.json', content: JSON.stringify(emptyRoutesJson, null, 2) }
];

console.log('=== VGGC 次回イベント向け 入れ物化リセット ===');
console.log(isExecute ? '🚀 実行モード (--execute): イベント固有データを空テンプレートに初期化します。' : '🔍 ドライラン: 実際のファイル書き換えは行いません（実行するには --execute を付けてください）。');

for (const t of targets) {
  const fullPath = path.join(rootDir, t.file);
  if (isExecute) {
    fs.writeFileSync(fullPath, t.content + '\n', 'utf-8');
    console.log(`  ✅ リセット完了: ${t.file}`);
  } else {
    console.log(`  📄 リセット対象: ${t.file}`);
  }
}

if (isExecute) {
  console.log('\n🎉 リポジトリのイベント固有データを空の入れ物状態にしました。');
  console.log('※ 次回 VGGC 13th では、data.json / map.jpg / map.pdf / map_coords.json / map_routes.json を差し替えてご利用ください。');
}
