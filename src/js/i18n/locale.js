/**
 * 语言状态。
 *
 * secret：语言怎么持久化、怎么广播、缺英文时怎么回退。
 * 外界只有 t() / getLocale() / setLocale()。
 *
 * 方案 §09 无障碍基线：「中英文页面设置正确语言属性」——setLocale 同步 <html lang>。
 * 方案原则 05：中英文用同一内容模型，因此这里没有"两套文案表"，只有一个 { zh, en } 取值器。
 */

import { EVENT, emit } from '../core/bus.js';

const STORAGE_KEY = 'ocom.locale';
const SUPPORTED = ['zh', 'en'];

let current = 'zh';

/**
 * 初始语言：本地存储 > 中文。
 *
 * **不读 navigator.language**：这是中科院研究所的主站，中文是第一语言，
 * 英文是并行版本而非回退版本。按浏览器偏好自动切成英文会让中文访客
 * 首次进站就看到英文，与机构对外口径不符。
 *
 * 正式站应按方案 §10 用 hreflang + 独立 URL 提供中英两套路径，
 * 由服务端按路径决定语言，而不是靠客户端探测（ADR-008）。
 */
function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {
    /* 隐私模式下 localStorage 可能抛错，忽略 */
  }
  return 'zh';
}

export const getLocale = () => current;

export const otherLocale = () => (current === 'zh' ? 'en' : 'zh');

/**
 * 取双语文本。
 * @param {{zh:string, en?:string}|string|undefined} entry
 * @returns {string} 缺英文时回退中文（方案允许英文延后补齐，但不能空白）
 */
export function t(entry) {
  if (entry == null) return '';
  if (typeof entry === 'string') return entry;
  return entry[current] || entry.zh || entry.en || '';
}

/** 取双语数组，逐项 t()。 */
export const tList = (entry) => {
  const value = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry[current] || entry.zh : entry;
  return Array.isArray(value) ? value : [];
};

/** 切换语言并广播。 */
export function setLocale(next) {
  if (!SUPPORTED.includes(next) || next === current) return;
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* 忽略 */
  }
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  emit(EVENT.LOCALE_CHANGE, next);
}

/** 由 main.js 启动时调用一次。 */
export function initLocale() {
  current = detect();
  document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en';
  emit(EVENT.LOCALE_CHANGE, current);
}
