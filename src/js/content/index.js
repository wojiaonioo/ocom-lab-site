/**
 * 内容仓库聚合 + **双向关联索引** + 检索索引。
 *
 * secret：关联关系怎么反向推导、检索怎么打分。
 *
 * 方案 §01 设计机会 3：「用论文—数据—模型—成员—航次的关联网络，替代孤立的成果卡片」。
 * 各内容文件只声明**单向**关联（论文写自己属于哪些方向/海域/站位），
 * 反向边在这里一次性建立，避免两头手工维护导致失步。
 *
 * 方案 §05：「搜索结果按内容类型分组，不把所有结果混在单一列表」——见 search()。
 */

import { RESEARCH } from './research.js';
import { EXPEDITIONS, STATIONS, REGIONS, PLATFORMS } from './expeditions.js';
import { PUBLICATIONS } from './publications.js';
import { PEOPLE, NEWS, DATASETS } from './people.js';
import { validateAll } from './schema.js';

/** 全部内容集合。键名与 schema.REQUIRED 对齐，便于统一校验。 */
export const repo = {
  research: RESEARCH,
  expedition: EXPEDITIONS,
  publication: PUBLICATIONS,
  person: PEOPLE,
  dataset: DATASETS,
  station: STATIONS,
  news: NEWS,
};

export { REGIONS, PLATFORMS, STATIONS, PUBLICATIONS, RESEARCH, EXPEDITIONS, PEOPLE, NEWS, DATASETS };

/** 声明了关联字段的内容类型 → 该字段指向的目标类型。 */
const EDGE_FIELDS = {
  topics: 'research',
  regions: 'region',
  stations: 'station',
};

/**
 * 反向关联索引：`index[targetKind][targetId][sourceKind] = [sourceId, ...]`
 * 例：index.research['internal-tides'].publication → 属于该方向的所有论文 id
 */
function buildIndex() {
  const index = {};
  const touch = (kind, id) => {
    index[kind] ||= {};
    index[kind][id] ||= {};
    return index[kind][id];
  };

  for (const [sourceKind, items] of Object.entries(repo)) {
    for (const item of items) {
      for (const [field, targetKind] of Object.entries(EDGE_FIELDS)) {
        const targets = item[field];
        if (!Array.isArray(targets)) continue;
        for (const targetId of targets) {
          const bucket = touch(targetKind, targetId);
          bucket[sourceKind] ||= [];
          if (!bucket[sourceKind].includes(item.id)) bucket[sourceKind].push(item.id);
        }
      }
      // 单值字段：航次/站位的 region
      if (item.region) {
        const bucket = touch('region', item.region);
        bucket[sourceKind] ||= [];
        if (!bucket[sourceKind].includes(item.id)) bucket[sourceKind].push(item.id);
      }
    }
  }
  return index;
}

export const RELATIONS = buildIndex();

/**
 * 取某目标的关联条目。
 * @param {'research'|'region'|'station'} targetKind
 * @param {string} targetId
 * @param {string} [sourceKind] 只要某一类；省略则返回全部
 * @returns {object[]|Record<string, object[]>}
 */
export function related(targetKind, targetId, sourceKind) {
  const bucket = RELATIONS[targetKind]?.[targetId] || {};
  const hydrate = (kind, ids) => ids.map((id) => repo[kind]?.find((x) => x.id === id)).filter(Boolean);
  if (sourceKind) return hydrate(sourceKind, bucket[sourceKind] || []);
  return Object.fromEntries(Object.entries(bucket).map(([kind, ids]) => [kind, hydrate(kind, ids)]));
}

/** 某内容类型下、命中给定方向/海域/年份的条目。筛选器共用。 */
export function filterBy(kind, { topic, region, year } = {}) {
  return (repo[kind] || []).filter((item) => {
    if (topic && !(item.topics || []).includes(topic)) return false;
    if (region && item.region !== region && !(item.regions || []).includes(region)) return false;
    if (year && item.year !== year) return false;
    return true;
  });
}

// ---------------------------------------------------------------- 检索

/** 把一个条目摊平成可检索文本。双语都进索引，中英输入都能命中。 */
function flatten(value, out = []) {
  if (value == null) return out;
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => flatten(v, out));
  else if (typeof value === 'object') Object.values(value).forEach((v) => flatten(v, out));
  return out;
}

const SEARCHABLE = ['research', 'publication', 'expedition', 'person', 'dataset', 'station'];

const INDEX = SEARCHABLE.flatMap((kind) =>
  repo[kind].map((item) => ({
    kind,
    id: item.id,
    item,
    haystack: flatten([item.title, item.name, item.oneLine, item.summary, item.keywords, item.role, item.methods, item.question])
      .join(' ')
      .toLowerCase(),
  })),
);

/**
 * 全站检索。按内容类型分组返回（方案 §05）。
 * @param {string} query
 * @param {number} [limitPerKind]
 * @returns {Array<{kind:string, hits:object[]}>}
 */
export function search(query, limitPerKind = 4) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 1) return [];

  const scored = [];
  for (const record of INDEX) {
    const at = record.haystack.indexOf(q);
    if (at < 0) continue;
    // 靠前命中权重更高；标题命中优先于正文
    scored.push({ ...record, score: 1000 - at });
  }

  const grouped = new Map();
  for (const hit of scored.sort((a, b) => b.score - a.score)) {
    if (!grouped.has(hit.kind)) grouped.set(hit.kind, []);
    const list = grouped.get(hit.kind);
    if (list.length < limitPerKind) list.push(hit.item);
  }
  return [...grouped].map(([kind, hits]) => ({ kind, hits }));
}

/** 内容自检。构建期或控制台调用，对应方案 §10「构建阶段校验缺失字段」。 */
export function selfCheck() {
  return validateAll(repo);
}
