#!/usr/bin/env node
/**
 * 对比度执行器 —— 把方案 §09「正文、按钮和图表文字满足足够的前景/背景对比度」
 * 变成可执行检查。
 *
 * 思路与 tools/check-layers.mjs 一致：规则写进脚本，退出码驱动，不靠 code review。
 *
 * 只做**令牌级**检查（前景令牌 × 背景令牌），不需要浏览器：
 * 页面上实际出现的 95 处不达标，根因全部集中在 4 个令牌上（见 docs/VERIFICATION.md V-004）。
 * 令牌对了，用法就对；用法层面的抽查由浏览器审计脚本补充（同文档附脚本）。
 *
 * 用法：node tools/check-contrast.mjs
 */

import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = join(ROOT, 'src', 'styles', 'tokens.css');

/** WCAG 2.1 相对亮度 */
function luminance([r, g, b]) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function toRgb(hex) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
}

const ratio = (a, b) => {
  const l1 = luminance(toRgb(a));
  const l2 = luminance(toRgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/**
 * 从 tokens.css 抓取令牌值，并解析别名。
 * 面令牌是别名而非字面量（`--surface-page: var(--c-foam)`），
 * 只认 `#hex` 会让一半契约静默变成"未找到"而不是"不达标"。
 */
function readTokens() {
  const css = readFileSync(TOKENS, 'utf8');
  const raw = {};
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css))) {
    const value = m[2].trim();
    // 同名令牌在不同主题块里会重复出现，只取首次（:root 里的定义）
    if (!(m[1] in raw)) raw[m[1]] = value;
  }

  const resolve1 = (value, depth = 0) => {
    if (depth > 8) return null;
    if (value.startsWith('#')) return value;
    const alias = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (alias && raw[alias[1]]) return resolve1(raw[alias[1]], depth + 1);
    return null;
  };

  const out = {};
  for (const [name, value] of Object.entries(raw)) {
    const hex = resolve1(value);
    if (hex) out[name] = hex;
  }
  return out;
}

/**
 * 契约表：前景令牌 × 背景令牌 × 最低对比度。
 * AA 正文 4.5、大字 3.0。此处一律按 4.5 要求 —— 站点的等宽小字标签很多，
 * 放宽到 3.0 会让"水深/坐标/单位"这类关键数值率先失守。
 */
const PAIRS = [
  // 浅色版块
  ['--text-strong', '--surface-page', 4.5],
  ['--text-body', '--surface-page', 4.5],
  ['--text-muted', '--surface-page', 4.5],
  ['--text-faint', '--surface-page', 4.5],
  ['--text-strong', '--surface-card', 4.5],
  ['--text-body', '--surface-card', 4.5],
  ['--text-muted', '--surface-card', 4.5],
  ['--text-faint', '--surface-card', 4.5],
  ['--c-trench', '--surface-page', 4.5],
  ['--c-observation-ink', '--surface-page', 4.5],
  ['--c-observation-ink', '--surface-card', 4.5],
  ['--c-coral-ink', '--surface-page', 4.5],
  ['--c-coral-ink', '--surface-card', 4.5],

  // 深色版块：对**较浅的那个深色面**取严，卡片上也要达标
  ['--text-strong-dark', '--surface-dark', 4.5],
  ['--text-body-dark', '--surface-dark', 4.5],
  ['--text-muted-dark', '--surface-dark', 4.5],
  ['--text-faint-dark', '--surface-dark', 4.5],
  ['--text-strong-dark', '--surface-dark-raised', 4.5],
  ['--text-body-dark', '--surface-dark-raised', 4.5],
  ['--text-muted-dark', '--surface-dark-raised', 4.5],
  ['--text-faint-dark', '--surface-dark-raised', 4.5],
  ['--c-current', '--surface-dark', 4.5],
  ['--c-current', '--surface-dark-raised', 4.5],
  ['--c-sediment', '--surface-dark', 4.5],
  ['--c-coral', '--surface-dark', 4.5],

  // 反色按钮
  ['--c-abyss', '--c-current', 4.5],
  ['--c-foam', '--c-trench', 4.5],
];

const tokens = readTokens();
const problems = [];
const rows = [];

for (const [fg, bg, min] of PAIRS) {
  if (!tokens[fg] || !tokens[bg]) {
    problems.push(`未找到令牌：${!tokens[fg] ? fg : bg}`);
    continue;
  }
  const value = ratio(tokens[fg], tokens[bg]);
  const ok = value >= min;
  rows.push({ fg, bg, value, min, ok });
  if (!ok) problems.push(`${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}) = ${value.toFixed(2)}:1，要求 ≥ ${min}`);
}

for (const r of rows) {
  const mark = r.ok ? '  OK ' : '  ✗  ';
  console.log(`${mark}${r.fg.padEnd(22)} on ${r.bg.padEnd(22)} ${r.value.toFixed(2).padStart(6)}:1`);
}

console.log(
  problems.length
    ? `\n✗ ${PAIRS.length} 组令牌中 ${problems.length} 组不达标：\n  ${problems.join('\n  ')}\n`
    : `\n✓ ${PAIRS.length} 组令牌对比度全部达标（WCAG AA 4.5:1）\n`,
);

process.exit(problems.length ? 1 : 0);
