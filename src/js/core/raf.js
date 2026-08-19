/**
 * 全站唯一渲染循环。
 *
 * secret：帧调度、页面不可见时的暂停、帧率测量与降级时机。
 * 外界只有 subscribe(fn) → unsubscribe。
 *
 * 为什么只有一个循环：多个模块各起一个 rAF，在低端机上互相抢帧且无法统一降级。
 * 这里集中测帧率，达到阈值时广播 QUALITY_CHANGE，各场景自行减配。
 */

import { EVENT, emit } from './bus.js';
import { initialQuality } from './env.js';

const subscribers = new Set();

let running = false;
let rafId = 0;
let lastTime = 0;

/** 质量档只降不升，避免在阈值附近来回抖动（skill: downgrade once and keep stable）。 */
const LADDER = ['high', 'medium', 'low'];
let qualityIndex = 0;

/** 帧率采样窗口 */
const SAMPLE_SIZE = 90;
let frameCount = 0;
let elapsed = 0;
let measuredFps = 60;

function step(now) {
  if (!running) return;
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
  lastTime = now;

  frameCount += 1;
  elapsed += dt;
  if (frameCount >= SAMPLE_SIZE) {
    measuredFps = frameCount / elapsed;
    frameCount = 0;
    elapsed = 0;
    considerDowngrade();
  }

  for (const fn of [...subscribers]) {
    try {
      fn(dt, now);
    } catch (err) {
      console.error('[raf] 订阅者异常，已移除：', err);
      subscribers.delete(fn);
    }
  }

  rafId = requestAnimationFrame(step);
}

function considerDowngrade() {
  const target = qualityIndex === 0 ? 45 : 26;
  if (measuredFps >= target || qualityIndex >= LADDER.length - 1) return;
  qualityIndex += 1;
  console.info(`[raf] 实测 ${measuredFps.toFixed(1)} fps，降级至 ${LADDER[qualityIndex]}`);
  emit(EVENT.QUALITY_CHANGE, LADDER[qualityIndex]);
}

function start() {
  if (running || !subscribers.size) return;
  running = true;
  lastTime = 0;
  frameCount = 0;
  elapsed = 0;
  rafId = requestAnimationFrame(step);
}

function stop() {
  running = false;
  cancelAnimationFrame(rafId);
}

/**
 * 加入渲染循环。
 * @param {(dt:number, now:number) => void} fn dt 单位为秒，已裁剪上限防止切标签页后跳变
 * @returns {() => void} 退出循环
 */
export function subscribe(fn) {
  subscribers.add(fn);
  start();
  return () => {
    subscribers.delete(fn);
    if (!subscribers.size) stop();
  };
}

/** 当前质量档。 */
export function quality() {
  return LADDER[qualityIndex];
}

/** 最近一次实测帧率，供验证记录使用。 */
export function fps() {
  return measuredFps;
}

/** 由 main.js 在启动时调用一次：设定初始档并接管页面可见性。 */
export function initScheduler() {
  qualityIndex = Math.max(0, LADDER.indexOf(initialQuality()));
  emit(EVENT.QUALITY_CHANGE, LADDER[qualityIndex]);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
}
