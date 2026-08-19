#!/usr/bin/env node
/**
 * 分层规则执行器 —— 把 docs/ARCHITECTURE.md §1 变成可执行检查。
 *
 * 参考：VS Code build/lib/layersChecker.ts（层规则写进 CI，不靠 code review）
 *      Lakos《Large-Scale C++ Software Design》levelization + ADP 无环依赖
 *
 * 四类检查：
 *   1. LEVEL   越级 import（依赖只能向下 / 同层内）
 *   2. ENV     level 0 的 science/ content/ 里出现 DOM 全局
 *   3. CYCLE   文件级 import 图存在环
 *   4. STYLE   出现 export default（静态扫描需要具名导出）
 *
 * 用法：node tools/check-layers.mjs [--json]
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JS_ROOT = join(ROOT, 'src', 'js');

/** 层级定义：数字越小越稳定。同层可互引，跨层只能高 → 低。 */
const LEVEL = { core: 0, science: 0, content: 0, i18n: 1, figures: 2, scenes: 2, ui: 3, main: 4 };

/** 白名单：某层可以 import 哪些层（不含自身，自身恒允许）。 */
const ALLOW = {
  core: [],
  science: [],
  content: [],
  i18n: ['core'],
  figures: ['core', 'science', 'content', 'i18n'],
  scenes: ['core', 'science', 'i18n'],
  ui: ['core', 'content', 'i18n', 'figures'],
  main: ['core', 'science', 'content', 'i18n', 'figures', 'scenes', 'ui'],
};

/** level 0 的纯层禁止触碰的浏览器全局。 */
const DOM_GLOBALS = [
  'document', 'window', 'navigator', 'localStorage', 'sessionStorage',
  'requestAnimationFrame', 'matchMedia', 'fetch', 'HTMLElement', 'HTMLCanvasElement',
];
const PURE_LAYERS = ['science', 'content'];

// ---------------------------------------------------------------- 工具

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

/** 由路径判定所属层：src/js/scenes/layers/x.js → 'scenes'；src/js/main.js → 'main'。 */
function layerOf(absPath) {
  const rel = relative(JS_ROOT, absPath).split(sep);
  return rel.length === 1 ? 'main' : rel[0];
}

