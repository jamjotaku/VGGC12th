/**
 * VGGC 12th 会場マップ 巡回ルート計算エンジン (クライアントサイド完結)
 *
 * 絶対条件:
 * - ルートは自由空間を直進せず、事前定義した通路グラフ (map_routes.json) のノード・エッジ上のみを通る
 * - 起点は entrance (デフォルト: 190.0, 140.0 / n299) の1点に固定（設定1箇所変更で北東入口等へも差し替え可能）
 * - 各ブースの前面アクセスポイントは、列の向きで面する側の通路線へそのブースの y (A列は南通路 y=296.0 にブースの x) でノードを動的挿入して接続
 * - 巡回順はデフォルト「優先度順」(S→A→B→未設定 の各階層内で近傍法＋2-opt)、切替で全体の「最短順」(近傍法＋2-opt)
 * - 終点はデフォルトで最後のブース終了、オプションで「入口に戻る」
 */

/**
 * 単一スペースブース (全552セル) の矩形領域を返す (交差判定用)
 * map_coords.json の座標系 (幅900基準):
 * - B〜N列: 幅 10.6, 高さ 6.0
 * - A列: 幅 5.9, 高さ 10.6
 */
export function getSingleBoothCells(mapCoords) {
  const cells = [];
  if (!mapCoords) return cells;
  for (const [key, pos] of Object.entries(mapCoords)) {
    if (!/^[A-Z]-\d{2}$/.test(key)) continue;
    const sym = key.split('-')[0];
    const w = sym === 'A' ? 5.9 : 10.6;
    const h = sym === 'A' ? 10.6 : 6.0;
    cells.push({
      key,
      sym,
      x1: pos.x,
      y1: pos.y,
      x2: pos.x + w,
      y2: pos.y + h,
      cx: pos.x + w / 2,
      cy: pos.y + h / 2
    });
  }
  return cells;
}

/**
 * 線分 (ax, ay)-(bx, by) と 矩形 [rx1, ry1, rx2, ry2] の交差判定 (Liang-Barsky法)
 * margin > 0 の場合は矩形を内側に微小シュリンクして境界接触の数値誤差を除外
 */
