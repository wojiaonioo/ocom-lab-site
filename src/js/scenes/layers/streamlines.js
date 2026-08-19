/**
 * 静态流线 —— 减少动态效果 / 低质量档下的降级层。
 *
 * secret：流线积分步长、种子布置、缓存失效时机。
 *
 * 方案 §08 降级策略表明确规定：「流场粒子平流 → 静态流线图」。
 * 关键设计：静态图**必须画箭头**。动画靠运动传达流向，静止后没有箭头
 * 就只剩一堆曲线，方向信息完全丢失——降级不能降掉语义。
 *
 * 流线只依赖速度场，与视窗无关，因此按 mode 缓存在域坐标里，滚动时零重算。
 */

import { velocityAt, X_TO_M } from '../../science/flow-field.js';
import { depthAt } from '../../science/bathymetry.js';
import { dominantLayer } from '../../science/flow-field.js';
import { rgba } from '../palette.js';

const TONE = { upper: 'observation', intermediate: 'current', hadal: 'sediment' };

const SEED_X = [0.1, 0.22, 0.34, 0.44, 0.56, 0.66, 0.78, 0.9];
const SEED_Z = [200, 900, 2200, 3600, 5200, 7000, 8800, 10200];

const STEP_S = 1e4; // 每积分步的海洋时间（秒）
const MAX_STEPS = 70;

function trace(x0, z0, mode, dir) {
  const pts = [[x0, z0]];
  let x = x0;
  let z = z0;
  for (let i = 0; i < MAX_STEPS; i += 1) {
    const { u, w } = velocityAt(x, z, { time: 0, mode });
    if (Math.abs(u) < 2e-4) break;
    x += (dir * u * STEP_S) / X_TO_M;
    z += dir * w * STEP_S;
    if (x < 0.01 || x > 0.99 || z < 5 || z >= depthAt(x) - 5) break;
    pts.push([x, z]);
  }
  return pts;
}

function build(mode) {
  const lines = [];
  for (const x0 of SEED_X) {
    for (const z0 of SEED_Z) {
      if (z0 >= depthAt(x0) - 120) continue;
      const back = trace(x0, z0, mode, -1).reverse();
      const fwd = trace(x0, z0, mode, +1);
      const pts = [...back.slice(0, -1), ...fwd];
      if (pts.length < 6) continue;
      lines.push({ pts, tone: TONE[dominantLayer(z0)] || 'current', eastward: velocityAt(x0, z0, { mode }).u > 0 });
    }
  }
  return lines;
}

export function createStreamlines() {
  const cache = new Map();

  return {
    id: 'streamlines',

    draw(frame) {
      // 只在粒子停摆时接管
      if (!frame.reducedMotion && frame.quality !== 'low') return;

      if (!cache.has(frame.mode)) cache.set(frame.mode, build(frame.mode));
      const lines = cache.get(frame.mode);
      const { ctx, color } = frame;

      ctx.save();
      ctx.lineCap = 'round';
      for (const line of lines) {
        ctx.strokeStyle = rgba(color[line.tone], 0.42);
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        line.pts.forEach(([x, z], i) => {
          const px = frame.sx(x);
          const py = frame.sy(z);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // 箭头：静态图唯一的流向载体
        const mid = Math.floor(line.pts.length / 2);
        const a = line.pts[Math.max(0, mid - 1)];
        const b = line.pts[Math.min(line.pts.length - 1, mid + 1)];
        const ax = frame.sx(a[0]);
        const ay = frame.sy(a[1]);
        const bx = frame.sx(b[0]);
        const by = frame.sy(b[1]);
        const angle = Math.atan2(by - ay, bx - ax);
        const tipX = frame.sx(line.pts[mid][0]);
        const tipY = frame.sy(line.pts[mid][1]);
        const size = 4.5;

        ctx.fillStyle = rgba(color[line.tone], 0.8);
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - size * Math.cos(angle - 0.42), tipY - size * Math.sin(angle - 0.42));
        ctx.lineTo(tipX - size * Math.cos(angle + 0.42), tipY - size * Math.sin(angle + 0.42));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },

    dispose() {
      cache.clear();
    },
  };
}
