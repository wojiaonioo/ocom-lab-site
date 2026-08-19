/**
 * 四大研究方向卡片 + 科研流程轴。
 *
 * secret：卡片与流程步的 DOM 结构。
 *
 * 方案 §04 卡片规范：圆角 4–8px、弱阴影、细描边、高留白，
 * 「避免消费互联网卡片感」「不做卡片套卡片」。因此卡片内不再嵌套卡片，
 * 关联条目用行内标签列出。
 *
 * 方案 §06.2：Observe → Data → Model → Explain → Outputs 是**整站内容关联的主轴**，
 * 每一步都要回答一个问题，所以流程轴渲染的是"问题"而不是"名词"。
 */

import { EVENT, on } from '../core/bus.js';
import { el, qs, replace } from '../core/dom.js';
import { t, tList } from '../i18n/locale.js';
import { RESEARCH } from '../content/research.js';
import { WORKFLOW, IDENTITY } from '../content/site.js';
import { related } from '../content/index.js';
import { visualAbstract } from '../figures/visual-abstract.js';

/** 研究方向的视觉母题 → 视觉摘要图型（方案 §04 固定母题）。 */
const MOTIF_FIGURE = {
  'trench-section': 'section',
  'tidal-beam': 'beam',
  'eddy-field': 'timeseries',
  'mooring-chain': 'mooring',
};

export function initResearch(root = document) {
  const cardHost = qs('#research-cards', root);
  const flowHost = qs('#workflow-rail', root);
  const identityHost = qs('#identity-band', root);
  const cleanups = [];

  function render() {
    if (identityHost) {
      replace(identityHost, IDENTITY.map((item) =>
        el('div', { class: 'identity-item' }, [
          el('p', { class: 'identity-value mono', text: item.value }),
          el('p', { class: 'identity-label', text: t(item.label) }),
        ]),
      ));
    }

    if (cardHost) {
      replace(cardHost, RESEARCH.map((topic) => {
        const links = related('research', topic.id);
        const counts = [
          [links.publication?.length, { zh: '论文', en: 'papers' }],
          [links.expedition?.length, { zh: '航次', en: 'cruises' }],
          [links.dataset?.length, { zh: '数据集', en: 'datasets' }],
        ].filter(([n]) => n);

        return el('article', { class: 'card research-card' }, [
          el('div', { class: 'research-card-figure' }, [visualAbstract(MOTIF_FIGURE[topic.motif] || 'section')]),
          el('p', { class: 'eyebrow mono', text: String(topic.order).padStart(2, '0') }),
          el('h3', { class: 'card-title', text: t(topic.title) }),
          el('p', { class: 'card-summary', text: t(topic.summary) }),
          el('p', { class: 'card-question', text: t(topic.question) }),
          el('ul', { class: 'tag-row' },
            tList(topic.methods).slice(0, 3).map((m) => el('li', { class: 'tag', text: m })),
          ),
          counts.length
            ? el('p', { class: 'card-meta mono', text: counts.map(([n, label]) => `${n} ${t(label)}`).join(' · ') })
            : null,
        ]);
      }));
    }

    if (flowHost) {
      replace(flowHost, WORKFLOW.map((step, i) =>
        el('li', { class: 'flow-step' }, [
          el('span', { class: 'flow-index mono', text: String(i + 1).padStart(2, '0') }),
          el('span', { class: 'flow-connector', 'aria-hidden': 'true' }),
          el('p', { class: 'flow-name mono', text: step.step }),
          el('h3', { class: 'flow-title', text: t(step.title) }),
          el('p', { class: 'flow-ask', text: t(step.ask) }),
          el('p', { class: 'flow-body', text: t(step.body) }),
        ]),
      ));
    }
  }

  cleanups.push(on(EVENT.LOCALE_CHANGE, render, { replay: true }));
  return () => cleanups.splice(0).forEach((fn) => fn());
}
