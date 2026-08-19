/**
 * 深海潜标链示意。
 *
 * secret：潜标链的几何与仪器节点布置。
 *
 * 为什么这些参数写在场景层而不是 content/：
 * 这是**图形母题**（方案 §04「固定母题：等深线、流场粒子、水柱剖面、经纬度与深度刻度」），
 * 不是站点的内容资产。真实的站位、仪器清单在 content/expeditions.js，
 * 由观测航次详情页消费。scenes/ 依赖规则上也不允许 import content/（ARCHITECTURE §1）。
 */

import { depthAt } from '../../science/bathymetry.js';
import { rgba } from '../palette.js';

/** 仪器类型 → 记号尺寸与标签。深度为示意值。 */
const MOORINGS = [
  {
    x: 0.5,
    topM: 600,
    label: { zh: '深渊潜标链', en: 'Hadal mooring' },
    instruments: [
      { depthM: 1000, code: 'ADCP' },
      { depthM: 3200, code: 'CM' },
      { depthM: 6000, code: 'CTD' },
      { depthM: 8600, code: 'CM' },
      { depthM: 10600, code: 'CTD' },
    ],
  },
  {
    x: 0.255,
    topM: 900,
    label: { zh: '平原对照潜标', en: 'Reference mooring' },
    instruments: [
      { depthM: 1500, code: 'ADCP' },
      { depthM: 3400, code: 'CM' },
      { depthM: 5300, code: 'CTD' },
    ],
  },
];

export function createMoorings() {
  return {
    id: 'moorings',

    draw(frame) {
      const { ctx, color, mode, narrow } = frame;
      const focused = mode === 'moorings';
      const alpha = focused ? 1 : 0.45;

      ctx.save();
      ctx.font = `500 10px ${frame.font.mono}`;
      ctx.textBaseline = 'middle';

      for (const mooring of MOORINGS) {
        const px = frame.sx(mooring.x);
        if (px < -60 || px > frame.w + 60) continue;

        const anchorM = depthAt(mooring.x) - 15;
        const yTop = frame.sy(mooring.topM);
        const yAnchor = frame.sy(anchorM);
        if (yAnchor < 0 || yTop > frame.h) continue;

        // 缆绳：贴底段受流影响的轻微倾斜，用两段折线表达，不做摆动动画
        const drift = focused ? 6 : 3;
        ctx.strokeStyle = rgba(color.foam, 0.3 * alpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + drift, yTop);
        ctx.quadraticCurveTo(px + drift * 0.4, (yTop + yAnchor) / 2, px, yAnchor);
        ctx.stroke();

        // 顶部浮球
        ctx.fillStyle = rgba(color.foam, 0.8 * alpha);
        ctx.beginPath();
        ctx.arc(px + drift, yTop, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // 锚
        ctx.fillStyle = rgba(color.sediment, 0.85 * alpha);
        ctx.fillRect(px - 4, yAnchor - 2, 8, 4);

        // 仪器节点
        for (const inst of mooring.instruments) {
          const y = frame.sy(inst.depthM);
          if (y < -10 || y > frame.h + 10) continue;
          const tt = (inst.depthM - mooring.topM) / Math.max(1, anchorM - mooring.topM);
          const nx = px + drift * (1 - tt);

          ctx.fillStyle = rgba(color.current, 0.95 * alpha);
          ctx.fillRect(nx - 2.6, y - 2.6, 5.2, 5.2);

          if (focused && !narrow) {
            ctx.fillStyle = rgba(color.foam, 0.62);
            ctx.textAlign = 'left';
            ctx.fillText(`${inst.code} · ${Math.round(inst.depthM).toLocaleString('en-US')} m`, nx + 8, y);
          }
        }

        if (focused && !narrow) {
          ctx.fillStyle = rgba(color.foam, 0.9);
          ctx.textAlign = 'center';
          ctx.font = `600 11px ${frame.font.mono}`;
          ctx.fillText(frame.t(mooring.label), px + drift, yTop - 14);
          ctx.font = `500 10px ${frame.font.mono}`;
        }
      }
      ctx.restore();
    },
  };
}