export function segmentIntersectsRect(ax, ay, bx, by, rx1, ry1, rx2, ry2, margin = 1e-4) {
  const xMin = rx1 + margin;
  const yMin = ry1 + margin;
  const xMax = rx2 - margin;
  const yMax = ry2 - margin;

  if (Math.max(ax, bx) < xMin || Math.min(ax, bx) > xMax || Math.max(ay, by) < yMin || Math.min(ay, by) > yMax) {
    return false;
  }

  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const p = [-dx, dx, -dy, dy];
  const q = [ax - xMin, xMax - ax, ay - yMin, yMax - ay];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

/**
 * ブースの配置記号 (space_sym) と番号 (space_num) および座標 (bx, by) から、
 * 面する通路上のアクセスポイント座標 (ax, ay) とブース前面エッジ座標 (fx, fy) を算出する
 */
export function getBoothAisleAccessPoint(spaceSym, spaceNum, boothPos, routeData) {
  if (!boothPos || !routeData) return null;
  const bx = Number(boothPos.x);
  const by = Number(boothPos.y);
  const verticalAisles = routeData.vertical_aisles_x || [
    246.5, 289.7, 332.7, 375.8, 419.3, 463.2, 506.8, 549.8, 614.4, 679.0, 722.0, 765.2, 822.7
  ];
  const southY = routeData.horizontal_aisles_y?.south ?? 296.0;

  const sym = String(spaceSym || '').trim().toUpperCase();
  const firstNum = parseInt(String(spaceNum || '1').split('-')[0], 10) || 1;

  // A列: 南壁配置、北側の南横通路 (y = 296.0) に面する
  if (sym === 'A') {
    const clampedX = Math.max(verticalAisles[0], Math.min(verticalAisles[verticalAisles.length - 1], bx));
    return {
      aisleType: 'horizontal_south',
      ax: Number(clampedX.toFixed(2)),
      ay: Number(southY.toFixed(2)),
      // ブース前面の境界点 (セル上端 y=319.5 の手前)
      fx: Number(bx.toFixed(2)),
      fy: Number((by - 1.5).toFixed(2)),
      bx,
      by
    };
  }

  // B列: 東壁配置、西側の C-B間縦通路 (x = 822.7) に面する
  if (sym === 'B') {
    const ax = verticalAisles[verticalAisles.length - 1];
    return {
      aisleType: 'vertical',
      ax: Number(ax.toFixed(2)),
      ay: Number(by.toFixed(2)),
      fx: Number((bx - 1.5).toFixed(2)),
      fy: Number(by.toFixed(2)),
      bx,
      by
    };
  }

  // C〜N島:
  // 01〜20番は島の東列（東側の縦通路 ax > bx に面する）
  // 21〜40番は島の西列（西側の縦通路 ax < bx に面する）
  if (firstNum <= 20) {
    const eastAisle = verticalAisles.find(x => x > bx) ?? verticalAisles[verticalAisles.length - 1];
    return {
      aisleType: 'vertical',
      ax: Number(eastAisle.toFixed(2)),
      ay: Number(by.toFixed(2)),
      fx: Number((bx + 4.5).toFixed(2)),
      fy: Number(by.toFixed(2)),
      bx,
      by
    };
  } else {
    const westAisle = [...verticalAisles].reverse().find(x => x < bx) ?? verticalAisles[0];
    return {
      aisleType: 'vertical',
      ax: Number(westAisle.toFixed(2)),
      ay: Number(by.toFixed(2)),
      fx: Number((bx - 4.5).toFixed(2)),
      fy: Number(by.toFixed(2)),
      bx,
      by
    };
  }
}

/**
 * 通路グラフをベースに、訪問対象ブースの前面アクセスポイントを各通路線上に挿入した拡張グラフを構築する
 */
export function buildExtendedRouteGraph(routeData, targetItems = []) {
  const nodesMap = new Map();
  const adj = new Map();

  const addNode = (id, x, y, meta = {}) => {
    const node = { id, x: Number(x), y: Number(y), ...meta };
    nodesMap.set(id, node);
    if (!adj.has(id)) adj.set(id, []);
    return node;
  };

  const addEdge = (idA, idB) => {
    if (idA === idB) return;
    const na = nodesMap.get(idA);
    const nb = nodesMap.get(idB);
    if (!na || !nb) return;
    const w = Math.hypot(na.x - nb.x, na.y - nb.y);
    const listA = adj.get(idA);
    if (!listA.some(e => e.to === idB)) listA.push({ to: idB, w });
    const listB = adj.get(idB);
    if (!listB.some(e => e.to === idA)) listB.push({ to: idA, w });
  };

  // 1. 基本ノード登録
  for (const n of (routeData.nodes || [])) {
    addNode(n.id, n.x, n.y);
  }

  // 2. 起点ノードの特定・座標同期 (entrance設定1箇所変更で起点差し替え可能にする)
  const entranceCfg = routeData.entrance || { x: 190.0, y: 140.0 };
  let entranceNodeId = entranceCfg.node_id || 'n299';
  if (!nodesMap.has(entranceNodeId)) {
    // 座標一致ノードを探すか新規作成
    const found = (routeData.nodes || []).find(
      n => Math.abs(n.x - entranceCfg.x) < 0.5 && Math.abs(n.y - entranceCfg.y) < 0.5
    );
    if (found) {
      entranceNodeId = found.id;
    } else {
      addNode(entranceNodeId, entranceCfg.x, entranceCfg.y, { isEntrance: true });
    }
  } else {
    // entrance.x / y が変更されていた場合は entranceNodeId の座標を更新
    const entNode = nodesMap.get(entranceNodeId);
    entNode.x = Number(entranceCfg.x);
    entNode.y = Number(entranceCfg.y);
    entNode.isEntrance = true;
  }

  // 3. 基本エッジ登録
  for (const e of (routeData.edges || [])) {
    addEdge(e.a, e.b);
  }

  // もし起点座標が北東側など別位置に差し替えられていて既存エッジでは長距離飛ぶ場合、最寄りの北通路/外周ノードへ自動接続
  const entNode = nodesMap.get(entranceNodeId);
  const entEdges = adj.get(entranceNodeId) || [];
  const needsAutoConnect = entEdges.length === 0 || entEdges.every(e => e.w > 120);
  if (needsAutoConnect && entNode) {
    adj.set(entranceNodeId, []);
    const candidates = Array.from(nodesMap.values())
      .filter(n => n.id !== entranceNodeId)
      .map(n => ({ id: n.id, d: Math.hypot(n.x - entNode.x, n.y - entNode.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const c of candidates) {
      addEdge(entranceNodeId, c.id);
    }
  }

  // 4. 各訪問対象ブースの前面アクセスポイントを通路線上に挿入
  // 同じ通路線上の既存ノード群を取得して y (または南通路は x) の昇順で挟み込み接続する
  const verticalNodesByX = new Map();
  const southY = routeData.horizontal_aisles_y?.south ?? 296.0;
  const southNodes = [];

  for (const n of nodesMap.values()) {
    if (n.id === entranceNodeId) continue;
    const xKey = n.x.toFixed(1);
    if (!verticalNodesByX.has(xKey)) verticalNodesByX.set(xKey, []);
    verticalNodesByX.get(xKey).push(n);

    if (Math.abs(n.y - southY) < 0.2) {
      southNodes.push(n);
    }
  }

  const boothAccessMap = new Map();

  targetItems.forEach((item, idx) => {
    const access = getBoothAisleAccessPoint(
      item.space_sym || item.circle?.space_sym,
      item.space_num || item.circle?.space_num,
      { x: item.x, y: item.y },
      routeData
    );
    if (!access) return;

    const accessNodeId = `access_${item.circle_id || idx}`;
    const accessNode = addNode(accessNodeId, access.ax, access.ay, {
      isBoothAccess: true,
      circleId: item.circle_id
    });

    if (access.aisleType === 'horizontal_south') {
      southNodes.push(accessNode);
    } else {
      const xKey = access.ax.toFixed(1);
      if (!verticalNodesByX.has(xKey)) verticalNodesByX.set(xKey, []);
      verticalNodesByX.get(xKey).push(accessNode);
    }

    boothAccessMap.set(item.circle_id, {
      accessNodeId,
      ...access
    });
  });

  // 各縦通路ごとに y 順で隣接ノード同士をエッジ接続 (挿入されたアクセスノードを既存の通路ラインに組み込む)
  for (const [, list] of verticalNodesByX.entries()) {
    list.sort((a, b) => a.y - b.y);
    for (let i = 0; i < list.length - 1; i++) {
      addEdge(list[i].id, list[i + 1].id);
    }
  }

  // 南横通路 (y = 296.0) も x 順で隣接ノード同士をエッジ接続
  if (southNodes.length > 1) {
    southNodes.sort((a, b) => a.x - b.x);
    for (let i = 0; i < southNodes.length - 1; i++) {
      addEdge(southNodes[i].id, southNodes[i + 1].id);
    }
  }

  return {
    nodesMap,
    adj,
    entranceNodeId,
    entrancePoint: { x: entNode.x, y: entNode.y },
    boothAccessMap
  };
}

/**
 * 単一始点ダイクストラ法
 * @returns {{ dist: Map<string, number>, prev: Map<string, string> }}
 */
export function runDijkstra(adj, startNodeId) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  const pq = [{ id: startNodeId, d: 0 }];
  dist.set(startNodeId, 0);

  while (pq.length > 0) {
    // ノード数 ~350 程度のため線形最小値抽出または軽量ソートで < 0.5ms
    let minIdx = 0;
    for (let i = 1; i < pq.length; i++) {
      if (pq[i].d < pq[minIdx].d) minIdx = i;
    }
    const current = pq[minIdx];
    pq[minIdx] = pq[pq.length - 1];
    pq.pop();

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const neighbors = adj.get(current.id) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;
      const nextDist = current.d + edge.w;
      const known = dist.get(edge.to);
      if (known === undefined || nextDist < known) {
        dist.set(edge.to, nextDist);
        prev.set(edge.to, current.id);
        pq.push({ id: edge.to, d: nextDist });
      }
    }
  }

  return { dist, prev };
}

/**
 * 2ノード間の最短経路ノードID列を復元する
 */
export function reconstructPath(prevMap, startId, endId) {
  if (startId === endId) return [startId];
  if (!prevMap.has(endId)) return [];
  const path = [];
  let curr = endId;
  while (curr !== undefined) {
    path.push(curr);
    if (curr === startId) break;
    curr = prevMap.get(curr);
  }
  path.reverse();
  return path[0] === startId ? path : [];
}

/**
 * 訪問順序リストに対する 2-opt 局所改善 (始点 startNodeId 固定、オプションで endNodeId 固定)
 */
function optimizeOrder2Opt(orderIds, startNodeId, distMatrix, endNodeId = null) {
  if (orderIds.length <= 2) return [...orderIds];
  const route = [...orderIds];
  const n = route.length;

  const getDist = (a, b) => distMatrix.get(a)?.get(b) ?? 1e9;

  const calcTotalCost = (arr) => {
    let cost = getDist(startNodeId, arr[0]);
    for (let i = 0; i < arr.length - 1; i++) {
      cost += getDist(arr[i], arr[i + 1]);
    }
    if (endNodeId) {
      cost += getDist(arr[arr.length - 1], endNodeId);
    }
    return cost;
  };

  let improved = true;
  let guard = 0;
  while (improved && guard < 50) {
    improved = false;
    guard++;
    let bestCost = calcTotalCost(route);

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        // 区間 [i..j] を反転
        const candidate = [
          ...route.slice(0, i),
          ...route.slice(i, j + 1).reverse(),
          ...route.slice(j + 1)
        ];
        const candCost = calcTotalCost(candidate);
        if (candCost + 1e-6 < bestCost) {
          for (let k = 0; k < n; k++) route[k] = candidate[k];
          bestCost = candCost;
          improved = true;
        }
      }
    }
  }
  return route;
}

