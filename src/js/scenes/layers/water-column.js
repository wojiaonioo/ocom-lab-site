/**
 * 水体图层：按**深度**而非屏幕位置着色。
 *
 * secret：色标怎么定义、视窗裁切后端点色怎么补。
 *
 * 关键点：渐变必须绑定深度。下潜到深渊段时，画面顶端已经是 5400 m，
 * 若渐变仍按屏幕 0→1 铺，顶端会重新变成浅蓝——观众会以为又浮回海面。
 * 因此视窗端点的颜色由 colorAtDepth() 反算，而不是取色标首尾。
 */

import { mixColor } from '../palette.js';

/** 色标：深度（m）→ 令牌。取自方案 §04 色彩令牌表。 */
const STOPS = [
  { depth: 0, key: 'surface' },
  { depth: 900, key: 'trench' },
  { depth: 3200, key: 'midwater' },
  { depth: 11400, key: 'abyss' },
];

/** 任意深度的水色。 */
function colorAtDepth(depth, color, alpha = 1) {
  if (depth <= STOPS[0].depth) return mixColor(color[STOPS[0].key], color[STOPS[0].key], 0, alpha);
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (depth <= b.depth) {
      return mixColor(color[a.key], color[b.key], (depth - a.depth) / (b.depth - a.depth), alpha);
    }
  }
  return mixColor(color.abyss, color.abyss, 0, alpha);
}

export function createWaterColumn() {
  return {
    id: 'water-column',

    draw(frame) {
      const { ctx, w, h, depthWindow, color } = frame;
      const span = depthWindow.bottom - depthWindow.top;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, colorAtDepth(depthWindow.top, color));
      for (const stop of STOPS) {
        const at = (stop.depth - depthWindow.top) / span;
        if (at <= 0.001 || at >= 0.999) continue;
        grad.addColorStop(at, color[stop.key]);
      }
      grad.addColorStop(1, colorAtDepth(depthWindow.bottom, color));

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 表层微光：仅在海面进入视窗时出现，作为"深度已改变"的可读线索
      const surfaceY = frame.sy(0);
      if (surfaceY > -40 && surfaceY < h) {
        const glow = ctx.createLinearGradient(0, surfaceY - 30, 0, surfaceY + 160);
        glow.addColorStop(0, mixColor(color.foam, color.surface, 0.35, 0.22));
        glow.addColorStop(1, mixColor(color.surface, color.surface, 0, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(0, Math.max(0, surfaceY - 30), w, 190);
      }
    },
  };
}
