/**
 * 内容模型契约 + 构建期校验。
 *
 * secret：字段的必填规则与校验实现。
 * 存在理由 —— 方案 §10 工程要求：「构建阶段校验缺失字段、失效链接、重复 DOI 和未授权文件」。
 * 本文件是那条要求的落点，可在 Node 下直接跑（纯层，不碰 DOM）。
 *
 * 双语约定：任何面向用户的文本都是 `{ zh, en }`。缺 en 时校验会报警但不阻断
 * —— 方案原则 05「双语同构」要求同一内容模型，但允许英文延后补齐。
 */

/** 双语文本 */
export const isI18nText = (v) => !!v && typeof v === 'object' && typeof v.zh === 'string';

/** 各内容类型的必填字段。新增类型必须在此登记，否则 validate 会拒绝。 */
export const REQUIRED = {
  research: ['id', 'title', 'question', 'summary', 'methods', 'findings'],
  expedition: ['id', 'name', 'start', 'region', 'platforms', 'stations'],
  publication: ['id', 'title', 'year', 'venue', 'topics'],
  person: ['id', 'role', 'keywords'],
  dataset: ['id', 'title', 'variables', 'coverage', 'license'],
  station: ['id', 'name', 'lat', 'lon', 'depthM'],
  news: ['id', 'date', 'title'],
};

/**
 * 校验一个内容集合。
 * @param {string} kind REQUIRED 中的键
 * @param {object[]} items
 * @returns {Array<{id:string, field:string, level:'error'|'warn', msg:string}>}
 */
export function validate(kind, items) {
  const required = REQUIRED[kind];
  if (!required) return [{ id: '-', field: '-', level: 'error', msg: `未登记的内容类型 "${kind}"` }];

  const problems = [];
  const seen = new Set();

  for (const item of items) {
    const id = item.id || '(缺 id)';
    if (seen.has(id)) problems.push({ id, field: 'id', level: 'error', msg: 'id 重复' });
    seen.add(id);

    for (const field of required) {
      const value = item[field];
      if (value == null || (Array.isArray(value) && !value.length)) {
        problems.push({ id, field, level: 'error', msg: '必填字段缺失' });
      }
    }

    // 双语完整性
    for (const [field, value] of Object.entries(item)) {
      if (!isI18nText(value)) continue;
      if (!value.en) problems.push({ id, field, level: 'warn', msg: '缺英文（双语同构）' });
    }

    // ADR-005：占位内容必须自报家门，且不得携带 DOI
    if (item.placeholder && item.doi) {
      problems.push({ id, field: 'doi', level: 'error', msg: '占位条目不得携带 DOI（ADR-005）' });
    }
  }
  return problems;
}

/** 汇总校验全部集合，供 tools/ 或构建期调用。 */
export function validateAll(repo) {
  const out = [];
  for (const [kind, items] of Object.entries(repo)) {
    if (!Array.isArray(items) || !REQUIRED[kind]) continue;
    out.push(...validate(kind, items).map((p) => ({ ...p, kind })));
  }
  return out;
}
