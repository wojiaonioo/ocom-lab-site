/**
 * 通用数值工具。纯函数，无副作用，无随机源。
 *
 * secret：无 —— 这里刻意保持透明，是其他 science 模块的公共词汇。
 * 之所以不放 core/：core/ 允许碰 DOM，而 science/ 必须能在 Node 下裸跑，
 * 依赖方向只能 science → science（见 docs/ARCHITECTURE.md §1）。
 */

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export const clamp01 = (v) => clamp(v, 0, 1);

export const lerp = (a, b, t) => a + (b - a) * t;

/** 归一化到 [0,1] 并裁剪。edge0 === edge1 时返回 0。 */
export const norm = (v, edge0, edge1) => (edge1 === edge0 ? 0 : clamp01((v - edge0) / (edge1 - edge0)));

/** Hermite 平滑阶跃，用于地形与图层过渡，避免硬折角。 */
export function smoothstep(edge0, edge1, v) {
  const t = norm(v, edge0, edge1);
  return t * t * (3 - 2 * t);
}

/** 高斯核，center 处为 1。sigma 为特征半宽。 */
export const gauss = (v, center, sigma) => Math.exp(-(((v - center) / sigma) ** 2));

/**
 * mulberry32 —— 确定性伪随机。
 * science/ 禁止 Math.random()：粒子初始分布必须可复现，否则截图无法逐帧比对。
 * @param {number} seed
 * @returns {() => number} 每次调用返回 [0,1)
 */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 在 [lo,hi) 内取模回绕，粒子出界后重入用。 */
export function wrap(v, lo, hi) {
  const span = hi - lo;
  return lo + (((v - lo) % span) + span) % span;
}
