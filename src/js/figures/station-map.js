/**
 * 观测海域与站位图（SVG 示意图）。
 *
 * secret：岸线数据、符号系统、选中态的实现。
 * 外界只有 renderStationMap(host, { onSelect }) → cleanup()。
 *
 * ⚠ ADR-006：岸线为**粗略简化多边形**，图面已明示"非制图产品"。
 *   站位经纬度为真实值，经 science/projection.js 投影。
 *   P3 阶段替换为 MapLibre 时，只需重写本文件。
 *
 * 方案 §09 移动端决策：「将复杂地图改为重点站位列表」——
 * 窄屏下由 ui/ 决定是否渲染本图，本文件不做设备判断（职责在 ui 层）。
 */

import { svg, el, replace, on } from '../core/dom.js';
import { makeProjection, BOUNDS, pathOf, graticule } from '../science/projection.js';
import { formatLatLon, formatDepth } from '../science/format.js';
import { STATIONS, PLATFORMS } from '../content/expeditions.js';
import { t } from '../i18n/locale.js';
import { UI } from '../i18n/strings.js';

const W = 720;
const H = 430;

/** 粗略岸线，[纬度, 经度]。仅用于建立空间感，不可用于导航或测量。 */
const LAND = {
  mainland: [
    [28, 105], [28, 121.5], [26.5, 120.2], [25.0, 119.0], [23.5, 117.0], [22.5, 114.5],
    [21.8, 111.0], [21.5, 109.0], [20.5, 107.0], [18.5, 106.5], [16.5, 107.8],
    [14.0, 109.2], [12.0, 109.3], [10.5, 107.0], [9.0, 105.0],
  ],
  hainan: [[20.1, 110.3], [19.6, 111.0], [18.4, 110.5], [18.2, 108.9], [19.2, 108.6], [20.0, 109.5]],
  taiwan: [[25.3, 121.6], [24.5, 122.0], [23.0, 121.4], [21.9, 120.9], [22.6, 120.2], [24.2, 120.6], [25.1, 121.0]],
  luzon: [
    [18.6, 120.6], [18.4, 121.7], [17.5, 122.3], [16.3, 122.4], [15.2, 121.7], [14.4, 122.0],
    [13.9, 121.1], [14.2, 120.5], [15.5, 119.9], [16.4, 120.0], [17.7, 120.3],
  ],
  visayas: [
    [12.6, 123.0], [12.2, 125.1], [10.6, 126.0], [9.5, 126.3], [7.0, 126.5], [5.6, 125.3],
    [6.0, 124.0], [7.3, 122.0], [8.2, 123.0], [9.5, 123.4], [10.8, 122.6], [11.9, 122.1],
  ],
  borneo: [[7.0, 117.2], [6.4, 116.4], [5.5, 115.4], [4.5, 114.2], [3.2, 113.2], [2.0, 112.0], [2.0, 118.5], [6.0, 118.6]],
};

/** 帕劳、雅浦、关岛、塞班等小岛只作点标。 */
const ISLETS = [
  [13.45, 144.75, 'Guam'],
  [15.2, 145.75, 'Saipan'],
  [9.5, 138.1, 'Yap'],
  [7.4, 134.5, 'Palau'],
];

/** 海沟轴线（示意）。 */
const TRENCH_AXES = [
  { id: 'mariana', label: { zh: '马里亚纳海沟', en: 'Mariana Trench' }, pts: [[8.0, 137.0], [9.3, 138.5], [10.5, 140.5], [11.3, 142.6], [12.6, 144.6], [14.5, 146.5], [16.5, 147.6], [19.0, 147.8], [21.5, 146.5], [23.5, 144.5]] },
  { id: 'philippine', label: { zh: '菲律宾海沟', en: 'Philippine Trench' }, pts: [[5.5, 126.8], [8.0, 127.0], [10.5, 127.0], [12.5, 126.5]] },
];

/** 深海盆注记位置。 */
const BASINS = [
  { at: [16.4, 115.6], rx: 62, ry: 40, label: { zh: '南海海盆', en: 'SCS Basin' } },
  { at: [16.0, 130.5], rx: 74, ry: 56, label: { zh: '菲律宾海盆', en: 'Philippine Basin' } },
];

function symbolFor(platform, x, y, size = 5) {
  if (platform === 'ctd') return svg('circle', { cx: x, cy: y, r: size });
  if (platform === 'glider') {
    return svg('polygon', { points: `${x},${y - size} ${x + size},${y + size * 0.8} ${x - size},${y + size * 0.8}` });
  }
  return svg('rect', { x: x - size, y: y - size, width: size * 2, height: size * 2 });
}

