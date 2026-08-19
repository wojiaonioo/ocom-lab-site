/**
 * 图面注记：三层环流标签 + 地貌单元名称。
 *
 * secret：注记的排布规则与出现时机。
 *
 * 方案 §04 要求「所有科研图形显示单位、变量或数据来源」。
 * 没有这一层，画面就只是"蓝色渐变加动点"——注记才是把它变成科研图的部分。
 *
 * 出现时机是刻意设计的：地貌注记在 progress > 0.12 后才淡入，
 * 让首屏第一眼保持干净（方案 §06「首屏稳定」），开始下潜后再交付信息。
 */

import { LAYERS } from '../../science/flow-field.js';
import { FEATURES, depthAt } from '../../science/bathymetry.js';
import { formatSpeed, speedDirection } from '../../science/format.js';
import { clamp01, smoothstep } from '../../science/math.js';
import { rgba } from '../palette.js';

/** 令牌映射与 particles.js 保持一致，让标签色 = 粒子色。 */
const TONE = { upper: 'observation', intermediate: 'current', hadal: 'sediment' };

export function createAnnotations() {
  return {
    id: 'annotations',

    draw(frame) {
      const { ctx, w, h, color, narrow, depthWindow } = frame;
      ctx.save();

      // ── 三层环流标签（窄屏隐藏：与正文抢空间且必然重叠）
      if (!narrow) {
        const rightEdge = w - 92;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (const layer of LAYERS) {
          const y = frame.sy(layer.center);
          if (y < 96 || y > h - 30) continue;
          const tone = color[TONE[layer.id]] || color.current;

          // 指示线：把标签和它描述的水层绑在一起，避免"这行字说的是哪一层"的歧义
          ctx.strokeStyle = rgba(tone, 0.4);
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(rightEdge + 6, y);
          ctx.lineTo(rightEdge + 26, y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = `600 12px ${frame.font.sans}`;
          ctx.fillStyle = rgba(tone, 0.95);
          ctx.fillText(`${frame.t(layer.label)} · ${frame.t(layer.direction)}`, rightEdge, y - 8);

          ctx.font = `500 11px ${frame.font.mono}`;
          ctx.fillStyle = rgba(color.foam, 0.55);
          ctx.fillText(
            `${formatSpeed(layer.uCore)} · ${speedDirection(layer.uCore, 'en')} · ${layer.center.toLocaleString('en-US')} m`,
            rightEdge,
            y + 9,
          );
        }
      }

      // ── 地貌单元注记
      const reveal = smoothstep(0.12, 0.42, frame.progress);
      if (reveal > 0.01) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = `500 10px ${frame.font.mono}`;
        const visible = narrow ? FEATURES.filter((f) => f.id === 'axis') : FEATURES;

        for (const feature of visible) {
          const px = frame.sx(feature.x);
          if (px < 40 || px > w - 110) continue;
          const py = frame.sy(depthAt(feature.x));
          if (py < 40 || py > h + 20) continue;

          const alpha = clamp01(reveal);
          ctx.strokeStyle = rgba(color.sediment, 0.35 * alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py - 6);
          ctx.lineTo(px, py - 20);
          ctx.stroke();

          ctx.fillStyle = rgba(color.sediment, 0.85 * alpha);
          ctx.fillText(frame.t(feature.label), px, py - 25);
        }
      }

      // ── 视窗深度范围读数（下潜时才有意义）
      if (frame.progress > 0.05) {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = `500 10px ${frame.font.mono}`;
        ctx.fillStyle = rgba(color.current, 0.55 + 0.35 * frame.progress);
        const from = Math.round(depthWindow.top).toLocaleString('en-US');
        const to = Math.round(depthWindow.bottom).toLocaleString('en-US');
        ctx.fillText(`${from} – ${to} m`, 4, narrow ? 82 : 98);
      }

      ctx.restore();
    },
  };
}
