/**
 * 团队成员 + 新闻动态 + 加入我们。
 *
 * secret：成员卡的构成、新闻排序。
 *
 * ADR-005：**不使用任何人像**。头像位用 figures/visual-abstract.js 的
 * 程序生成字母标记。成员姓名全部标注"待确认"，方案 §12.1 要求上线前签署核验。
 *
 * 方案附录 A.1 写作规则：新闻标题呈现事实，不用"热烈祝贺""重磅发布"。
 */

import { EVENT, on } from '../core/bus.js';
import { el, qs, replace } from '../core/dom.js';
import { t, tList } from '../i18n/locale.js';
import { UI } from '../i18n/strings.js';
import { PEOPLE, NEWS } from '../content/people.js';
import { JOIN } from '../content/site.js';
import { RESEARCH } from '../content/research.js';
import { monogram } from '../figures/visual-abstract.js';

export function initPeople(root = document) {
  const peopleHost = qs('#people-grid', root);
  const newsHost = qs('#news-list', root);
  const joinHost = qs('#join-body', root);
  const cleanups = [];

  function render() {
    if (peopleHost) {
      replace(peopleHost, [...PEOPLE].sort((a, b) => a.order - b.order).map((person) =>
        el('article', { class: 'card person-card' }, [
          el('div', { class: 'person-avatar' }, [monogram(person.initials)]),
          el('h3', { class: 'person-name', text: t(person.name) }),
          el('p', { class: 'person-role mono', text: t(person.role) }),
          el('ul', { class: 'tag-row' },
            tList(person.keywords).map((k) => el('li', { class: 'tag tag-muted', text: k })),
          ),
          el('p', { class: 'card-meta', text: person.topics.map((id) => t(RESEARCH.find((r) => r.id === id)?.title)).join(' · ') }),
        ]),
      ));
    }

    if (newsHost) {
      replace(newsHost, [...NEWS].sort((a, b) => (a.date < b.date ? 1 : -1)).map((item) =>
        el('li', { class: 'news-item' }, [
          el('time', { class: 'news-date mono', datetime: item.date, text: item.date }),
          el('span', { class: 'news-kind', text: t(item.kind) }),
          el('p', { class: 'news-title', text: t(item.title) }),
        ]),
      ));
    }

    if (joinHost) {
      replace(joinHost, [
        el('p', { class: 'join-body', text: t(JOIN.body) }),
        el('p', { class: 'join-caveat', text: t(JOIN.caveat) }),
        el('p', { class: 'figure-note', text: t(UI.footerNote) }),
      ]);
    }
  }

  cleanups.push(on(EVENT.LOCALE_CHANGE, render, { replay: true }));
  return () => cleanups.splice(0).forEach((fn) => fn());
}