export function renderStationMap(host, opts = {}) {
  const projection = makeProjection(BOUNDS, W, H);
  const cleanups = [];

  const root = svg('svg', {
    class: 'figure-svg map-svg',
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': t({
      zh: '西太平洋观测海域示意图，标注马里亚纳海沟、南海与菲律宾海的观测站位',
      en: 'Schematic map of the western Pacific showing observing stations in the Mariana Trench, South China Sea and Philippine Sea',
    }),
  });

  // ── 底：海
  root.append(svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'var(--c-abyss)' }));

  // ── 经纬网
  const grid = svg('g', { class: 'map-grid' });
  const { lons, lats } = graticule(BOUNDS);
  for (const lon of lons) {
    const a = projection.project(lon, BOUNDS.south);
    const b = projection.project(lon, BOUNDS.north);
    grid.append(
      svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }),
      svg('text', { x: a.x, y: H - 6, 'text-anchor': 'middle', class: 'figure-tick' }, [`${lon}°E`]),
    );
  }
  for (const lat of lats) {
    const a = projection.project(BOUNDS.west, lat);
    const b = projection.project(BOUNDS.east, lat);
    grid.append(
      svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }),
      svg('text', { x: 4, y: a.y - 4, class: 'figure-tick' }, [`${lat}°N`]),
    );
  }
  root.append(grid);

  // ── 海盆注记
  const basinGroup = svg('g', { class: 'map-basin' });
  for (const basin of BASINS) {
    const p = projection.project(basin.at[1], basin.at[0]);
    basinGroup.append(
      svg('ellipse', { cx: p.x, cy: p.y, rx: basin.rx, ry: basin.ry }),
      svg('text', { x: p.x, y: p.y, 'text-anchor': 'middle', class: 'map-basin-label' }, [t(basin.label)]),
    );
  }
  root.append(basinGroup);

  // ── 海沟轴线
  const trenchGroup = svg('g', { class: 'map-trench' });
  for (const axis of TRENCH_AXES) {
    trenchGroup.append(svg('path', { d: pathOf(projection, axis.pts) }));
    const mid = axis.pts[Math.floor(axis.pts.length / 2)];
    const p = projection.project(mid[1], mid[0]);
    trenchGroup.append(svg('text', { x: p.x + 10, y: p.y - 8, class: 'map-trench-label' }, [t(axis.label)]));
  }
  root.append(trenchGroup);

  // ── 陆地
  const landGroup = svg('g', { class: 'map-land' });
  for (const coords of Object.values(LAND)) {
    landGroup.append(svg('path', { d: pathOf(projection, coords, true) }));
  }
  for (const [lat, lon] of ISLETS) {
    const p = projection.project(lon, lat);
    landGroup.append(svg('circle', { cx: p.x, cy: p.y, r: 2.4 }));
  }
  root.append(landGroup);

  // ── 站位
  const detail = el('div', { class: 'map-detail', 'aria-live': 'polite' });
  const stationGroup = svg('g', { class: 'map-stations' });
  let selected = null;

  function select(station, node) {
    selected = station;
    for (const n of stationGroup.querySelectorAll('.map-station')) n.classList.remove('is-active');
    node.classList.add('is-active');
    replace(detail, [
      el('p', { class: 'map-detail-name', text: t(station.name) }),
      el('dl', { class: 'meta-list' }, [
        el('dt', { text: t({ zh: '坐标', en: 'Position' }) }),
        el('dd', { class: 'mono', text: formatLatLon(station.lat, station.lon) }),
        el('dt', { text: t(UI.maxDepth) }),
        el('dd', { class: 'mono', text: formatDepth(station.depthM) }),
        el('dt', { text: t(UI.platformLabel) }),
        el('dd', { text: t(PLATFORMS.find((p) => p.id === station.platform)?.label) }),
        el('dt', { text: t(UI.variablesLabel) }),
        el('dd', { class: 'mono', text: station.variables.join(' · ') }),
      ]),
    ]);
    opts.onSelect?.(station);
  }

  for (const station of STATIONS) {
    const p = projection.project(station.lon, station.lat);
    const mark = symbolFor(station.platform, p.x, p.y);
    const node = svg('g', {
      class: 'map-station',
      tabindex: '0',
      role: 'button',
      'aria-label': `${t(station.name)} · ${formatLatLon(station.lat, station.lon)} · ${formatDepth(station.depthM)}`,
    }, [
      svg('circle', { cx: p.x, cy: p.y, r: 13, class: 'map-station-hit' }),
      mark,
      svg('text', { x: p.x + 11, y: p.y + 4, class: 'map-station-label' }, [t(station.name)]),
    ]);

    cleanups.push(on(node, 'click', () => select(station, node)));
    cleanups.push(on(node, 'keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      select(station, node);
    }));
    stationGroup.append(node);
  }
  root.append(stationGroup);

  // ── 图例
  const legend = el('ul', { class: 'map-legend' },
    PLATFORMS.map((p) => el('li', {}, [
      el('span', { class: `legend-symbol legend-${p.symbol}`, 'aria-hidden': 'true' }),
      t(p.label),
    ])),
  );

  const note = el('p', { class: 'figure-note', text: t(UI.schematicCoastline) });
  const hint = el('p', { class: 'figure-readout', text: t(UI.selectStation) });

  replace(host, [root, el('div', { class: 'map-side' }, [legend, hint, detail]), note]);

  return () => {
    cleanups.splice(0).forEach((fn) => fn());
    host.replaceChildren();
    selected = null;
    void selected;
  };
}
