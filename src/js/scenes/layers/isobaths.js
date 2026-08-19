/**
 * 等深线网格。
 *
 * secret：刻度间隔怎么随视窗自适应。
 *
 * 间隔逻辑对外导出（tickInterval），供 depth-axis 复用——
 * 网格线和刻度标签必须落在同一批深度上，否则读数对不上格线。
 * 这是两个图层共享的唯一状态，用一个纯函数而不是全局变量传递。
 */

import { rgba } from '../palette.js';

/** 深度刻度间隔（m）。视窗越窄，刻度越密。 */
export function tickInterval(spanM) {
  if (spanM > 9000) return 1000;
  if (spanM > 4500) return 500;
  if (spanM > 1800) return 250;
  return 100;
}

/** 断面距离刻度间隔（km）。 */
export function distanceInterval(spanKm) {
  if (spanKm > 180) return 50;
  if (spanKm > 90) return 20;
  return 10;
}

export function createIsobaths() {
  return {
    id: 'isobaths',

    draw(frame) {
      const { ctx, w, h, depthWindow, color } = frame;
      const span = depthWindow.bottom - depthWindow.top;
      const step = tickInterval(span);
      const first = Math.ceil(depthWindow.top / step) * step;

      ctx.save();
      ctx.lineWidth = 1;

      for (let depth = first; depth <= depthWindow.bottom; depth += step) {
        const y = Math.round(frame.sy(depth)) + 0.5;
        if (y < -1 || y > h + 1) continue;
        // 千米整数线更实，中间线更虚 —— 让读者不数格子也能定位
        const major = depth % 1000 === 0;
        ctx.strokeStyle = rgba(color.current, major ? 0.11 : 0.055);
        ctx.setLineDash(major ? [] : [3, 6]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.restore();
    },
  };
}
