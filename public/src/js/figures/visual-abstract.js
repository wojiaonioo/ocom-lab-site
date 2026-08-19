/**
 * 论文视觉摘要缩略图（程序生成 SVG）。
 *
 * secret：每种图型的画法。
 *
 * 方案 §01 指出参考站的问题是「论文题录列表难以理解科学问题和方法」，
 * 要求「增加视觉摘要」。真实视觉摘要应由科研人员提供（方案 §11 素材清单：
 * 3 张代表性成果视觉摘要，含结论、变量、单位和来源）。
 *
 * 在素材到位前，这里按论文声明的 abstractFigure 类型生成**结构性缩略图**，
 * 用与首屏一致的图形母题（剖面 / 时间序列 / 波束 / 潜标 / 断面），
 * 让列表可扫读而不是一堆灰块。它是占位物，不冒充数据图 —— 不带任何坐标数值。
 */

import { svg } from '../core/dom.js';

const W = 132;
const H = 78;

const DRAW = {
  /** 垂向剖面：一条随深度反转的曲线 */
  profile() {
    const pts = [];
    for (let i = 0; i <= 24; i += 1) {
      const z = i / 24;
      const u = 0.55 * Math.cos(z * Math.PI * 1.6) * (1 - 0.45 * z);
      pts.push(`${W * 0.5 + u * W * 0.3},${8 + z * (H - 16)}`);
    }
    return [
      svg('line', { x1: W * 0.5, y1: 8, x2: W * 0.5, y2: H - 8, class: 'va-axis' }),
      svg('polyline', { points: pts.join(' '), class: 'va-line' }),
    ];
  },

  /** 时间序列：带包络的振荡 */
  timeseries() {
    const pts = [];
    const env = [];
    for (let i = 0; i <= 60; i += 1) {
      const x = 8 + (i / 60) * (W - 16);
      const e = 0.5 + 0.45 * Math.sin((i / 60) * Math.PI);
      pts.push(`${x},${H / 2 + Math.sin(i * 0.62) * 22 * e}`);
      env.push(`${x},${H / 2 - 22 * e}`);
    }
    const envBack = env.slice().reverse().map((p) => {
      const [x, y] = p.split(',');
      return `${x},${H - Number(y)}`;
    });
    return [
      svg('polygon', { points: [...env, ...envBack].join(' '), class: 'va-band' }),
      svg('line', { x1: 8, y1: H / 2, x2: W - 8, y2: H / 2, class: 'va-axis' }),
      svg('polyline', { points: pts.join(' '), class: 'va-line' }),
    ];
  },

  /** 内潮波束：自 V 形斜坡射出的两条特征线 */
  beam() {
    return [
      svg('path', { d: `M8 ${H - 10} L${W * 0.5} ${H - 26} L${W - 8} ${H - 10}`, class: 'va-terrain' }),
      svg('line', { x1: W * 0.38, y1: H - 22, x2: 12, y2: 12, class: 'va-ray' }),
      svg('line', { x1: W * 0.62, y1: H - 22, x2: W - 12, y2: 12, class: 'va-ray' }),
      svg('circle', { cx: W * 0.38, cy: H - 22, r: 2.6, class: 'va-dot' }),
      svg('circle', { cx: W * 0.62, cy: H - 22, r: 2.6, class: 'va-dot' }),
    ];
  },

  /** 潜标链：一条带节点的垂线 */
  mooring() {
    const x = W * 0.5;
    const nodes = [0.22, 0.42, 0.6, 0.78].map((f) =>
      svg('rect', { x: x - 3, y: 10 + f * (H - 26), width: 6, height: 6, class: 'va-node' }),
    );
    return [
      svg('line', { x1: x, y1: 12, x2: x, y2: H - 12, class: 'va-line' }),
      svg('circle', { cx: x, cy: 11, r: 3, class: 'va-dot' }),
      svg('rect', { x: x - 7, y: H - 14, width: 14, height: 4, class: 'va-anchor' }),
      ...nodes,
    ];
  },

  /** 断面：分层水体 + 海沟缺口 */
  section() {
    const bands = [0.18, 0.4, 0.62].map((f, i) =>
      svg('rect', { x: 6, y: 8 + f * (H - 20), width: W - 12, height: 7, class: 'va-band', opacity: String(0.5 - i * 0.12) }),
    );
    return [
      ...bands,
      svg('path', { d: `M6 ${H - 12} L${W * 0.34} ${H - 16} L${W * 0.5} ${H - 4} L${W * 0.66} ${H - 18} L${W - 6} ${H - 24}`, class: 'va-terrain' }),
    ];
  },
};

/**
 * @param {string} kind publications.js 的 abstractFigure 字段
 * @returns {SVGElement}
 */
export function visualAbstract(kind) {
  const draw = DRAW[kind] || DRAW.section;
  return svg(
    'svg',
    { class: `visual-abstract va-${kind}`, viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', focusable: 'false' },
    draw(),
  );
}

/** 成员卡的字母标记。ADR-005：不使用任何人像。 */
export function monogram(initials) {
  return svg('svg', { class: 'monogram', viewBox: '0 0 64 64', 'aria-hidden': 'true', focusable: 'false' }, [
    svg('rect', { x: 0, y: 0, width: 64, height: 64, rx: 6, class: 'mono-bg' }),
    svg('path', { d: 'M0 44 Q16 36 32 44 T64 44', class: 'mono-wave' }),
    svg('text', { x: 32, y: 30, 'text-anchor': 'middle', class: 'mono-text' }, [initials]),
  ]);
}
