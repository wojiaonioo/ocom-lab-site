/**
 * 画布调色板 —— 从 CSS 自定义属性读取。
 *
 * secret：颜色值从哪来、怎么缓存、读不到时怎么办。
 *
 * 为什么不在 JS 里再写一遍十六进制：色彩令牌的唯一来源是 styles/tokens.css
 * （方案 §04 色彩令牌表）。两处硬编码必然失步 —— 改了 CSS 忘了改 canvas，
 * 页面上就会出现两种"深渊黑"。这里在挂载时读一次并缓存。
 */

/** 令牌名 → CSS 变量名。新增颜色两边都要加，但值只有一处。 */
const TOKENS = {
  abyss: '--c-abyss',
  trench: '--c-trench',
  current: '--c-current',
  observation: '--c-observation',
  foam: '--c-foam',
  sediment: '--c-sediment',
  coral: '--c-coral',
  surface: '--c-surface',
  midwater: '--c-midwater',
  ink: '--c-ink',
};

/** CSS 未就绪时的兜底（与 tokens.css 保持一致，仅用于极端失败路径）。 */
const FALLBACK = {
  abyss: '#031722',
  trench: '#063B52',
  current: '#21C7D3',
  observation: '#3D8FB5',
  foam: '#F2F8FA',
  sediment: '#D7C6A5',
  coral: '#FF7866',
  surface: '#0D5A74',
  midwater: '#062C3F',
  ink: '#0A1B24',
};

let cache = null;

/** 读取并缓存调色板。resize / 主题变化后调用 refresh()。 */
export function palette() {
  if (cache) return cache;
  const styles = getComputedStyle(document.documentElement);
  cache = Object.fromEntries(
    Object.entries(TOKENS).map(([key, varName]) => {
      const value = styles.getPropertyValue(varName).trim();
      return [key, value || FALLBACK[key]];
    }),
  );
  return cache;
}

export function refreshPalette() {
  cache = null;
  return palette();
}

/** #RRGGBB → [r,g,b]。渐变插值需要分量。 */
export function toRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** rgba() 字符串，用于带透明度的绘制。 */
export function rgba(hex, alpha) {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 两色线性插值，返回 rgba 字符串。渐变端点被视窗裁掉时需要重新算端点色。 */
export function mixColor(hexA, hexB, t, alpha = 1) {
  const a = toRgb(hexA);
  const b = toRgb(hexB);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}
