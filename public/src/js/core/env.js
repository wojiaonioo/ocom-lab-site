/**
 * 运行环境能力探测。
 *
 * secret：用什么 API 判断能力、初始质量档怎么估。
 * 外界只问"现在能不能动画""该画多密""像素比取多少"。
 *
 * 对应方案 v1.0 §09（响应式与无障碍）与 skill 的 Quality Management。
 */

import { EVENT, emit } from './bus.js';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** 用户是否要求减少动态效果。方案 §09 无障碍基线要求必须支持。 */
export function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia(MOTION_QUERY).matches;
}

/** 触摸设备：用于关闭指针跟随、降低粒子数。 */
export function isTouch() {
  return typeof matchMedia === 'function' && matchMedia('(hover: none), (pointer: coarse)').matches;
}

/** 视口尺寸。用 innerWidth 而非 screen，随窗口变化。 */
export function viewport() {
  return { w: window.innerWidth, h: window.innerHeight };
}

/** 是否为窄屏布局（方案 §09：手机 < 768px 单列、关闭复杂动画）。 */
export function isNarrow() {
  return window.innerWidth < 768;
}

/**
 * 设备像素比，带上限。
 * 高 DPR 手机按 1 倍画粒子和 3 倍画粒子肉眼几乎无差别，但填充率差 9 倍。
 */
export function pixelRatio(max = 2) {
  return Math.min(window.devicePixelRatio || 1, max);
}

/** Canvas 2D 可用性。不可用则整站走静态降级层。 */
export function supportsCanvas2D() {
  try {
    return !!document.createElement('canvas').getContext('2d');
  } catch {
    return false;
  }
}

/**
 * 初始质量档。只做一次粗估，真正的降级由 core/raf.js 按实测帧率触发
 * —— skill 的规则是"若帧率持续低于目标，降一档并保持稳定"，不反复横跳。
 * @returns {'high'|'medium'|'low'}
 */
export function initialQuality() {
  if (prefersReducedMotion()) return 'low';
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const px = window.innerWidth * window.innerHeight * pixelRatio();
  if (cores <= 4 || mem <= 2 || isNarrow()) return 'medium';
  if (px > 4.5e6) return 'medium';
  return 'high';
}

/** 监听 reduced-motion 变化并广播。返回取消函数。 */
export function watchMotion() {
  if (typeof matchMedia !== 'function') return () => {};
  const mq = matchMedia(MOTION_QUERY);
  const push = () => emit(EVENT.MOTION_CHANGE, mq.matches);
  push();
  mq.addEventListener('change', push);
  return () => mq.removeEventListener('change', push);
}

/**
 * 窗口尺寸变化（去抖）。
 * @param {(vp:{w:number,h:number}) => void} handler
 */
export function onResize(handler, wait = 150) {
  let timer = 0;
  const run = () => {
    clearTimeout(timer);
    timer = setTimeout(() => handler(viewport()), wait);
  };
  window.addEventListener('resize', run, { passive: true });
  window.addEventListener('orientationchange', run, { passive: true });
  return () => {
    clearTimeout(timer);
    window.removeEventListener('resize', run);
    window.removeEventListener('orientationchange', run);
  };
}
