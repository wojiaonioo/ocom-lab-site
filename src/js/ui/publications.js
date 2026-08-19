/**
 * 论文列表 + 三维筛选（年份 / 研究方向 / 海域）。
 *
 * secret：筛选状态、结果计数、空态。
 *
 * 方案 §05：「论文可按年份、研究方向、海域、作者和方法筛选」。
 * 方案 §01：论文不只列题录 —— 每条带一句话结论、视觉摘要、方向与海域标签。
 * ADR-005：DOI 一律显示"待补充"，绝不生成假 DOI。
 */

import { EVENT, on } from '../core/bus.js';
import { el, qs, replace, on as bind } from '../core/dom.js';
import { t } from '../i18n/locale.js';
import { UI } from '../i18n/strings.js';
import { PUBLICATIONS, PUB_YEARS } from '../content/publications.js';
import { RESEARCH } from '../content/research.js';
import { REGIONS } from '../content/expeditions.js';
import { visualAbstract } from '../figures/visual-abstract.js';

export function initPublications(root = document) {
  const filterHost = qs('#publication-filters', root);
  const listHost = qs('#publication-list', root);
  const countHost = qs('#publication-count', root);
  if (!listHost) return () => {};

  const cleanups = [];
  const filters = { year: null, topic: null, region: null };

  const GROUPS = () => [
    { key: 'topic', label: t(UI.filterTopic), options: RESEARCH.map((r) => ({ value: r.id, label: t(r.title) })) },
    { key: 'region', label: t(UI.filterRegion), options: REGIONS.map((r) => ({ value: r.id, label: t(r.label) })) },
    { key: 'year', label: t(UI.filterYear), options: PUB_YEARS.map((y) => ({ value: y, label: String(y) })) },
  ];

  function matches(pub) {
    if (filters.year && pub.year !== filters.year) return false;
    if (filters.topic && !pub.topics.includes(filters.topic)) return false;
    if (filters.region && !(pub.regions || []).includes(filters.region)) return false;
    return true;
  }

  function renderFilters() {
    if (!filterHost) return;
    replace(filterHost, GROUPS().map((group) =>
      el('div', { class: 'filter-group', role: 'group', 'aria-label': group.label }, [
        el('p', { class: 'filter-label mono', text: group.label }),
        el('div', { class: 'chip-row' }, [
          el('button', {
            type: 'button',
            class: `chip${filters[group.key] === null ? ' is-active' : ''}`,
            'aria-pressed': String(filters[group.key] === null),
            'data-key': group.key,
            'data-value': '',
            text: t(UI.filterAll),
          }),
          ...group.options.map((option) =>
            el('button', {
              type: 'button',
              class: `chip${String(filters[group.key]) === String(option.value) ? ' is-active' : ''}`,
              'aria-pressed': String(String(filters[group.key]) === String(option.value)),
              'data-key': group.key,
              'data-value': String(option.value),
              text: option.label,
            }),
          ),
        ]),
      ]),
    ));
  }

  function renderList() {
    const hits = PUBLICATIONS.filter(matches).sort((a, b) => b.year - a.year);
    if (countHost) countHost.textContent = `${hits.length} ${t(UI.resultCount)}`;

    if (!hits.length) {
      replace(listHost, el('p', { class: 'search-empty', text: t(UI.searchEmpty) }));
      return;
    }

    replace(listHost, hits.map((pub) =>
      el('article', { class: 'card publication-card' }, [
        el('div', { class: 'publication-figure' }, [visualAbstract(pub.abstractFigure)]),
        el('div', { class: 'publication-body' }, [
          el('p', { class: 'eyebrow mono' }, [
            String(pub.year),
            ' · ',
            t(pub.venue),
            pub.placeholder ? el('span', { class: 'chip chip-warn', text: t(UI.placeholderTag) }) : null,
          ]),
          el('h3', { class: 'card-title', text: t(pub.title) }),
          el('p', { class: 'card-summary', text: t(pub.oneLine) }),
          el('ul', { class: 'tag-row' }, [
            ...pub.topics.map((id) =>
              el('li', { class: 'tag', text: t(RESEARCH.find((r) => r.id === id)?.title) }),
            ),
            ...(pub.regions || []).map((id) =>
              el('li', { class: 'tag tag-muted', text: t(REGIONS.find((r) => r.id === id)?.label) }),
            ),
          ]),
          el('p', { class: 'card-meta mono', text: pub.doi ? `DOI ${pub.doi}` : t(UI.doiPending) }),
        ]),
      ]),
    ));
  }

  if (filterHost) {
    cleanups.push(bind(filterHost, 'click', (event) => {
      const chip = event.target.closest('.chip');
      if (!chip) return;
      const { key, value } = chip.dataset;
      const parsed = value === '' ? null : key === 'year' ? Number(value) : value;
      filters[key] = filters[key] === parsed ? null : parsed;
      renderFilters();
      renderList();
    }));
  }

  cleanups.push(on(EVENT.LOCALE_CHANGE, () => {
    renderFilters();
    renderList();
  }, { replay: true }));

  return () => cleanups.splice(0).forEach((fn) => fn());
}