/**
 * 指定されたブースグループを startNodeId から近傍法＋2-opt で順序付けする
 */
function solveGroupOrder(groupItems, startNodeId, distMatrix, endNodeId = null) {
  if (groupItems.length === 0) return [];
  if (groupItems.length === 1) return [groupItems[0]];

  const remaining = [...groupItems];
  const ordered = [];
  let currId = startNodeId;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const d = distMatrix.get(currId)?.get(cand.accessNodeId) ?? Infinity;
      if (d < bestDist - 1e-6) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const chosen = remaining.splice(bestIdx, 1)[0];
    ordered.push(chosen);
    currId = chosen.accessNodeId;
  }

  // アクセスノードID列で 2-opt 最適化 (同一アクセスノードを持つ複数サークルにも対応するためインデックス管理)
  const indices = ordered.map((_, idx) => idx);
  const idxDistMatrix = new Map();
  idxDistMatrix.set('START', new Map());
  for (let i = 0; i < ordered.length; i++) {
    idxDistMatrix.get('START').set(i, distMatrix.get(startNodeId)?.get(ordered[i].accessNodeId) ?? 1e9);
    const row = new Map();
    for (let j = 0; j < ordered.length; j++) {
      row.set(j, distMatrix.get(ordered[i].accessNodeId)?.get(ordered[j].accessNodeId) ?? 1e9);
    }
    if (endNodeId) {
      row.set('END', distMatrix.get(ordered[i].accessNodeId)?.get(endNodeId) ?? 1e9);
    }
    idxDistMatrix.set(i, row);
  }

  const optimizedIndices = optimizeOrder2Opt(
    indices,
    'START',
    idxDistMatrix,
    endNodeId ? 'END' : null
  );

  return optimizedIndices.map(i => ordered[i]);
}

