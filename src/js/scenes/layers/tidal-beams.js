/**
 * 内潮波束特征线。仅在 mode === 'tides' 时可见。
 *
 * secret：波束几何从哪来、脉动相位怎么算。
 *
 * 几何**不在这里推导**——直接取 science/flow-field.js 的 beamGeometry()。
 * 若这里另写一套斜率，画出来的线就会和粒子实际受力的方向对不上，
 * 那正是方案 §08 禁止的「无法说明科研含义的科技感线条」。
 */

import { beamGeometry, M2_PERIOD_S } from '../../science/flow-field.js';
import { rgba } from '../palette.js';

export function createTidalBeams() {
  const geometry = beamGeometry();

  return {
    id: 'tidal-beams',

    draw(frame) {
      if (frame.mode !== 'tides') return;
      const { ctx, color } = frame;

      // 相位与速度场同源：观众看到的明暗脉动就是粒子受到的振荡
      const phase = (frame.time / M2_PERIOD_S) * Math.PI * 2;
      const pulse = 0.5 + 0.5 * Math.cos(phase);

      ctx.save();
      for (const beam of geometry) {
        const x0 = frame.sx(beam.from.x);
        const y0 = frame.sy(beam.from.z);
        const x1 = frame.sx(beam.to.x);
        const y1 = frame.sy(beam.to.z);
        const halfPx = beam.halfWidth * frame.pxPerMeterY;

        // 波束包络：沿法向的高斯宽度用一条粗描边近似，比逐像素着色便宜两个量级
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, rgba(color.coral, 0.02 + 0.16 * pulse));
        grad.addColorStop(0.45, rgba(color.coral, 0.015 + 0.1 * pulse));
        grad.addColorStop(1, rgba(color.coral, 0));

        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(6, halfPx * 1.6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        // 特征线本身：细实线，说明这是一条有斜率含义的射线，不是光晕
        ctx.strokeStyle = rgba(color.coral, 0.28 + 0.3 * pulse);
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.setLineDash([]);

        // 生成点
        ctx.fillStyle = rgba(color.coral, 0.75);
        ctx.beginPath();
        ctx.arc(x0, y0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}
