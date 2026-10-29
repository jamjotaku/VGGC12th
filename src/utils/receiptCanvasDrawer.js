// src/utils/receiptCanvasDrawer.js

/**
 * HTML5 Canvas 2D を使用して、戦利品レシート画像を高解像度でレンダリングする描画エンジン
 * （Retina対応、完全オフライン動作）
 * 
 * @param {HTMLCanvasElement} canvas
 * @param {Object} summary - calculateReceiptSummary の計算結果
 * @returns {string} dataUrl (PNG)
 */
export function drawReceiptToCanvas(canvas, summary) {
  if (!canvas) return '';

  const scale = 2; // 高解像度Retina対応
  const baseWidth = 540;
  
  // アイテム数に応じた高さ自動計算
  const headerHeight = 190;
  const itemLineHeight = 44;
  const itemsHeight = Math.max(summary.items.length * itemLineHeight, 60);
  const totalSectionHeight = summary.budget > 0 ? 150 : 110;
  const footerHeight = 160;
  const baseHeight = headerHeight + itemsHeight + totalSectionHeight + footerHeight;

  canvas.width = baseWidth * scale;
  canvas.height = baseHeight * scale;
  canvas.style.width = `${baseWidth}px`;
  canvas.style.height = `${baseHeight}px`;

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(scale, scale);

  // 1. 背景描画 (わずかに温かみのある感熱紙ホワイト)
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // 左右に薄いシャドウ境界
  ctx.strokeStyle = '#e2ded5';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, baseWidth, baseHeight);

  // 2. 上部ミシン目ギザギザ
  drawZigzagEdge(ctx, 0, 0, baseWidth, 8, true);

  // 3. ヘッダー描画
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';

  // ロゴ・タイトル
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('VGGC 12th', baseWidth / 2, 42);

  ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('OFFICIAL LOOT RECEIPT (戦利品受領書)', baseWidth / 2, 62);

  ctx.font = '500 11px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`NO: ${summary.receiptNo}   DATE: ${summary.issuedAt}`, baseWidth / 2, 82);
  ctx.fillText('PLACE: 東京流通センター (TRC) 第一展示場', baseWidth / 2, 98);

  // 区切り点線
  drawDashedLine(ctx, 30, 115, baseWidth - 30, 115);

  // テーブル見出し
  ctx.textAlign = 'left';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('配置 / サークル名', 34, 134);
  ctx.textAlign = 'right';
  ctx.fillText('金額 (税込)', baseWidth - 34, 134);

  drawDashedLine(ctx, 30, 144, baseWidth - 30, 144);

  // 4. 明細描画
  let currentY = 168;

  if (summary.items.length === 0) {
    ctx.textAlign = 'center';
    ctx.font = 'italic 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('購入済みの戦利品はまだありません', baseWidth / 2, currentY + 15);
    currentY += 50;
  } else {
    for (const item of summary.items) {
      // スペース番号バッジ
      ctx.fillStyle = '#0284c7';
      ctx.font = '800 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${item.space}]`, 34, currentY);

      // サークル名
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", Meiryo, sans-serif';
      const truncatedName = truncateText(ctx, item.name, 260);
      ctx.fillText(truncatedName, 94, currentY);

      // 金額
      ctx.textAlign = 'right';
      ctx.font = '800 13px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`¥${item.price.toLocaleString()}`, baseWidth - 34, currentY);

      // メモ（もしあれば）
      if (item.memo) {
        ctx.textAlign = 'left';
        ctx.font = '400 10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#64748b';
        const memoStr = `└ 📝 ${truncateText(ctx, item.memo, 320)}`;
        ctx.fillText(memoStr, 94, currentY + 15);
      }

      currentY += itemLineHeight;
    }
  }

  // 5. 合計・集計セクション
  drawDashedLine(ctx, 30, currentY, baseWidth - 30, currentY);
  currentY += 28;

  // 購入点数
  ctx.textAlign = 'left';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('戦利品点数 (サークル数)', 34, currentY);

  ctx.textAlign = 'right';
  ctx.font = '800 13px monospace';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(`${summary.itemCount} 点`, baseWidth - 34, currentY);
  currentY += 26;

  // 合計金額 (特大太字)
  ctx.textAlign = 'left';
  ctx.font = '900 17px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('合 計 金 額', 34, currentY + 2);

  ctx.textAlign = 'right';
  ctx.font = '900 24px monospace';
  ctx.fillStyle = '#e11d48'; // 鮮やかなローズレッド
  ctx.fillText(`¥${summary.totalSpent.toLocaleString()}`, baseWidth - 34, currentY + 4);
  currentY += 34;

  // 予算設定がある場合の差額表示
  if (summary.budget > 0) {
    ctx.textAlign = 'left';
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`設定予算: ¥${summary.budget.toLocaleString()}`, 34, currentY);

    ctx.textAlign = 'right';
    ctx.font = '800 12px -apple-system, BlinkMacSystemFont, monospace';
    if (summary.isOverBudget) {
      ctx.fillStyle = '#dc2626';
      ctx.fillText(`超過: +¥${summary.budgetDiff.toLocaleString()} 💸`, baseWidth - 34, currentY);
    } else {
      ctx.fillStyle = '#16a34a';
      ctx.fillText(`残金: ¥${Math.abs(summary.budgetDiff).toLocaleString()} ✨`, baseWidth - 34, currentY);
    }
    currentY += 24;
  }

  // 6. フッター (バーコード ＆ メッセージ)
  drawDashedLine(ctx, 30, currentY, baseWidth - 30, currentY);
  currentY += 26;

  // バーコード風描画
  drawFakeBarcode(ctx, baseWidth / 2 - 120, currentY, 240, 36, summary.receiptNo);
  currentY += 52;

  ctx.textAlign = 'center';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('THANK YOU FOR VISITING VGGC 12th!', baseWidth / 2, currentY);

  ctx.font = '500 10px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('https://vggc-12th.vercel.app/ #VGGC戦利品', baseWidth / 2, currentY + 16);

  // 7. 下部ミシン目ギザギザ
  drawZigzagEdge(ctx, 0, baseHeight - 8, baseWidth, 8, false);

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/**
 * 点線を描画するヘルパー
 */
