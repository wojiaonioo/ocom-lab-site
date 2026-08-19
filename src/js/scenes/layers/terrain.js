/**
 * 海底地形。
 *
 * secret：采样密度、沉积纹理、坡面明暗。
 *
 * **绘制顺序上必须在粒子之后** —— 地形填充同时承担遮挡职责，
 * 让越过海底的粒子自然消失，而不是靠逐粒子做碰撞剔除。
 * 这把"粒子不能穿透海底"从一条运行时规则变成了绘制顺序的必然结果。
 */

import { depthAt } from '../../science/bathymetry.js';
import { mixColor, rgba } from '../palette.js';

export function createTerrain() {
  return {
    id: 'terrain',

    draw(frame) {
      const { ctx, w, h, xWindow, color } = frame;
      // 按画布宽度自适应采样：横向放大后仍保持轮廓平滑
      const n = Math.min(560, Math.max(160, Math.round(w / 2)));

      const pts = new Array(n);
      for (let i = 0; i < n; i += 1) {
        const x = xWindow.left + ((xWindow.right - xWindow.left) * i) / (n - 1);
        pts[i] = { px: frame.sx(x), py: frame.sy(depthAt(x)), x };
      }

      // 地形体
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0].px, pts[0].py);
      for (let i = 1; i < n; i += 1) ctx.lineTo(pts[i].px, pts[i].py);
      ctx.lineTo(w, h + 2);
      ctx.lineTo(0, h + 2);
      ctx.closePath();

      const body = ctx.createLinearGradient(0, 0, 0, h);
      body.addColorStop(0, mixColor(color.abyss, color.trench, 0.32));
      body.addColorStop(1, mixColor(color.abyss, color.ink, 0.6));
      ctx.fillStyle = body;
      ctx.fill();

      // 沉积层理：裁在地形内部，表达"这是沉积物不是黑色色块"
      ctx.clip();
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(color.sediment, 0.05);
      for (let k = 1; k <= 7; k += 1) {
        ctx.beginPath();
        for (let i = 0; i < n; i += 1) {
          const y = pts[i].py + k * 16 + Math.sin(pts[i].x * 26 + k) * 3;
          if (i === 0) ctx.moveTo(pts[i].px, y);
          else ctx.lineTo(pts[i].px, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 海底界线：整幅图里唯一的暖色实线，视线沿它就能读出海沟形态
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0].px, pts[0].py);
      for (let i = 1; i < n; i += 1) ctx.lineTo(pts[i].px, pts[i].py);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = rgba(color.sediment, 0.72);
      ctx.stroke();

      // 界线下方的浅辉光，制造"坡面受光"的体积感，不使用任何 3D 光照
      ctx.lineWidth = 7;
      ctx.strokeStyle = rgba(color.sediment, 0.06);
      ctx.stroke();
      ctx.restore();
    },
  };
}
