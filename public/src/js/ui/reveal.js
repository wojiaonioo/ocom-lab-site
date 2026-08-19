/**
 * 进入视口时的渐显。
 *
 * secret：观察阈值与 reduced-motion 下的短路方式。
 *
 * 方案 §08 禁止项：「所有元素同时淡入」。因此这里按元素**逐个**触发，
 * 并给同组元素一个很小的序列延迟（由 CSS 的 --reveal-index 消费），
 * 而不是整屏一起亮。
 *
 * reduced-motion 下不观察、直接置为已显示 —— 关掉动效不等于关掉内容。
 */

import { EVENT, on } from '../core/bus.js';
import { qsa } from '../core/dom.js';
import { revealOnEnter } from '../core/scroll.js';

export function initReveal(root = document) {
  const targets = qsa('[data-reveal]', root);
  let disconnect = null;

  const apply = (reduced) => {
    disconnect?.();
    disconnect = null;

    if (reduced) {
      targets.forEach((node) => node.classList.add('is-revealed'));
      return;
    }
    // 同一父容器内的序号，供 CSS 做阶梯延迟
    const seen = new Map();
    for (const node of targets) {
      const key = node.parentElement;
      const index = seen.get(key) || 0;
      node.style.setProperty('--reveal-index', String(index));
      seen.set(key, index + 1);
    }
    disconnect = revealOnEnter(targets);
  };

  const off = on(EVENT.MOTION_CHANGE, apply, { replay: true });

  return () => {
    off();
    disconnect?.();
  };
}
