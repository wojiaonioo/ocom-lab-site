/**
 * 流场粒子平流。
 *
 * secret：粒子池管理、轨迹存储、重播种策略、按质量档减配。
 * 外界只有 update(dt, frame) 与 draw(frame)。
 *
 * 方案 §08 约束：「粒子速度保持缓慢，表现平流和水团运动，而不是高速科技特效」。
 * 因此不做速度线拉伸、不做辉光叠加、不做鼠标扰动。粒子只做一件事：跟着速度场走。
 *
 * 性能：轨迹按主导层分成 3 条 Path2D 批量描边，每帧 3 次 stroke，
 * 而不是 520 粒子 × 12 段 = 6240 次。
 */

import { rng, wrap } from '../../science/math.js';
import { velocityAt, dominantLayer, X_TO_M } from '../../science/flow-field.js';
import { depthAt, TRANSECT } from '../../science/bathymetry.js';
import { rgba } from '../palette.js';

/** 质量档 → 粒子数与轨迹长度。low 档不画粒子，由 fallback 的静态流线接手。 */
const PROFILE = {
  high: { count: 520, trail: 12 },
  medium: { count: 260, trail: 7 },
  low: { count: 0, trail: 0 },
};

/** 主导层 → 调色板令牌。三层用三种颜色，是"三层结构"最直接的视觉编码。 */
const TONE = { upper: 'observation', intermediate: 'current', hadal: 'sediment' };

/** 粒子寿命（海洋时间秒）上限，加随机抖动，避免整批同时重生造成"呼吸"。 */
const LIFE_BASE = 9e5;

export function createParticles(quality = 'high') {
  const random = rng(20140319); // 确定性种子：截图可逐帧复现（science/math.js 说明）
  let profile = PROFILE[quality] || PROFILE.high;
  /** @type {Array<{x:number,z:number,age:number,life:number,tone:string,trail:Float64Array,head:number,filled:number}>} */
  let pool = [];

  function seed(particle, frame) {
    // 80% 在当前视窗内重生，保证放大到深渊段后仍有足够粒子密度；
    // 20% 全域重生，维持视窗外的场也在演化，滚回去时不会看到空白
    const inView = random() < 0.8 && frame;
    const xw = inView ? frame.xWindow : { left: 0, right: 1 };
    const dw = inView ? frame.depthWindow : { top: 0, bottom: TRANSECT.maxDepthM };

    const x = xw.left + random() * (xw.right - xw.left);
    const floor = depthAt(x);
    const top = Math.max(0, dw.top);
    const bottom = Math.min(floor - 30, dw.bottom);
    particle.x = x;
    particle.z = bottom > top ? top + random() * (bottom - top) : floor * 0.5;
    particle.age = 0;
    particle.life = LIFE_BASE * (0.5 + random());
    particle.tone = TONE[dominantLayer(particle.z)] || 'current';
    particle.head = 0;
    particle.filled = 0;
    particle.trail.fill(0);
    return particle;
  }

  function resize(frame) {
    const want = profile.count;
    if (pool.length === want && (!pool.length || pool[0].trail.length === profile.trail * 2)) return;
    pool = new Array(want);
    for (let i = 0; i < want; i += 1) {
      pool[i] = seed(
        { x: 0, z: 0, age: 0, life: 0, tone: 'current', trail: new Float64Array(Math.max(1, profile.trail) * 2), head: 0, filled: 0 },
        frame,
      );
    }
  }

  return {
    id: 'particles',

    setQuality(next) {
      profile = PROFILE[next] || PROFILE.medium;
      pool = [];
    },

    update(dt, frame) {
      if (frame.reducedMotion || !profile.count) return;
      if (pool.length !== profile.count) resize(frame);

      // 海洋时间步长：墙钟 dt × TIME_SCALE，由帧对象给出（见 scene-contract.js）
      const step = frame.oceanDt;

      for (const p of pool) {
        const { u, w } = velocityAt(p.x, p.z, { time: frame.time, mode: frame.mode });

        // 记录轨迹（环形缓冲，写在推进之前，头部即当前位置）
        if (profile.trail) {
          p.trail[p.head * 2] = p.x;
          p.trail[p.head * 2 + 1] = p.z;
          p.head = (p.head + 1) % profile.trail;
          if (p.filled < profile.trail) p.filled += 1;
        }

        p.x += (u * step) / X_TO_M;
        p.z += w * step;
        p.age += step;

        const floor = depthAt(p.x);
        if (p.x < 0 || p.x > 1 || p.z < 0 || p.z >= floor || p.age > p.life) {
          seed(p, frame);
        } else if (p.age % 1e5 < step) {
          p.tone = TONE[dominantLayer(p.z)] || p.tone;
        }
      }
    },

    draw(frame) {
      if (frame.reducedMotion || !pool.length) return;
      const { ctx, color } = frame;

      // 按色调分组批量描边
      const paths = { observation: new Path2D(), current: new Path2D(), sediment: new Path2D() };
      const heads = { observation: [], current: [], sediment: [] };

      for (const p of pool) {
        const path = paths[p.tone];
        if (!path) continue;
        if (p.filled > 1) {
          const start = (p.head - p.filled + profile.trail) % profile.trail;
          let moved = false;
          let prevPx = 0;
          for (let k = 0; k < p.filled; k += 1) {
            const idx = (start + k) % profile.trail;
            const px = frame.sx(p.trail[idx * 2]);
            const py = frame.sy(p.trail[idx * 2 + 1]);
            // 断面回绕会让轨迹横跨整幅画面，出现假的长直线，此处断开
            if (moved && Math.abs(px - prevPx) > frame.w * 0.25) {
              moved = false;
            }
            if (!moved) {
              path.moveTo(px, py);
              moved = true;
            } else path.lineTo(px, py);
            prevPx = px;
          }
        }
        heads[p.tone].push(frame.sx(p.x), frame.sy(p.z));
      }

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [tone, path] of Object.entries(paths)) {
        ctx.strokeStyle = rgba(color[tone], tone === 'sediment' ? 0.34 : 0.3);
        ctx.lineWidth = 1;
        ctx.stroke(path);
      }
      for (const [tone, list] of Object.entries(heads)) {
        ctx.fillStyle = rgba(color[tone], 0.85);
        for (let i = 0; i < list.length; i += 2) ctx.fillRect(list[i] - 0.9, list[i + 1] - 0.9, 1.8, 1.8);
      }
      ctx.restore();
    },

    dispose() {
      pool = [];
    },
  };
}

/** 供 fallback 复用：把回绕逻辑收在一处。 */
export const wrapX = (x) => wrap(x, 0, 1);
