/**
 * 垂向流速剖面：把 flow-field 的二维场压成一条可读的 u(z) 曲线。
 *
 * secret：采样密度、离散度怎么估、零交叉怎么定位。
 * 外界拿到的是一个可直接绘制、可直接读数的剖面对象。
 *
 * 对应方案 §06.1 模块 05「代表性发现」的左侧交互剖面。
 */

import { velocityAt, LAYERS } from './flow-field.js';
import { depthAt, TRANSECT } from './bathymetry.js';
import { lerp } from './math.js';

/**
 * 观测离散度（示意）。真实剖面的标准差随流速增大而增大，
 * 底层因样本少而抬升。用于画阴影带 —— 方案 §04 要求图形能读出不确定性。
 */
const spreadAt = (u, z, floor) => 0.013 + 0.19 * Math.abs(u) + 0.02 * Math.exp(-(floor - z) / 400);

/**
 * 生成剖面。
 * @param {object} [opts]
 * @param {number} [opts.x] 断面横坐标，默认海沟轴部
 * @param {number} [opts.samples] 采样点数
 * @param {'circulation'|'tides'} [opts.mode]
 * @returns {{
 *   x:number, floorM:number, samples:Array<{depth:number,u:number,sigma:number}>,
 *   crossings:number[], layers:Array<object>, uRange:{min:number,max:number}
 * }}
 */
export function velocityProfile(opts = {}) {
  const { x = TRANSECT.axisX, samples: n = 160, mode = 'circulation' } = opts;
  const floorM = depthAt(x);
  const samples = new Array(n);

  let min = 0;
  let max = 0;
  for (let i = 0; i < n; i += 1) {
    const depth = (i / (n - 1)) * floorM;
    const { u } = velocityAt(x, Math.min(depth, floorM - 0.5), { mode, time: 0 });
    samples[i] = { depth, u, sigma: spreadAt(u, depth, floorM) };
    if (u < min) min = u;
    if (u > max) max = u;
  }

  return {
    x,
    floorM,
    samples,
    crossings: findZeroCrossings(samples),
    layers: describeLayers(samples, floorM),
    uRange: { min: min - 0.03, max: max + 0.03 },
  };
}

/** 流向反转深度（m）。这是"三层结构"最硬的证据点，图上必须标出来。 */
function findZeroCrossings(samples) {
  const out = [];
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1];
    const b = samples[i];
    if (a.u === 0 || (a.u < 0) === (b.u < 0)) continue;
    const t = Math.abs(a.u) / (Math.abs(a.u) + Math.abs(b.u));
    out.push(lerp(a.depth, b.depth, t));
  }
  return out;
}

/** 按零交叉切分实际层界，并给出各层的极值流速与所在深度。 */
function describeLayers(samples, floorM) {
  const crossings = findZeroCrossings(samples);
  const edges = [0, ...crossings, floorM];
  const out = [];

  for (let i = 0; i < edges.length - 1; i += 1) {
    const top = edges[i];
    const bottom = edges[i + 1];
    const within = samples.filter((s) => s.depth >= top && s.depth <= bottom);
    if (!within.length) continue;
    let peak = within[0];
    for (const s of within) if (Math.abs(s.u) > Math.abs(peak.u)) peak = s;
    out.push({
      meta: LAYERS[Math.min(i, LAYERS.length - 1)],
      topM: top,
      bottomM: bottom,
      peakU: peak.u,
      peakDepthM: peak.depth,
      eastward: peak.u > 0,
    });
  }
  return out;
}

/**
 * 按深度读数（线性插值），供剖面图的悬停十字线。
 * @returns {{depth:number, u:number, sigma:number}}
 */
export function readAt(profile, depthM) {
  const { samples } = profile;
  const clamped = Math.max(0, Math.min(depthM, profile.floorM));
  const span = profile.floorM / (samples.length - 1);
  const i = Math.min(samples.length - 2, Math.floor(clamped / span));
  const t = (clamped - samples[i].depth) / (samples[i + 1].depth - samples[i].depth || 1);
  return {
    depth: clamped,
    u: lerp(samples[i].u, samples[i + 1].u, t),
    sigma: lerp(samples[i].sigma, samples[i + 1].sigma, t),
  };
}
