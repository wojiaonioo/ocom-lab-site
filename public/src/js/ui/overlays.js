/**
 * 两个全屏浮层：移动端导航 + 全站检索。
 *
 * secret：浮层的开合、焦点管理、Esc 关闭、滚动锁定。
 *
 * 合在一个模块里而不是拆成两个：二者共享**完全相同的**开合机制
 * （焦点陷阱、Esc、body 锁滚、返回焦点）。拆开会把这套机制复制两份，
 * 那是 Parnas 说的"按流程分解"而不是"按秘密分解"。
 * 两者不同的只是内容，由各自的 render 函数负责。
 *
 * 方案 §09 无障碍：所有交互可键盘操作、Esc 关闭、焦点可见、浮层文字避开安全区。
 */

import { EVENT, on } from '../core/bus.js';
import { el, qs, replace, on as bind, trapFocus } from '../core/dom.js';
import { t } from '../i18n/locale.js';
import { UI } from '../i18n/strings.js';
import { NAV, JOIN } from '../content/site.js';
import { search } from '../content/index.js';

/** 开合控制器：两个浮层共用。 */
function createOverlay(panel, opener) {
  let releaseTrap = null;
  let lastFocus = null;

  const close = () => {
    if (panel.hidden) return;
    panel.hidden = true;
    document.documentElement.classList.remove('is-locked');
    opener?.setAttribute('aria-expanded', 'false');
    releaseTrap?.();
    releaseTrap = null;
    lastFocus?.focus?.();
  };

  const open = () => {
    if (!panel.hidden) return;
    lastFocus = document.activeElement;
    panel.hidden = false;
    document.documentElement.classList.add('is-locked');
    opener?.setAttribute('aria-expanded', 'true');
    releaseTrap = trapFocus(panel);
    const first = panel.querySelector('input, a, button');
    first?.focus();
  };

  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);

  return { open, close, dispose: () => { document.removeEventListener('keydown', onKey); close(); } };
}

export function initOverlays(root = document) {
  const cleanups = [];

  // ── 移动端导航
  const menuPanel = qs('#mobile-nav', root);
  const menuBtn = qs('#menu-open', root);
  if (menuPanel && menuBtn) {
    const overlay = createOverlay(menuPanel, menuBtn);
    const body = qs('#mobile-nav-body', menuPanel);

    const render = () => {
      menuBtn.setAttribute('aria-label', t(UI.menu));
      replace(body, [
        el('ul', { class: 'overlay-nav' },
          NAV.map((item) =>
            el('li', {}, [
              el('a', { href: `#${item.id}` }, [
                el('span', { class: 'overlay-nav-label', text: t(item.label) }),
                el('span', { class: 'overlay-nav-ask', text: t(item.ask) }),
              ]),
            ]),
          ),
        ),
        el('p', { class: 'overlay-foot', text: t(JOIN.body) }),
      ]);
    };

    cleanups.push(on(EVENT.LOCALE_CHANGE, render, { replay: true }));
    cleanups.push(bind(menuBtn, 'click', overlay.open));
    cleanups.push(bind(qs('#mobile-nav-close', menuPanel), 'click', overlay.close));
    cleanups.push(bind(menuPanel, 'click', (e) => {
      if (e.target.closest('a[href^="#"]')) overlay.close();
    }));
    cleanups.push(overlay.dispose);
  }

  // ── 检索
  const searchPanel = qs('#search-panel', root);
  const searchBtn = qs('#search-open', root);
  if (searchPanel && searchBtn) {
    const overlay = createOverlay(searchPanel, searchBtn);
    const input = qs('#search-input', searchPanel);
    const results = qs('#search-results', searchPanel);

    const renderChrome = () => {
      searchBtn.setAttribute('aria-label', t(UI.searchLabel));
      input.placeholder = t(UI.searchPlaceholder);
      input.setAttribute('aria-label', t(UI.searchLabel));
      qs('#search-hint', searchPanel).textContent = t(UI.searchHint);
      runSearch();
    };

    function runSearch() {
      const q = input.value.trim();
      if (!q) return replace(results, el('p', { class: 'search-empty', text: t(UI.searchPlaceholder) }));

      const groups = search(q);
      if (!groups.length) return replace(results, el('p', { class: 'search-empty', text: t(UI.searchEmpty) }));

      // 方案 §05：结果按内容类型分组，不混在单一列表
      replace(results, groups.map((group) =>
        el('section', { class: 'search-group' }, [
          el('h3', { class: 'search-group-title', text: t(UI.kind[group.kind]) }),
          el('ul', {},
            group.hits.map((hit) =>
              el('li', {}, [
                el('a', { href: `#${hitSection(group.kind)}` }, [
                  el('span', { class: 'search-hit-title', text: t(hit.title || hit.name) }),
                  hit.oneLine || hit.summary
                    ? el('span', { class: 'search-hit-sub', text: t(hit.oneLine || hit.summary) })
                    : null,
                ]),
              ]),
            ),
          ),
        ]),
      ));
    }

    cleanups.push(on(EVENT.LOCALE_CHANGE, renderChrome, { replay: true }));
    cleanups.push(bind(searchBtn, 'click', overlay.open));
    cleanups.push(bind(qs('#search-close', searchPanel), 'click', overlay.close));
    cleanups.push(bind(input, 'input', runSearch));
    cleanups.push(bind(results, 'click', (e) => {
      if (e.target.closest('a[href^="#"]')) overlay.close();
    }));
    cleanups.push(overlay.dispose);

    // ⌘K / Ctrl+K
    const onHotkey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        overlay.open();
      }
    };
    document.addEventListener('keydown', onHotkey);
    cleanups.push(() => document.removeEventListener('keydown', onHotkey));
  }

  return () => cleanups.splice(0).forEach((fn) => fn?.());
}

/** 内容类型 → 落地版块。demo 无内页，检索结果先跳到对应版块。 */
function hitSection(kind) {
  return { research: 'research', publication: 'publications', expedition: 'expeditions', person: 'people', dataset: 'expeditions', station: 'expeditions' }[kind] || 'main';
}
