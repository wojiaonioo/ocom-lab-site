/**
 * 静态文案的双语接管。
 *
 * secret：HTML 骨架与内容模型之间的绑定方式。
 *
 * 机制只有一条：扫描 `[data-copy="key"]`，用 content/site.js 的 COPY[key] 覆写。
 * 没有模板引擎、没有插值语法（ADR-003 不做通用渲染层）。
 *
 * HTML 里预置的中文是**无脚本时的可读内容**；本模块在脚本可用时接管，
 * 使语言切换覆盖整页而不是只覆盖数据驱动的部分（方案原则 05 双语同构）。
 */

import { EVENT, on } from '../core/bus.js';
import { qsa } from '../core/dom.js';
import { t } from '../i18n/locale.js';
import { COPY } from '../content/site.js';

export function initCopy(root = document) {
  const nodes = qsa('[data-copy]', root);
  const missing = nodes.map((n) => n.dataset.copy).filter((key) => !COPY[key]);
  if (missing.length) console.warn('[copy] 缺少文案键：', [...new Set(missing)]);

  const render = () => {
    for (const node of nodes) {
      const entry = COPY[node.dataset.copy];
      if (!entry) continue;
      // aria-label 与可见文本走同一份数据，避免二者语言不一致
      if (node.hasAttribute('data-copy-attr')) node.setAttribute(node.dataset.copyAttr, t(entry));
      else node.textContent = t(entry);
    }
  };

  return on(EVENT.LOCALE_CHANGE, render, { replay: true });
}
