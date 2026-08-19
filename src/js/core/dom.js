/**
 * DOM 构造与查询小工具。
 *
 * secret：节点创建时属性/事件/子节点的分派规则。
 * 这不是模板引擎 —— ADR-003 决定不做通用渲染层，这里只保留最小够用集。
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * 创建元素。
 *
 * props 约定：
 *   class / text / html / dataset / style(对象) / aria-* / on<Event>(函数) / 其余按 setAttribute
 * 值为 null|undefined|false 的属性被跳过，便于写条件属性。
 *
 * @param {string} tag
 * @param {Record<string, any>} [props]
 * @param {Array<Node|string|null|false>|Node|string} [children]
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  return build(document.createElement(tag), props, children);
}

/** 同 el()，但走 SVG 命名空间。figures/ 全部走这个。 */
export function svg(tag, props = {}, children = []) {
  return build(document.createElementNS(SVG_NS, tag), props, children);
}

function build(node, props, children) {
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') node.setAttribute('class', value);
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? '' : String(value));
  }
  append(node, children);
  return node;
}

/** 追加子节点，自动跳过空值、包装字符串、展开数组。 */
export function append(parent, children) {
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null || child === false || child === '') continue;
    parent.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/** 清空并写入新内容。列表重渲用。 */
export function replace(parent, children) {
  parent.replaceChildren();
  return append(parent, children);
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/** 绑定事件并返回解绑函数，便于 cleanup。 */
export function on(target, type, handler, opts) {
  target.addEventListener(type, handler, opts);
  return () => target.removeEventListener(type, handler, opts);
}

/** 焦点陷阱：移动端全屏导航、搜索面板用。返回释放函数。 */
export function trapFocus(container) {
  const SELECTOR = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const onKey = (event) => {
    if (event.key !== 'Tab') return;
    const items = qsa(SELECTOR, container).filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}
