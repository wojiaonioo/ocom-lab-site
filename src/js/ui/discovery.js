/**
 * 发现标签（首屏）+ 代表性发现面板。
 *
 * secret：标签与场景状态的同步、剖面图的重建时机。
 *
 * 方案 §06.1 模块 03：发现标签由**用户主动切换**（ADR-004，不自动轮播）。
 * 方案 §06.1 模块 05：代表性发现 = 左侧交互剖面 + 右侧研究问题 / 观测方法 /
 * 关键发现 / 意义 / 论文和数据入口。
 *
 * 标签只负责 emit(SCENE_STATE)；场景层订阅它。二者互不引用（ARCHITECTURE §3）。
 */

import { EVENT, on, emit } from '../core/bus.js';
import { el, qs, replace, on as bind } from '../core/dom.js';
import { t, tList } from '../i18n/locale.js';
import { DISCOVERY_TABS } from '../content/site.js';
import { RESEARCH_BY_ID } from '../content/research.js';
import { STATION_BY_ID, REGIONS } from '../content/expeditions.js';
import { related } from '../content/index.js';
import { renderVelocityProfile } from '../figures/velocity-profile.js';

/** 标签 → 用于展开叙述的研究方向。 */
const TAB_TOPIC = { circulation: 'hadal-circulation', tides: 'internal-tides', moorings: 'observing-system' };

export function initDiscovery(root = document) {
  const tabHost = qs('#discovery-tabs', root);
  const figureHost = qs('#discovery-figure', root);
  const bodyHost = qs('#discovery-body', root);
  const cleanups = [];

  let activeId = DISCOVERY_TABS[0].id;
  let disposeFigure = null;

  function renderTabs() {
    if (!tabHost) return;
    replace(
      tabHost,
      DISCOVERY_TABS.map((tab) =>
        el('button', {
          type: 'button',
          class: `scene-tab${tab.id === activeId ? ' is-active' : ''}`,
          'data-tab': tab.id,
          'aria-pressed': String(tab.id === activeId),
        }, [
          el('span', { class: 'scene-tab-label', text: t(tab.label) }),
          el('span', { class: 'scene-tab-caption', text: t(tab.caption) }),
        ]),
      ),
    );
  }

  function renderPanel() {
    if (!bodyHost) return;
    const tab = DISCOVERY_TABS.find((x) => x.id === activeId);
    const topic = RESEARCH_BY_ID[TAB_TOPIC[activeId]];
    if (!topic) return;

    const links = related('research', topic.id);
    const pubs = links.publication || [];
    const expeditions = links.expedition || [];

    // 站位不声明 topics，因此不会出现在研究方向的反向索引里。
    // 经由"论文/航次 → 站位"两跳求并集，才是这个方向真正用到的观测站位。
    const stationIds = new Set();
    for (const item of [...pubs, ...expeditions]) for (const id of item.stations || []) stationIds.add(id);
    const stations = [...stationIds].map((id) => STATION_BY_ID[id]).filter(Boolean);

    const regions = (topic.regions || []).map((id) => REGIONS.find((r) => r.id === id)).filter(Boolean);

    replace(bodyHost, [
      el('p', { class: 'eyebrow mono', text: `${t(tab.label).toUpperCase()} / ${t(topic.title)}` }),
      el('h3', { class: 'discovery-title', text: t(tab.caption) }),
      el('p', { class: 'discovery-question', text: t(topic.question) }),

      el('dl', { class: 'meta-list' }, [
        el('dt', { text: t({ zh: '观测方法', en: 'Methods' }) }),
        el('dd', { text: tList(topic.methods).join(' · ') }),
        el('dt', { text: t({ zh: '关键发现', en: 'Key finding' }) }),
        el('dd', { text: t(topic.findings) }),
        el('dt', { text: t({ zh: '研究海域', en: 'Regions' }) }),
        el('dd', { text: regions.map((r) => t(r.label)).join(' · ') || '—' }),
      ]),

      el('div', { class: 'discovery-links' }, [
        linkGroup(t({ zh: '相关论文', en: 'Papers' }), pubs.map((p) => t(p.title)), 'publications'),
        linkGroup(t({ zh: '观测站位', en: 'Stations' }), stations.map((s) => t(s.name)), 'expeditions'),
        linkGroup(t({ zh: '相关航次', en: 'Expeditions' }), expeditions.map((e) => t(e.name)), 'expeditions'),
      ]),
    ]);
  }

  function renderFigure() {
    if (!figureHost) return;
    disposeFigure?.();
    // 内潮标签下用叠加内潮的剖面，与首屏场景保持同一速度场
    disposeFigure = renderVelocityProfile(figureHost, { mode: activeId === 'tides' ? 'tides' : 'circulation' });
  }

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    const tab = DISCOVERY_TABS.find((x) => x.id === id);
    emit(EVENT.SCENE_STATE, tab?.scene || 'circulation');
    renderTabs();
    renderPanel();
    renderFigure();
  }

  if (tabHost) {
    cleanups.push(bind(tabHost, 'click', (event) => {
      const btn = event.target.closest('.scene-tab');
      if (btn) setActive(btn.dataset.tab);
    }));
  }

  cleanups.push(on(EVENT.LOCALE_CHANGE, () => {
    renderTabs();
    renderPanel();
    renderFigure();
  }, { replay: true }));

  emit(EVENT.SCENE_STATE, DISCOVERY_TABS[0].scene);

  return () => {
    cleanups.splice(0).forEach((fn) => fn());
    disposeFigure?.();
  };
}

const SHOWN = 3;

function linkGroup(title, items, target) {
  if (!items.length) return null;
  return el('div', { class: 'link-group' }, [
    el('h4', { class: 'link-group-title', text: `${title} · ${items.length}` }),
    el('ul', {}, items.slice(0, SHOWN).map((label) =>
      el('li', {}, [el('a', { href: `#${target}`, text: label })]),
    )),
    // 只在确实被截断时才提示，避免出现"3 相关论文"这类多余计数
    items.length > SHOWN
      ? el('p', { class: 'link-group-more mono', text: `+${items.length - SHOWN}` })
      : null,
  ]);
}
