/**
 * 垂向流速剖面图（SVG，可交互）。
 *
 * secret：SVG 的构造、比例尺、悬停/键盘读数的实现。
 * 外界只有 renderVelocityProfile(host, opts) → cleanup()。
 *
 * 对应方案 §06.1 模块 05「代表性发现：左侧交互剖面」。
 *
 * 无障碍（方案 §09）：
 *   - 图形可获得焦点，↑/↓ 移动读数，Home/End 跳到表层/海底
 *   - 读数写入 aria-live 区域
 *   - 附完整数据表，屏幕阅读器与不看图的读者都能取到数值
 */

import { svg, el, replace } from '../core/dom.js';
import { velocityProfile, readAt } from '../science/profile.js';
import { formatDepth, formatSpeed, speedDirection } from '../science/format.js';
import { t, getLocale } from '../i18n/locale.js';
import { UI } from '../i18n/strings.js';

const W = 380;
const H = 470;
const M = { top: 38, right: 16, bottom: 34, left: 54 };

const TONE = { upper: 'var(--c-observation)', intermediate: 'var(--c-current)', hadal: 'var(--c-sediment)' };

export function renderVelocityProfile(host, opts = {}) {
  const profile = velocityProfile({ mode: opts.mode || 'circulation' });
  const { uRange, floorM, samples } = profile;

  const px = (u) => M.left + ((u - uRange.min) / (uRange.max - uRange.min)) * (W - M.left - M.right);
  const py = (z) => M.top + (z / floorM) * (H - M.top - M.bottom);
  const zAt = (yPx) => ((yPx - M.top) / (H - M.top - M.bottom)) * floorM;

  const root = svg('svg', {
    class: 'figure-svg',
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    tabindex: '0',
    'aria-label': t({
      zh: '海沟轴部纬向流速垂向剖面，显示三层环流结构',
      en: 'Vertical profile of zonal velocity at the trench axis showing three-layer circulation',
    }),
  });

  // ── 层带
  for (const layer of profile.layers) {
    root.append(
      svg('rect', {
        x: M.left,
        y: py(layer.topM),
        width: W - M.left - M.right,
        height: Math.max(0, py(layer.bottomM) - py(layer.topM)),
        fill: TONE[layer.meta.id] || 'var(--c-current)',
        opacity: '0.05',
      }),
    );
  }

  // ── 网格 + 深度刻度
  const gridGroup = svg('g', { class: 'figure-grid' });
  for (let z = 0; z <= floorM; z += 2000) {
    gridGroup.append(
      svg('line', { x1: M.left, x2: W - M.right, y1: py(z), y2: py(z), stroke: 'currentColor', 'stroke-opacity': '0.12' }),
      svg('text', { x: M.left - 8, y: py(z) + 4, 'text-anchor': 'end', class: 'figure-tick' }, [
        z === 0 ? '0' : (z / 1000).toFixed(0),
      ]),
    );
  }
  gridGroup.append(
    svg('text', { x: M.left - 8, y: py(floorM) + 4, 'text-anchor': 'end', class: 'figure-tick' }, [(floorM / 1000).toFixed(1)]),
    svg('text', { x: 6, y: 16, class: 'figure-axis-title' }, [`${t(UI.depthAxis)} / km`]),
  );
  root.append(gridGroup);

  // ── 流速刻度（顶部）
  const uTicks = svg('g', { class: 'figure-grid' });
  for (let u = -0.15; u <= 0.2001; u += 0.05) {
    const v = Math.round(u * 1000) / 1000;
    if (v < uRange.min || v > uRange.max) continue;
    uTicks.append(
      svg('line', { x1: px(v), x2: px(v), y1: M.top, y2: H - M.bottom, stroke: 'currentColor', 'stroke-opacity': v === 0 ? '0.34' : '0.08' }),
      svg('text', { x: px(v), y: M.top - 10, 'text-anchor': 'middle', class: 'figure-tick' }, [v.toFixed(2)]),
    );
  }
  uTicks.append(
    svg('text', { x: W - M.right, y: 16, 'text-anchor': 'end', class: 'figure-axis-title' }, [
      `${t(UI.velocityAxis)} u / m s⁻¹`,
    ]),
    svg('text', { x: px(uRange.max) - 2, y: H - 8, 'text-anchor': 'end', class: 'figure-tick' }, [t(UI.eastward)]),
    svg('text', { x: px(uRange.min) + 2, y: H - 8, 'text-anchor': 'start', class: 'figure-tick' }, [t(UI.westward)]),
  );
  root.append(uTicks);

  // ── 离散度带
  const upper = samples.map((s) => `${px(s.u + s.sigma)},${py(s.depth)}`);
  const lower = [...samples].reverse().map((s) => `${px(s.u - s.sigma)},${py(s.depth)}`);
  root.append(
    svg('polygon', { points: [...upper, ...lower].join(' '), fill: 'var(--c-current)', opacity: '0.13' }),
  );

  // ── 主曲线
  root.append(
    svg('polyline', {
      points: samples.map((s) => `${px(s.u)},${py(s.depth)}`).join(' '),
      fill: 'none',
      stroke: 'var(--c-trench)',
      'stroke-width': '2',
      'stroke-linejoin': 'round',
    }),
  );

  // ── 流向反转深度
  for (const depth of profile.crossings) {
    root.append(
      svg('line', {
        x1: M.left, x2: W - M.right, y1: py(depth), y2: py(depth),
        stroke: 'var(--c-coral)', 'stroke-width': '1', 'stroke-dasharray': '4 3', 'stroke-opacity': '0.8',
      }),
      svg('text', { x: W - M.right - 4, y: py(depth) - 6, 'text-anchor': 'end', class: 'figure-callout' }, [
        `${t(UI.reversalDepth)} ${formatDepth(depth)}`,
      ]),
    );
  }

  // ── 海底
  root.append(
    svg('line', { x1: M.left, x2: W - M.right, y1: py(floorM), y2: py(floorM), stroke: 'var(--c-sediment)', 'stroke-width': '2' }),
    svg('text', { x: M.left + 4, y: py(floorM) - 6, class: 'figure-callout' }, [`${t(UI.seafloor)} ${formatDepth(floorM)}`]),
  );

  // ── 读数十字线
  const cursor = svg('g', { class: 'figure-cursor', opacity: '0' }, [
    svg('line', { x1: M.left, x2: W - M.right, y1: 0, y2: 0, stroke: 'var(--c-coral)', 'stroke-width': '1' }),
    svg('circle', { cx: 0, cy: 0, r: 4, fill: 'var(--c-coral)' }),
  ]);
  root.append(cursor);

  const readout = el('p', { class: 'figure-readout', 'aria-live': 'polite' });
  let depthCursor = 3400;

  function updateCursor(depth) {
    depthCursor = Math.max(0, Math.min(depth, floorM));
    const r = readAt(profile, depthCursor);
    const y = py(r.depth);
    cursor.setAttribute('opacity', '1');
    cursor.children[0].setAttribute('y1', y);
    cursor.children[0].setAttribute('y2', y);
    cursor.children[1].setAttribute('cx', px(r.u));
    cursor.children[1].setAttribute('cy', y);
    readout.textContent = `${formatDepth(r.depth)} · u = ${formatSpeed(r.u)} · ${speedDirection(r.u, getLocale())} · σ ≈ ${formatSpeed(r.sigma, { unit: false })}`;
  }

  const onPointer = (event) => {
    const rect = root.getBoundingClientRect();
    const yPx = ((event.clientY - rect.top) / rect.height) * H;
    updateCursor(zAt(yPx));
  };
  const onLeave = () => {
    cursor.setAttribute('opacity', '0');
    readout.textContent = t(UI.hoverProfile);
  };
  const onKey = (event) => {
    const stepMap = { ArrowUp: -200, ArrowDown: 200, PageUp: -1000, PageDown: 1000 };
    if (event.key === 'Home') return updateCursor(0), event.preventDefault();
    if (event.key === 'End') return updateCursor(floorM), event.preventDefault();
    const step = stepMap[event.key];
    if (step === undefined) return;
    event.preventDefault();
    updateCursor(depthCursor + step);
  };

  root.addEventListener('pointermove', onPointer);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('keydown', onKey);
  root.addEventListener('focus', () => updateCursor(depthCursor));

  // ── 数据表（不看图也能取数）
  const table = el('details', { class: 'figure-table' }, [
    el('summary', { text: t({ zh: '查看剖面数据表', en: 'View profile data table' }) }),
    el('table', {}, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', { text: t({ zh: '水深 / m', en: 'Depth / m' }) }),
          el('th', { text: 'u / m s⁻¹' }),
          el('th', { text: t({ zh: '流向', en: 'Direction' }) }),
        ]),
      ]),
      el(
        'tbody',
        {},
        Array.from({ length: 12 }, (_, i) => {
          const depth = (i / 11) * floorM;
          const r = readAt(profile, depth);
          return el('tr', {}, [
            el('td', { text: formatDepth(r.depth, { unit: false }) }),
            el('td', { text: formatSpeed(r.u, { unit: false }) }),
            el('td', { text: speedDirection(r.u, getLocale()) }),
          ]);
        }),
      ),
    ]),
  ]);

  const note = el('p', { class: 'figure-note', text: `${t(UI.spreadBand)} · ${t(UI.schematicField)}` });

  replace(host, [root, readout, note, table]);
  onLeave();

  return () => {
    root.removeEventListener('pointermove', onPointer);
    root.removeEventListener('pointerleave', onLeave);
    root.removeEventListener('keydown', onKey);
    host.replaceChildren();
  };
}
