/**
 * 三层环流读数表（首屏深渊面板）。
 *
 * secret：从 LAYERS 取哪些量、怎么排版。
 *
 * 为什么放在 figures/ 而不是 ui/：它渲染的是**科学数据**（层核心深度与流速），
 * 需要 import science/flow-field。凡是把 science 的量搬到屏幕上的，都归 figures。
 * ui/ 只负责摆放与交互（ADR-007 的边界说明）。
 */

import { el, replace } from '../core/dom.js';
import { LAYERS } from '../science/flow-field.js';
import { velocityProfile } from '../science/profile.js';
import { formatDepth, formatSpeed } from '../science/format.js';
import { t } from '../i18n/locale.js';

export function renderLayerReadout(host) {
  const profile = velocityProfile();

  replace(host, [
    ...LAYERS.map((layer) =>
      el('li', {}, [
        el('span', { text: `${t(layer.label)} · ${t(layer.direction)}` }),
        el('b', { text: `${formatSpeed(layer.uCore)} @ ${formatDepth(layer.center)}` }),
      ]),
    ),
    el('li', {}, [
      el('span', { text: t({ zh: '流向反转深度', en: 'Reversal depths' }) }),
      el('b', { text: profile.crossings.map((d) => formatDepth(d)).join(' / ') }),
    ]),
    el('li', {}, [
      el('span', { text: t({ zh: '轴部水深', en: 'Axis depth' }) }),
      el('b', { text: formatDepth(profile.floorM) }),
    ]),
  ]);
}