/**
 * 連続する同一直線上の3点の中間点を間引いてSVGポリラインを綺麗にする
 */
function simplifyCollinearPoints(points) {
  if (points.length <= 2) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];
    if (Math.hypot(curr.x - prev.x, curr.y - prev.y) < 0.05) continue;
    const cross = Math.abs((curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x));
    const dot = (curr.x - prev.x) * (next.x - curr.x) + (curr.y - prev.y) * (next.y - curr.y);
    if (cross < 0.05 && dot >= 0) {
      continue;
    }
    result.push(curr);
  }
  const last = points[points.length - 1];
  const prev = result[result.length - 1];
  if (Math.hypot(last.x - prev.x, last.y - prev.y) >= 0.05) {
    result.push(last);
  }
  return result;
}

/**
 * 巡回ルートを計算するメイン関数
 *
 * @param {Object} routeData - map_routes.json データ
 * @param {Array} targetPins - 対象サークル配列 [{ circle_id, circle, x, y, priority, isCompleted, spaceLabel }]
 * @param {Object} options
 * @param {'priority'|'shortest'} [options.orderMode='priority'] - 'priority' (優先度順 S→A→B→未設定) | 'shortest' (全体最短順)
 * @param {boolean} [options.returnToEntrance=false] - 最後のブースから入口へ戻るか
 * @returns {Object} 計算結果 (orderedStops, polylinePoints, returnPolylinePoints, directionArrows, totalDistance, returnDistance)
 */