function drawDashedLine(ctx, x1, y1, x2, y2) {
  ctx.save();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * 上下端のレシート切り取りギザギザを描画
 */
function drawZigzagEdge(ctx, x, y, width, height, isTop = false) {
  ctx.save();
  ctx.fillStyle = isTop ? '#0f172a' : '#0f172a'; // 外側のダーク背景に溶け込ませる切り欠き
  ctx.beginPath();
  const toothWidth = 10;
  const count = Math.ceil(width / toothWidth);

  for (let i = 0; i < count; i++) {
    const curX = x + i * toothWidth;
    if (isTop) {
      ctx.moveTo(curX, y);
      ctx.lineTo(curX + toothWidth / 2, y + height);
      ctx.lineTo(curX + toothWidth, y);
    } else {
      ctx.moveTo(curX, y + height);
      ctx.lineTo(curX + toothWidth / 2, y);
      ctx.lineTo(curX + toothWidth, y + height);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * バーコード風の縦縞を描画
 */
function drawFakeBarcode(ctx, x, y, width, height, code) {
  ctx.save();
  ctx.fillStyle = '#1e293b';

  // 擬似バーコードパターン生成
  let curX = x;
  let seed = 0;
  for (let i = 0; i < code.length; i++) seed += code.charCodeAt(i);

  while (curX < x + width) {
    seed = (seed * 9301 + 49297) % 233280;
    const barWidth = (seed % 3) + 1.2;
    const spaceWidth = ((seed >> 2) % 3) + 1.2;

    ctx.fillRect(curX, y, barWidth, height);
    curX += barWidth + spaceWidth;
  }
  ctx.restore();
}

/**
 * 幅に合わせてテキストを省略 (...)
 */
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 0 && ctx.measureText(trimmed + '...').width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + '...';
}
