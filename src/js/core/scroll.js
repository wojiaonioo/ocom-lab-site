/**
 * 滚动观测。
 *
 * secret：用 scroll 事件还是 IntersectionObserver、如何节流、进度怎么归一化。
 * 外界只订阅 STAGE_PROGRESS 与 SECTION_ACTIVE 两个事件。
 *
 * 对应 ADR-004（滚动下潜）与方案 §06 首页叙事路径。
 */

import { EVENT, emit } from './bus.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * 跟踪 sticky 舞台的滚动进度并广播 STAGE_PROGRESS。
 *
 * 进度定义：舞台顶部与视口顶部齐平时为 0；
 * 舞台底部与视口底部齐平（即 sticky 结束）时为 1。
 *
 * @param {HTMLElement} stage 高度大于一屏的舞台容器
 * @returns {() => void} 停止跟踪
 */
export function trackStageProgress(stage) {
  if (!stage) return () => {};
  let ticking = false;

  const measure = () => {
    ticking = false;
    const rect = stage.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) {
      emit(EVENT.STAGE_PROGRESS, 0);
      return;
    }
    emit(EVENT.STAGE_PROGRESS, clamp01(-rect.top / travel));
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  measure();

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

/**
 * 跟踪当前版块并广播 SECTION_ACTIVE。
 *
 * 判定线取视口高度的 35% 处：元素越过该线即视为"当前"。
 * 用固定判定线而非 "最大可见面积"，是为了让导航配色的切换点稳定可预期
 * —— 方案 §06.1 要求首屏透明、滚动后转雾白，切换必须干脆。
 *
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} sections 需带 id 与 data-theme
 */
export function trackSections(sections) {
  const list = [...sections].filter((s) => s.id);
  if (!list.length) return () => {};

  let ticking = false;
  let currentId = null;

  const measure = () => {
    ticking = false;
    const line = window.innerHeight * 0.35;
    let active = list[0];
    for (const section of list) {
      if (section.getBoundingClientRect().top <= line) active = section;
    }
    if (active.id === currentId) return;
    currentId = active.id;
    emit(EVENT.SECTION_ACTIVE, { id: active.id, theme: active.dataset.theme || 'light' });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  measure();

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

/**
 * 元素进入视口时加 class（一次性）。
 * 用于方案 §08 的"等深线逐层绘制 / 剖面展开"——进入视口触发，且不重复播放。
 * reduced-motion 下由调用方直接加 class 跳过动画。
 */
export function revealOnEnter(elements, className = 'is-revealed', threshold = 0.18) {
  const list = [...elements];
  if (!('IntersectionObserver' in window)) {
    list.forEach((n) => n.classList.add(className));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(className);
        io.unobserve(entry.target);
      }
    },
    { threshold, rootMargin: '0px 0px -8% 0px' },
  );
  list.forEach((n) => io.observe(n));
  return () => io.disconnect();
}