export function calculatePatrolRoute(routeData, targetPins = [], options = {}) {
  const orderMode = options.orderMode || 'priority';
  const returnToEntrance = Boolean(options.returnToEntrance);

  if (!routeData || !Array.isArray(targetPins) || targetPins.length === 0) {
    return {
      orderedStops: [],
      polylinePoints: [],
      returnPolylinePoints: [],
      directionArrows: [],
      totalDistance: 0,
      returnDistance: 0,
      entrancePoint: routeData?.entrance || { x: 190.0, y: 140.0 }
    };
  }

  // 1. 拡張グラフ構築
  const {
    nodesMap,
    adj,
    entranceNodeId,
    entrancePoint,
    boothAccessMap
  } = buildExtendedRouteGraph(routeData, targetPins);

  // 2. 対象ブースに accessNodeId を付与 (安定ソートで初期順序を統一)
  const enrichedItems = targetPins
    .map(item => {
      const access = boothAccessMap.get(item.circle_id);
      if (!access) return null;
      return {
        ...item,
        accessNodeId: access.accessNodeId,
        ax: access.ax,
        ay: access.ay,
        fx: access.fx,
        fy: access.fy
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const symA = a.circle?.space_sym || '';
      const symB = b.circle?.space_sym || '';
      if (symA !== symB) return symA.localeCompare(symB);
      return (parseInt(a.circle?.space_num, 10) || 0) - (parseInt(b.circle?.space_num, 10) || 0);
    });

  if (enrichedItems.length === 0) {
    return {
      orderedStops: [],
      polylinePoints: [],
      returnPolylinePoints: [],
      directionArrows: [],
      totalDistance: 0,
      returnDistance: 0,
      entrancePoint
    };
  }

  // 3. 起点＋全アクセスノード間の全対最短距離と経路テーブルをダイクストラで構築
  const keyNodeIds = Array.from(new Set([entranceNodeId, ...enrichedItems.map(it => it.accessNodeId)]));
  const distMatrix = new Map();
  const prevMatrix = new Map();

  for (const nid of keyNodeIds) {
    const { dist, prev } = runDijkstra(adj, nid);
    distMatrix.set(nid, dist);
    prevMatrix.set(nid, prev);
  }

  // 4. 巡回順の決定
  let orderedItems = [];
  if (orderMode === 'shortest') {
    orderedItems = solveGroupOrder(
      enrichedItems,
      entranceNodeId,
      distMatrix,
      returnToEntrance ? entranceNodeId : null
    );
  } else {
    // デフォルト: 優先度順 (S -> A -> B -> 未設定) の大枠を守り、各優先度内を近傍法＋2-optで最短化
    const tiers = ['S', 'A', 'B', ''];
    const nonEmptyTiers = tiers
      .map(prio => enrichedItems.filter(it => (it.priority || '') === prio))
      .filter(group => group.length > 0);

    let currentAnchorId = entranceNodeId;
    nonEmptyTiers.forEach((group, tierIdx) => {
      const isLastTier = tierIdx === nonEmptyTiers.length - 1;
      const tierOrdered = solveGroupOrder(
        group,
        currentAnchorId,
        distMatrix,
        isLastTier && returnToEntrance ? entranceNodeId : null
      );
      orderedItems.push(...tierOrdered);
      if (tierOrdered.length > 0) {
        currentAnchorId = tierOrdered[tierOrdered.length - 1].accessNodeId;
      }
    });
  }

  // 5. 経路ノード列の復元と距離集計
  const rawRoutePoints = [];
  const legSegments = [];
  let totalDistance = 0;
  let currNodeId = entranceNodeId;

  const orderedStops = orderedItems.map((item, idx) => {
    const prevMap = prevMatrix.get(currNodeId);
    const legDist = distMatrix.get(currNodeId)?.get(item.accessNodeId) ?? 0;
    const nodePath = reconstructPath(prevMap, currNodeId, item.accessNodeId);
    const legPts = nodePath.map(id => {
      const n = nodesMap.get(id);
      return { x: n.x, y: n.y, id };
    });

    if (legPts.length > 0) {
      if (rawRoutePoints.length === 0) {
        rawRoutePoints.push(...legPts);
      } else {
        rawRoutePoints.push(...legPts.slice(1));
      }
      legSegments.push(simplifyCollinearPoints(legPts));
    }

    totalDistance += legDist;
    currNodeId = item.accessNodeId;

    return {
      ...item,
      visitOrder: idx + 1,
      legDistance: Number(legDist.toFixed(1)),
      cumulativeDistance: Number(totalDistance.toFixed(1))
    };
  });

  // 同一または隣接ブース訪問時の番号バッジ重なり防止オフセット計算
  const badgePositions = computeBadgePositions(orderedStops);
  orderedStops.forEach((stop, i) => {
    stop.badgeX = badgePositions[i].x;
    stop.badgeY = badgePositions[i].y;
  });

  const polylinePoints = simplifyCollinearPoints(rawRoutePoints);

  // 6. オプション「入口に戻る」経路の復元
  let returnPolylinePoints = [];
  let returnDistance = 0;
  if (returnToEntrance && orderedStops.length > 0) {
    const lastNodeId = orderedStops[orderedStops.length - 1].accessNodeId;
    const prevMap = prevMatrix.get(lastNodeId);
    returnDistance = distMatrix.get(lastNodeId)?.get(entranceNodeId) ?? 0;
    const returnNodePath = reconstructPath(prevMap, lastNodeId, entranceNodeId);
    returnPolylinePoints = simplifyCollinearPoints(
      returnNodePath.map(id => {
        const n = nodesMap.get(id);
        return { x: n.x, y: n.y, id };
      })
    );
  }

  // 7. 進行方向矢印 (シェブロン) の配置計算
  const directionArrows = computeDirectionArrows(polylinePoints);

  return {
    orderedStops,
    polylinePoints,
    legSegments,
    returnPolylinePoints,
    directionArrows,
    totalDistance: Number((totalDistance + returnDistance).toFixed(1)),
    outwardDistance: Number(totalDistance.toFixed(1)),
    returnDistance: Number(returnDistance.toFixed(1)),
    entrancePoint
  };
}

/**
 * 訪問順バッジの座標を計算 (ブースから通路側に少し寄せ、近接時は重ならないよう微小分散)
 */
function computeBadgePositions(stops) {
  const raw = stops.map(s => {
    // ブース中心 (x, y) から通路アクセス点 (ax, ay) 方向へ 35% 寄せた位置を基本バッジ座標とする
    const bx = s.x + (s.ax - s.x) * 0.38;
    const by = s.y + (s.ay - s.y) * 0.38;
    return { x: bx, y: by };
  });

  // 近接バッジ同士の簡易反発 (8px未満の重なりを解消)
  const minSep = 8.5;
  for (let iter = 0; iter < 6; iter++) {
    for (let i = 0; i < raw.length; i++) {
      for (let j = i + 1; j < raw.length; j++) {
        const dx = raw[j].x - raw[i].x;
        const dy = raw[j].y - raw[i].y;
        const d = Math.hypot(dx, dy);
        if (d < minSep) {
          const push = (minSep - d) / 2;
          const ux = d > 0.01 ? dx / d : 0;
          const uy = d > 0.01 ? dy / d : 1;
          raw[i].x -= ux * push;
          raw[i].y -= uy * push;
          raw[j].x += ux * push;
          raw[j].y += uy * push;
        }
      }
    }
  }

  return raw.map(p => ({
    x: Number(p.x.toFixed(1)),
    y: Number(p.y.toFixed(1))
  }));
}

/**
 * ポリライン上の各直線セグメントに進行方向矢印を配置する
 */
function computeDirectionArrows(points) {
  const arrows = [];
  if (!points || points.length < 2) return arrows;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 28) continue;
    const angleDeg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

    if (len > 140) {
      // 長い直線通路には2箇所に矢印を配置
      for (const ratio of [0.35, 0.72]) {
        arrows.push({
          x: Number((a.x + (b.x - a.x) * ratio).toFixed(1)),
          y: Number((a.y + (b.y - a.y) * ratio).toFixed(1)),
          angle: Number(angleDeg.toFixed(1))
        });
      }
    } else {
      arrows.push({
        x: Number(((a.x + b.x) / 2).toFixed(1)),
        y: Number(((a.y + b.y) / 2).toFixed(1)),
        angle: Number(angleDeg.toFixed(1))
      });
    }
  }
  return arrows;
}

