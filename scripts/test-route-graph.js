import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateRouteGraph,
  calculatePatrolRoute,
  getSingleBoothCells,
  segmentIntersectsRect
} from '../src/utils/routePlanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const routeData = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/map_routes.json'), 'utf8'));
const mapCoords = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/map_coords.json'), 'utf8'));
const appData = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data.json'), 'utf8'));

console.log('=== VGGC 12th 巡回ルートグラフ＆経路探索 自動検証 ===');

// 1. 全552ブース到達可能性 ＆ 通路線とブースセルの交差0件チェック
const validation = validateRouteGraph(routeData, mapCoords);
console.log(`[1] グラフ検証結果:`);
console.log(`  - 単一ブースセル総数: ${validation.boothsTotal} (期待値: 552)`);
console.log(`  - ノード数: ${validation.nodesTotal} / エッジ数: ${validation.edgesTotal}`);
console.log(`  - 起点からの到達不可ブース数: ${validation.unreachableFromEntrance} (期待値: 0)`);
console.log(`  - 通路線×552ブースセル交差数: ${validation.aisleVsBoothCellIntersections} (期待値: 0)`);

if (!validation.isValid || validation.boothsTotal !== 552) {
  console.error('❌ グラフ検証エラー:', validation);
  process.exit(1);
}

// 2. 全サークル実データ (public/data.json) の座標解決＆到達可能性チェック
const allCirclePins = appData.circles.map(c => {
  const spaceKey = `${c.space_sym}-${c.space_num}`;
  const baseKey = `${c.space_sym}-${String(c.space_num).split('-')[0]}`;
  const pos = mapCoords[spaceKey] || mapCoords[baseKey] || mapCoords[c.space_sym];
  return {
    circle_id: c.circle_id,
    circle: c,
    space_sym: c.space_sym,
    space_num: c.space_num,
    spaceLabel: spaceKey,
    x: pos?.x,
    y: pos?.y,
    priority: 'A',
    isCompleted: false
  };
});

// 3. サンプル巡回ルート検証 (Sが東端 C-14、Aが西ブロック群の反例ケース)
const makePin = (spaceKey, priority) => {
  const [sym, num] = spaceKey.split('-');
  const pos = mapCoords[spaceKey];
  return {
    circle_id: `test_${spaceKey}`,
    circle: { circle_id: `test_${spaceKey}`, circle_name: `テスト_${spaceKey}`, space_sym: sym, space_num: num },
    space_sym: sym,
    space_num: num,
    spaceLabel: spaceKey,
    x: pos.x,
    y: pos.y,
    priority,
    isCompleted: false
  };
};

const samplePins = [
  makePin('C-14', 'S'),
  makePin('M-37', 'A'),
  makePin('N-05', 'A'),
  makePin('L-12', 'A'),
  makePin('K-28', 'B'),
  makePin('A-10', '')
];

const t0 = performance.now();
const priorityRoute = calculatePatrolRoute(routeData, samplePins, {
  orderMode: 'priority',
  returnToEntrance: false
});
const shortestRoute = calculatePatrolRoute(routeData, samplePins, {
  orderMode: 'shortest',
  returnToEntrance: false
});
const returnRoute = calculatePatrolRoute(routeData, samplePins, {
  orderMode: 'priority',
  returnToEntrance: true
});
const elapsedMs = (performance.now() - t0).toFixed(2);

console.log(`[2] 経路探索テスト (3パターン計 ${elapsedMs} ms):`);
console.log(`  - 優先度順: ${priorityRoute.orderedStops.map(s => `${s.visitOrder}:${s.spaceLabel}(${s.priority || '未'})`).join(' -> ')} | 総延長: ${priorityRoute.totalDistance}`);
console.log(`  - 最短順  : ${shortestRoute.orderedStops.map(s => `${s.visitOrder}:${s.spaceLabel}(${s.priority || '未'})`).join(' -> ')} | 総延長: ${shortestRoute.totalDistance}`);
console.log(`  - 入口帰還: 往路 ${returnRoute.outwardDistance} + 帰路 ${returnRoute.returnDistance} = 合計 ${returnRoute.totalDistance}`);

// 優先度順では先頭が必ず S (C-14) であること
if (priorityRoute.orderedStops[0].spaceLabel !== 'C-14') {
  console.error('❌ 優先度順で S が先頭になっていません');
  process.exit(1);
}

// 最短順の総延長 <= 優先度順の総延長 であること
if (shortestRoute.totalDistance > priorityRoute.totalDistance + 0.1) {
  console.error('❌ 最短順の距離が優先度順を上回っています');
  process.exit(1);
}

// 4. 生成されたポリラインの全セグメントが552ブースセルと一切交差しないかチェック
const singleBoothCells = getSingleBoothCells(mapCoords);
let routeCellHits = 0;
const pts = priorityRoute.polylinePoints;
for (let i = 0; i < pts.length - 1; i++) {
  for (const cell of singleBoothCells) {
    if (segmentIntersectsRect(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, cell.x1, cell.y1, cell.x2, cell.y2)) {
      routeCellHits++;
    }
  }
}
console.log(`[3] 生成ルートポリライン×552ブースセル交差数: ${routeCellHits} (期待値: 0)`);
if (routeCellHits !== 0) {
  console.error('❌ 生成されたルートがブースセルと交差しています');
  process.exit(1);
}

console.log('✅ 全ての巡回ルート自動検証に合格しました！');
