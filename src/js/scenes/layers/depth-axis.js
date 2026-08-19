/**
 * 深度轴（右）+ 断面距离轴（顶）。
 *
 * secret：轴的位置、刻度密度、标签排布。
 *
 * 断面距离轴放在**顶部**：物理海洋的断面图惯例是深度向下增长、水平距离标在上沿，
 * 同时避开底部被地形填满的区域。
 * 深度轴放右侧：首屏文案在左侧，右侧是全幅唯一不承载文字的竖带。
 *
 * 刻度间隔与 isobaths 共用 tickInterval —— 标签必须落在格线上。
 */

import { tickInterval, distanceInterval } from './isobaths.js';
import { kmAt } from '../../science/bathymetry.js';
import { rgba } from '../palette.js';

export function createDepthAxis() {
  return {
    id: 'depth-axis',

    draw(frame) {
      const { ctx, w, h, color, narrow, depthWindow, xWindow } = frame;
      const gutter = narrow ? 46 : 66;
      const axisX = w - gutter;

      ctx.save();
      ctx.font = `500 ${narrow ? 9 : 10}px ${frame.font.mono}`;

      // ── 深度轴（右）
      const scrim = ctx.createLinearGradient(axisX - 26, 0, w, 0);
      scrim.addColorStop(0, rgba(color.abyss, 0));
      scrim.addColorStop(1, rgba(color.abyss, 0.55));
      ctx.fillStyle = scrim;
      ctx.fillRect(axisX - 26, 0, gutter + 26, h);

      ctx.strokeStyle = rgba(color.foam, 0.16);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(axisX + 0.5, 0);
      ctx.lineTo(axisX + 0.5, h);
      ctx.stroke();

      const step = tickInterval(depthWindow.bottom - depthWindow.top);
      const first = Math.ceil(depthWindow.top / step) * step;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      for (let depth = first; depth <= depthWindow.bottom; depth += step) {
        const y = Math.round(frame.sy(depth)) + 0.5;
        if (y < 12 || y > h - 6) continue;
        const major = depth % 1000 === 0;

        ctx.strokeStyle = rgba(color.foam, major ? 0.36 : 0.16);
        ctx.beginPath();
        ctx.moveTo(axisX + 0.5, y);
        ctx.lineTo(axisX + (major ? 7 : 4), y);
        ctx.stroke();

        if (!major && step >= 500) continue;
        ctx.fillStyle = rgba(color.foam, major ? 0.72 : 0.42);
        ctx.fillText(depth === 0 ? '0' : (depth / 1000).toFixed(step < 500 ? 2 : 1), axisX + 11, y);
      }

      ctx.fillStyle = rgba(color.foam, 0.55);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${frame.t({ zh: '水深', en: 'DEPTH' })} km`, w - 8, 10);

      // ── 断面距离轴（顶）
      const top = narrow ? 62 : 78;
      const spanKm = (xWindow.right - xWindow.left) * 240;
      const dStep = distanceInterval(spanKm);
      const kmLeft = kmAt(xWindow.left);
      const kmRight = kmAt(xWindow.right);
      const firstKm = Math.ceil(kmLeft / dStep) * dStep;

      ctx.strokeStyle = rgba(color.foam, 0.12);
      ctx.beginPath();
      ctx.moveTo(0, top + 0.5);
      ctx.lineTo(axisX - 30, top + 0.5);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let km = firstKm; km <= kmRight; km += dStep) {
        const px = frame.sx(km / 240);
        if (px < 16 || px > axisX - 42) continue;
        ctx.strokeStyle = rgba(color.foam, 0.24);
        ctx.beginPath();
        ctx.moveTo(px + 0.5, top - 4);
        ctx.lineTo(px + 0.5, top + 0.5);
        ctx.stroke();
        ctx.fillStyle = rgba(color.foam, 0.44);
        ctx.fillText(String(Math.round(km)), px, top + 5);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = rgba(color.foam, 0.4);
      ctx.fillText(`${frame.t({ zh: '断面距离', en: 'DISTANCE' })} km`, 4, top + 5);

      ctx.restore();
    },
  };
}