/**
 * 只剥注释，保留字符串字面量。
 * import 路径必须从这一版提取 —— 剥掉字符串会把 '../core/dom.js' 清空，
 * 导致越级检查静默失效（本脚本首次自测就栽在这里，见 docs/VERIFICATION.md）。
 * 行号也基于这一版计算，剥注释用等长空白替换以保持行结构。
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(Math.max(0, m.length - p1.length)));
}

/** 在剥注释的基础上再清空字符串字面量，供 DOM 全局与导出风格检查使用。 */
function blankStrings(src) {
  return src
    .replace(/'(?:\\.|[^'\\\n])*'/g, (m) => `'${' '.repeat(Math.max(0, m.length - 2))}'`)
    .replace(/"(?:\\.|[^"\\\n])*"/g, (m) => `"${' '.repeat(Math.max(0, m.length - 2))}"`)
    .replace(/`(?:\\.|[^`\\])*`/g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * 取出所有 import / export-from 的模块说明符，返回 {spec, line}。
 *
 * 中段用 tempered greedy token —— `(?:(?!import|export)[^'";])*?` ——
 * 保证匹配不会跨越下一个 import/export 关键字或语句分号。
 * 不加这层限制时，文件开头的 `export const …` 会一路吃到后面某个 import 的 from，
 * 把该 import 误报在错误的行号上（首次自测已复现）。
 */
function importsOf(src) {
  const seen = new Set();
  const found = [];
  const MIDDLE = String.raw`(?:(?!\b(?:import|export)\b)[^'";])*?`;
  const patterns = [
    new RegExp(String.raw`\b(?:import|export)\b${MIDDLE}\bfrom\s*['"]([^'"]+)['"]`, 'g'),
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // 动态 import
    /\bimport\s+['"]([^'"]+)['"]/g, // 副作用导入
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(src))) {
      const line = src.slice(0, m.index).split('\n').length;
      const key = `${line}:${m[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ spec: m[1], line });
    }
  }
  return found;
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}

// ---------------------------------------------------------------- 检查

const problems = [];
const files = walk(JS_ROOT);
const graph = new Map();

for (const file of files) {
  const rel = relative(ROOT, file);
  const layer = layerOf(file);
  const raw = readFileSync(file, 'utf8');
  const source = stripComments(raw); // 提取 import 用：字符串完整
  const code = blankStrings(source); // 扫标识符用：字符串已清空

  if (!(layer in LEVEL)) {
    problems.push({ kind: 'LEVEL', file: rel, line: 1, msg: `未知层 "${layer}"，请先在 ARCHITECTURE.md §1 登记` });
    continue;
  }

  // 1. LEVEL —— 越级 import
  const deps = [];
  for (const { spec, line } of importsOf(source)) {
    if (!spec.startsWith('.')) {
      problems.push({ kind: 'LEVEL', file: rel, line, msg: `禁止外部依赖 "${spec}"（本项目零运行时依赖）` });
      continue;
    }
    const target = resolve(dirname(file), spec);
    deps.push(target);
    const targetLayer = layerOf(target);
    if (targetLayer === layer) continue;
    if (!ALLOW[layer].includes(targetLayer)) {
      problems.push({
        kind: 'LEVEL',
        file: rel,
        line,
        msg: `${layer}(L${LEVEL[layer]}) → ${targetLayer}(L${LEVEL[targetLayer] ?? '?'}) 越级；${layer} 只可依赖 [${ALLOW[layer].join(', ') || '无'}]`,
      });
    }
  }
  graph.set(file, deps);

  // 2. ENV —— 纯层不得触碰 DOM
  if (PURE_LAYERS.includes(layer)) {
    for (const g of DOM_GLOBALS) {
      const re = new RegExp(`\\b${g}\\b`, 'g');
      let m;
      while ((m = re.exec(code))) {
        problems.push({
          kind: 'ENV',
          file: rel,
          line: lineOf(code, m.index),
          msg: `${layer}/ 是纯层，禁止使用浏览器全局 "${g}"（须能在 Node 下直接运行）`,
        });
      }
    }
  }

  // 4. STYLE —— 具名导出
  let m;
  const reDefault = /\bexport\s+default\b/g;
  while ((m = reDefault.exec(code))) {
    problems.push({ kind: 'STYLE', file: rel, line: lineOf(code, m.index), msg: '禁止 export default，请用具名导出' });
  }
}

// 3. CYCLE —— 文件级依赖图必须是 DAG
{
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = new Map(files.map((f) => [f, WHITE]));
  const stack = [];

  const visit = (node) => {
    if (!graph.has(node)) return;
    color.set(node, GREY);
    stack.push(node);
    for (const dep of graph.get(node)) {
      if (!color.has(dep)) continue;
      if (color.get(dep) === GREY) {
        const at = stack.indexOf(dep);
        const loop = [...stack.slice(at), dep].map((f) => relative(ROOT, f)).join('\n        → ');
        problems.push({ kind: 'CYCLE', file: relative(ROOT, dep), line: 1, msg: `循环依赖：\n        → ${loop}` });
      } else if (color.get(dep) === WHITE) {
        visit(dep);
      }
    }
    stack.pop();
    color.set(node, BLACK);
  };

  for (const f of files) if (color.get(f) === WHITE) visit(f);
}

// ---------------------------------------------------------------- 输出

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ files: files.length, problems }, null, 2));
} else {
  const byKind = { LEVEL: [], ENV: [], CYCLE: [], STYLE: [] };
  for (const p of problems) byKind[p.kind].push(p);
  const label = {
    LEVEL: '越级依赖 (Lakos levelization)',
    ENV: '纯层触碰 DOM (VS Code common/ 规则)',
    CYCLE: '循环依赖 (ADP)',
    STYLE: '导出风格',
  };
  for (const kind of Object.keys(byKind)) {
    const list = byKind[kind];
    if (!list.length) continue;
    console.log(`\n■ ${label[kind]} —— ${list.length} 处`);
    for (const p of list) console.log(`  ${p.file}:${p.line}  ${p.msg}`);
  }
  console.log(
    problems.length
      ? `\n✗ 扫描 ${files.length} 个文件，${problems.length} 处违规。规则见 docs/ARCHITECTURE.md §1\n`
      : `\n✓ 扫描 ${files.length} 个文件：层级、环境、无环、导出风格 全部通过\n`,
  );
}

process.exit(problems.length ? 1 : 0);
