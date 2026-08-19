/**
 * 版块序号侧栏（桌面）。
 *
 * secret：序号编排、活动态的呈现方式。
 *
 * 借自参考 skill 的「ordered section labels + 主题感知对比度」，
 * 但明确遵守其自身的红线：**活动项必须靠颜色和位置可辨，而不是只靠动画**
 * ——所以活动项同时改变了序号颜色、标签透明度和引导线长度，三个静态可辨的通道。
 */

import { EVENT, on } from '../core/bus.js';
import { el, qs, replace, on as bind } from '../core/dom.js';
import { t } from '../i18n/locale.js';
import { UI } from '../i18n/strings.js';
import { NAV } from '../content/site.js';

/**
 * 侧栏覆盖**全部**版块，因此比顶部导航多两项：首屏与科研身份带。
 * 顶部导航严格保持方案 §05 规定的七个栏目，不在那里加东西。
 */
const RAIL = [
  { id: 'stage', label: { zh: '首屏', en: 'Opening' } },
  { id: 'identity', label: { zh: '科研身份', en: 'Identity' } },
  ...NAV,
];

export function initNavRail(root = document) {
  const rail = qs('#nav-rail', root);
  if (!rail) return () => {};
  const cleanups = [];

  function render() {
    rail.setAttribute('aria-label', t(UI.sectionNav));
    replace(
      rail,
      el('ol', { class: 'rail-list' },
        RAIL.map((item, i) =>
          el('li', {}, [
            el('a', { class: 'rail-item', href: `#${item.id}`, 'data-rail': item.id }, [
              el('span', { class: 'rail-num mono', text: String(i + 1).padStart(2, '0') }),
              el('span', { class: 'rail-line', 'aria-hidden': 'true' }),
              el('span', { class: 'rail-label', text: t(item.label) }),
            ]),
          ]),
        ),
      ),
    );
  }

  cleanups.push(on(EVENT.LOCALE_CHANGE, render, { replay: true }));

  cleanups.push(
    on(EVENT.SECTION_ACTIVE, ({ id, theme }) => {
      rail.dataset.theme = theme;
      for (const item of rail.querySelectorAll('.rail-item')) {
        const active = item.dataset.rail === id;
        item.classList.toggle('is-active', active);
        if (active) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      }
    }, { replay: true }),
  );

  cleanups.push(
    bind(rail, 'click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const target = qs(link.getAttribute('href'), document);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  );

  return () => cleanups.splice(0).forEach((fn) => fn());
}
