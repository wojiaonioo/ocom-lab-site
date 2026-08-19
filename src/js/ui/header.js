/**
 * 顶部导航：栏目链接、语言切换、滚动态、主题感知配色。
 *
 * secret：滚动阈值、主题类名的施加方式、语言按钮的文案方向。
 *
 * 方案 §06.1 模块 01：「首屏透明、滚动后转雾白背景；
 * Logo + 正式中文名 + 七个栏目 + 中英切换 + 搜索」。
 *
 * 主题感知：深色版块下导航用浅色文字，浅色版块下用深色文字。
 * 切换点由 core/scroll 的固定判定线给出，保证切换干脆、不在边界闪烁。
 */

import { EVENT, on } from '../core/bus.js';
import { el, qs, replace, on as bind } from '../core/dom.js';
import { t, setLocale, otherLocale } from '../i18n/locale.js';
import { UI } from '../i18n/strings.js';
import { NAV, BRAND, DEMO_NOTICE } from '../content/site.js';

export function initHeader(root = document) {
  const header = qs('#site-header', root);
  const navHost = qs('#primary-nav', root);
  const langBtn = qs('#lang-toggle', root);
  const ribbon = qs('#demo-ribbon', root);
  const brandName = qs('#brand-name', root);
  if (!header) return () => {};

  const cleanups = [];

  function render() {
    replace(
      navHost,
      NAV.map((item) =>
        el('a', { class: 'nav-link', href: `#${item.id}`, 'data-nav': item.id }, [
          el('span', { class: 'nav-link-label', text: t(item.label) }),
          el('span', { class: 'nav-link-ask', text: t(item.ask) }),
        ]),
      ),
    );
    langBtn.textContent = t(UI.langToggle);
    langBtn.setAttribute('aria-label', t(UI.langToggleLabel));
    langBtn.setAttribute('lang', otherLocale() === 'zh' ? 'zh-CN' : 'en');
    if (brandName) brandName.textContent = t(BRAND.fullName);
    if (ribbon) ribbon.textContent = t(DEMO_NOTICE);
  }

  cleanups.push(on(EVENT.LOCALE_CHANGE, render, { replay: true }));
  cleanups.push(bind(langBtn, 'click', () => setLocale(otherLocale())));

  // 滚动态：越过首屏第一段即加背景。用 8vh 而非 0，避免在顶部微抖时反复切换
  let scrolled = false;
  const onScroll = () => {
    const next = window.scrollY > window.innerHeight * 0.08;
    if (next === scrolled) return;
    scrolled = next;
    header.classList.toggle('is-scrolled', next);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', onScroll));
  onScroll();

  // 主题感知 + 当前栏目高亮
  cleanups.push(
    on(EVENT.SECTION_ACTIVE, ({ id, theme }) => {
      header.dataset.theme = theme;
      for (const link of navHost.querySelectorAll('.nav-link')) {
        link.classList.toggle('is-current', link.dataset.nav === id);
      }
    }, { replay: true }),
  );

  // 平滑滚动 + 焦点转移（键盘用户不能只滚不移焦点）
  cleanups.push(
    bind(navHost, 'click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const target = qs(link.getAttribute('href'), document);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', link.getAttribute('href'));
    }),
  );

  return () => cleanups.splice(0).forEach((fn) => fn());
}