/**
 * 通路グラフと全552ブースの到達可能性・セル非交差を自動検証する関数
 */
export function validateRouteGraph(routeData, mapCoords) {
  const singleBooths = getSingleBoothCells(mapCoords);
  const boothItems = singleBooths.map(cell => ({
    circle_id: cell.key,
    space_sym: cell.sym,
    space_num: cell.key.split('-')[1],
    x: cell.x1,
    y: cell.y1
  }));

  const { nodesMap, adj, entranceNodeId, boothAccessMap } = buildExtendedRouteGraph(routeData, boothItems);
  const { dist } = runDijkstra(adj, entranceNodeId);

  let unreachableCount = 0;
  const unreachableKeys = [];
  for (const item of boothItems) {
    const access = boothAccessMap.get(item.circle_id);
    if (!access || !dist.has(access.accessNodeId) || !Number.isFinite(dist.get(access.accessNodeId))) {
      unreachableCount++;
      unreachableKeys.push(item.circle_id);
    }
  }

  let intersectionCount = 0;
  const intersectingEdges = [];
  for (const e of (routeData.edges || [])) {
    const pa = nodesMap.get(e.a);
    const pb = nodesMap.get(e.b);
    if (!pa || !pb) continue;
    for (const cell of singleBooths) {
      if (segmentIntersectsRect(pa.x, pa.y, pb.x, pb.y, cell.x1, cell.y1, cell.x2, cell.y2)) {
        intersectionCount++;
        intersectingEdges.push({ edge: e, cell: cell.key });
      }
    }
  }

  return {
    boothsTotal: singleBooths.length,
    nodesTotal: (routeData.nodes || []).length,
    edgesTotal: (routeData.edges || []).length,
    unreachableFromEntrance: unreachableCount,
    unreachableKeys,
    aisleVsBoothCellIntersections: intersectionCount,
    intersectingEdges,
    isValid: unreachableCount === 0 && intersectionCount === 0
  };
}
