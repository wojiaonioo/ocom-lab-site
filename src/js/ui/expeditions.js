/**
 * 观测与航次：站位图 + 航次列表 + 站位联动。
 *
 * secret：窄屏是否渲染地图、站位选中如何联动航次列表。
 *
 * 方案 §09 移动端关键决策：「将复杂地图改为重点站位列表」——
 * 设备判断在这里做，figures/station-map.js 不含任何设备逻辑（职责分离）。
 *
 * 方案 §07：观测航次详情页是本项目最重要的新增资产，
 * 因此航次条目展示日期、海域、最大水深、平台、仪器与关联论文，而不是一行标题。
 */

import { EVENT, on } from '../core/bus.js';
import { el, qs, replace } from '../core/dom.js';
import { isNarrow, onResize } from '../core/env.js';
import { t, tList } from '../i18n/locale.js';
import { UI } from '../i18n/strings.js';
import { EXPEDITIONS, STATIONS, PLATFORMS, REGIONS } from '../content/expeditions.js';
import { related } from '../content/index.js';
import { formatDepth, formatLatLon, formatDateRange } from '../science/format.js';

export function initExpeditions(root = document) {
  const mapHost = qs('#station-map', root);
  const listHost = qs('#expedition-list', root);
  const cleanups = [];

  let disposeMap = null;
  let highlight = null;

  function renderMap() {
    if (!mapHost) return;
    disposeMap?.();
    disposeMap = null;

    if (isNarrow()) {
      // 窄屏：重点站位列表替代地图
      replace(mapHost, [
        el('ul', { class: 'station-list' },
          STATIONS.map((station) =>
            el('li', { class: 'station-row' }, [
              el('p', { class: 'station-name', text: t(station.name) }),
              el('p', { class: 'station-meta mono', text: `${formatLatLon(station.lat, station.lon)} · ${formatDepth(station.depthM)}` }),
              el('p', { class: 'station-platform', text: t(PLATFORMS.find((p) => p.id === station.platform)?.label) }),
            ]),
          ),
        ),
        el('p', { class: 'figure-note', text: t(UI.schematicCoastline) }),
      ]);
      return;
    }

    // 宽屏：动态载入地图模块，窄屏访客不为此付出解析成本
    import('../figures/station-map.js')
      .then(({ renderStationMap }) => {
        disposeMap = renderStationMap(mapHost, {
          onSelect: (station) => {
            highlight = station.id;
            renderList();
          },
        });
      })
      .catch((err) => {
        console.error('[expeditions] 地图加载失败，退回站位列表：', err);
        replace(mapHost, el('p', { class: 'figure-note', text: t(UI.selectStation) }));
      });
  }

  function renderList() {
    if (!listHost) return;
    replace(listHost, EXPEDITIONS.map((exp) => {
      const stations = (exp.stations || []).map((id) => STATIONS.find((s) => s.id === id)).filter(Boolean);
      const isLinked = highlight && exp.stations?.includes(highlight);
      const pubs = new Set();
      for (const st of stations) for (const p of related('station', st.id, 'publication')) pubs.add(t(p.title));

      return el('article', { class: `card expedition-card${isLinked ? ' is-linked' : ''}` }, [
        el('header', { class: 'expedition-head' }, [
          el('p', { class: 'eyebrow mono', text: formatDateRange(exp.start, exp.end) }),
          el('h3', { class: 'card-title', text: t(exp.name) }),
          exp.placeholder ? el('span', { class: 'chip chip-warn', text: t(UI.placeholderTag) }) : null,
        ]),
        el('p', { class: 'card-summary', text: t(exp.summary) }),
        el('dl', { class: 'meta-list meta-inline' }, [
          el('dt', { text: t(UI.filterRegion) }),
          el('dd', { text: t(REGIONS.find((r) => r.id === exp.region)?.label) }),
          el('dt', { text: t(UI.maxDepth) }),
          el('dd', { class: 'mono', text: formatDepth(exp.maxDepthM) }),
          el('dt', { text: t(UI.platformLabel) }),
          el('dd', { text: exp.platforms.map((id) => t(PLATFORMS.find((p) => p.id === id)?.label)).join(' · ') }),
          el('dt', { text: t(UI.stationsLabel) }),
          el('dd', { text: stations.map((s) => t(s.name)).join(' · ') || '—' }),
          el('dt', { text: t(UI.instrumentsLabel) }),
          el('dd', { text: tList(exp.instruments).join(' · ') }),
        ]),
        pubs.size
          ? el('p', { class: 'card-meta', text: `${t(UI.relatedItems)}：${[...pubs].slice(0, 2).join('；')}` })
          : null,
      ]);
    }));
  }

  cleanups.push(on(EVENT.LOCALE_CHANGE, () => {
    renderMap();
    renderList();
  }, { replay: true }));

  // 视口跨过窄屏阈值时切换地图/列表两种形态
  let wasNarrow = isNarrow();
  cleanups.push(onResize(() => {
    if (isNarrow() === wasNarrow) return;
    wasNarrow = isNarrow();
    renderMap();
  }));

  return () => {
    cleanups.splice(0).forEach((fn) => fn());
    disposeMap?.();
  };
}
