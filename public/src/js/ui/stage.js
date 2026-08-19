/**
 * 首屏文字层对滚动进度的响应。
 *
 * secret：进度如何传给 CSS、面板何时对辅助技术隐藏。
 *
 * 只写一个自定义属性 `--stage-progress`，显隐曲线全部交给 CSS
 * （见 styles/sections/stage.css）。这样"什么时候淡出、淡多少"是设计可调的，
 * 不用改 JS —— 变化速率不同的东西分开放（Shearing Layers）。
 *
 * 同时把不可见的面板标为 aria-hidden，避免屏幕阅读器读到两份重叠的首屏文案。
 */

import { EVENT, on } from '../core/bus.js';
import { qs, qsa } from '../core/dom.js';
import { renderLayerReadout } from '../figures/layer-readout.js';

/** 与 stage.css 中的显隐区间保持一致。改这里必须同步改 CSS。 */
const VISIBLE_RANGE = {
  hero: [0, 0.38],
  hadal: [0.46, 1],
};

export function initStage(root = document) {
  const stage = qs('#stage', root);
  const readoutHost = qs('#hadal-readout', root);
  if (!stage) return () => {};

  const panels = qsa('.stage-panel', stage);
  const cleanups = [];

  cleanups.push(
    on(EVENT.STAGE_PROGRESS, (p) => {
      stage.style.setProperty('--stage-progress', p.toFixed(3));
      for (const panel of panels) {
        const range = VISIBLE_RANGE[panel.dataset.panel];
        if (!range) continue;
        const visible = p >= range[0] && p <= range[1];
        panel.setAttribute('aria-hidden', String(!visible));
        // 隐藏的面板不应该被 Tab 命中
        for (const focusable of panel.querySelectorAll('a, button')) {
          focusable.tabIndex = visible ? 0 : -1;
        }
      }
    }, { replay: true }),
  );

  if (readoutHost) {
    cleanups.push(on(EVENT.LOCALE_CHANGE, () => renderLayerReadout(readoutHost), { replay: true }));
  }

  return () => cleanups.splice(0).forEach((fn) => fn());
}
