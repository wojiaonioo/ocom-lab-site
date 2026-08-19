/**
 * 三层环流速度场 + 内潮波束模态。
 *
 * secret：速度场怎么合成。外界只拿 velocityAt(x, z) → { u, w }，单位 m/s。
 *
 * 两种模态对应首屏的"发现标签"（ADR-004，用户点击切换，不自动轮播）：
 *   circulation —— 深渊三层环流：上层东向、中层西向、深渊层东向
 *   tides       —— 叠加内潮波束：自海沟斜坡临界点沿特征线向上传播
 *
 * ⚠ 示意性理想化场，用于界面图形语言。层结构与量级参照公开描述，
 *   具体数值为合成，不可作为科学结论引用。见 docs/SCIENCE-NOTES.md。
 */

import { gauss, smoothstep, clamp01 } from './math.js';
import { depthAt, slopeAt, TRANSECT } from './bathymetry.js';

/**
 * 三个环流层。center/sigma 为高斯权重的中心深度与特征半宽（m），
 * uCore 为该层核心处的纬向流速（m/s，东向为正）。
 */
export const LAYERS = [
  {
    id: 'upper',
    center: 350,
    sigma: 1150,
    uCore: 0.135,
    tone: 'observation',
    label: { zh: '上层环流', en: 'Upper layer' },
    direction: { zh: '东向', en: 'eastward' },
  },
  {
    id: 'intermediate',
    center: 3400,
    sigma: 2000,
    uCore: -0.085,
    tone: 'current',
    label: { zh: '中层环流', en: 'Intermediate layer' },
    direction: { zh: '西向', en: 'westward' },
  },
  {
    id: 'hadal',
    center: 8600,
    sigma: 2100,
    uCore: 0.052,
    tone: 'sediment',
    label: { zh: '深渊层环流', en: 'Hadal layer' },
    direction: { zh: '东向', en: 'eastward' },
  },
];

/** 底边界层厚度：贴底摩擦使流速线性衰减至零。 */
const BOTTOM_LAYER_M = 220;

/** M2 分潮周期（s）。内潮波束的振荡周期。 */
export const M2_PERIOD_S = 12.4206 * 3600;

/** 内潮波束：自海沟两侧斜坡的临界点出发，沿特征线上传。 */
const BEAM = {
  amplitude: 0.062, // m/s
  slope: 0.108, // 特征线斜率 dz/dx（无量纲）
  halfWidth: 900, // 波束半宽，m
  decayX: 0.34, // 沿程衰减尺度（归一化 x）
  sources: [
    { x0: 0.398, z0: 7300, dir: -1 },
    { x0: 0.602, z0: 7300, dir: +1 },
  ],
};

/** 归一化横坐标 → 米。粒子平流与坡度换算都要用。 */
export const X_TO_M = TRANSECT.lengthKm * 1000;

/**
 * 某深度上各层的高斯权重。导出供剖面图与图例复用，避免两处各算一遍。
 *
 * **刻意不归一化。** 归一化会让"远离所有层核心"的深度被强行提升到某一层的核心流速
 * ——实测中该处应当是弱流。不归一化时权重自然衰减，剖面在近底与近表都趋弱，
 * 极值也落在各层核心深度上（已由 Node 数值校验确认，见 docs/SCIENCE-NOTES.md）。
 *
 * @param {number} z 深度，m
 * @returns {number[]} 与 LAYERS 等长，各自 ∈ (0,1]
 */
export function layerWeights(z) {
  return LAYERS.map((layer) => gauss(z, layer.center, layer.sigma));
}

/** 主导层 id，用于给粒子上色。 */
export function dominantLayer(z) {
  const w = layerWeights(z);
  let best = 0;
  for (let i = 1; i < w.length; i += 1) if (w[i] > w[best]) best = i;
  return LAYERS[best].id;
}

/** 背景三层环流的纬向流速（未叠加内潮）。 */
function baseU(x, z, time) {
  const w = layerWeights(z);
  let u = 0;
  for (let i = 0; i < LAYERS.length; i += 1) {
    // 沿断面的缓慢起伏：表达流核的横向摆动，不是装饰噪声
    const undulation = 1 + 0.22 * Math.sin(x * 14 + i * 1.9 + time * (2 * Math.PI) / (18 * 86400));
    u += LAYERS[i].uCore * w[i] * undulation;
  }
  return u;
}

/** 内潮波束贡献。速度沿特征线方向振荡（内波的质点运动平行于波束）。 */
function beamVelocity(x, z, time) {
  const omega = (2 * Math.PI) / M2_PERIOD_S;
  const theta = Math.atan(BEAM.slope);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  let u = 0;
  let w = 0;

  for (const src of BEAM.sources) {
    const dx = src.dir * (x - src.x0);
    if (dx <= 0) continue;
    const zBeam = src.z0 - dx * BEAM.slope * X_TO_M;
    if (zBeam < 0) continue;
    const env = gauss(z, zBeam, BEAM.halfWidth) * Math.exp(-dx / BEAM.decayX);
    if (env < 1e-3) continue;
    const phase = omega * time - dx * 26;
    const amp = BEAM.amplitude * env * Math.cos(phase);
    u += amp * cosT * src.dir;
    w -= amp * sinT;
  }
  return { u, w };
}

/**
 * 速度场。
 * @param {number} x 归一化横坐标 [0,1]
 * @param {number} z 深度 m，向下为正
 * @param {{time?:number, mode?:'circulation'|'tides'}} [opts] time 单位为**海洋时间秒**
 * @returns {{u:number, w:number}} m/s，u 东向为正，w 向下为正
 */
export function velocityAt(x, z, opts = {}) {
  const { time = 0, mode = 'circulation' } = opts;
  const floor = depthAt(x);
  if (z >= floor || z < 0) return { u: 0, w: 0 };

  let u = baseU(x, z, time);

  // 底边界层
  const heightAboveBottom = floor - z;
  u *= clamp01(heightAboveBottom / BOTTOM_LAYER_M);

  // 断面两端收敛到零，避免粒子在边界堆成直线
  u *= smoothstep(0, 0.06, x) * smoothstep(0, 0.06, 1 - x);

  // 地形跟随：贴底流随海底起伏，离底后迅速减弱
  const slope = slopeAt(x) / X_TO_M;
  let w = u * slope * Math.exp(-heightAboveBottom / 900);

  if (mode === 'tides') {
    const beam = beamVelocity(x, z, time);
    u += beam.u;
    w += beam.w;
  }

  return { u, w };
}

/** 波束几何，供 scenes/layers/tidal-beams.js 画出特征线本身（而不是自己再推一遍）。 */
export function beamGeometry() {
  return BEAM.sources.map((src) => {
    const span = Math.min(0.42, src.z0 / (BEAM.slope * X_TO_M));
    return {
      from: { x: src.x0, z: src.z0 },
      to: { x: src.x0 + src.dir * span, z: src.z0 - span * BEAM.slope * X_TO_M },
      halfWidth: BEAM.halfWidth,
    };
  });
}
