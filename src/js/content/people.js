/**
 * 团队成员 + 新闻动态。
 *
 * ⚠ ADR-005：**不编造真实姓名、职称、联系方式、照片**。
 *   这里全部用角色占位。头像由 figures/ 程序生成字母标记，不使用任何人像。
 *   方案 §11 素材清单要求：成员标准肖像、中英文简介、研究关键词、公开联系方式
 *   均须在上线前由研究室提供并核验。
 */

export const PEOPLE = [
  {
    id: 'pi',
    placeholder: true,
    order: 1,
    initials: 'PI',
    name: { zh: '学科带头人（待确认）', en: 'Principal Investigator (TBC)' },
    role: { zh: '研究员 · 学科带头人', en: 'Professor · Principal Investigator' },
    keywords: { zh: ['深渊环流', '深海观测', '动力诊断'], en: ['Hadal circulation', 'Deep-sea observation', 'Dynamics'] },
    topics: ['hadal-circulation', 'observing-system'],
  },
  {
    id: 'researcher-a',
    placeholder: true,
    order: 2,
    initials: 'R1',
    name: { zh: '研究人员 A（待确认）', en: 'Researcher A (TBC)' },
    role: { zh: '副研究员', en: 'Associate Professor' },
    keywords: { zh: ['内潮', '垂向混合', '能量通量'], en: ['Internal tides', 'Vertical mixing', 'Energy flux'] },
    topics: ['internal-tides'],
  },
  {
    id: 'researcher-b',
    placeholder: true,
    order: 3,
    initials: 'R2',
    name: { zh: '研究人员 B（待确认）', en: 'Researcher B (TBC)' },
    role: { zh: '副研究员', en: 'Associate Professor' },
    keywords: { zh: ['中尺度涡', '近惯性波', '南海'], en: ['Mesoscale eddies', 'Near-inertial waves', 'SCS'] },
    topics: ['deep-basin'],
  },
  {
    id: 'engineer',
    placeholder: true,
    order: 4,
    initials: 'EN',
    name: { zh: '观测工程岗（待确认）', en: 'Observing Engineer (TBC)' },
    role: { zh: '高级工程师', en: 'Senior Engineer' },
    keywords: { zh: ['潜标系统', '声学通信', '布放回收'], en: ['Mooring systems', 'Acoustic comms', 'Deployment'] },
    topics: ['observing-system'],
  },
  {
    id: 'modeler',
    placeholder: true,
    order: 5,
    initials: 'MD',
    name: { zh: '数值模拟岗（待确认）', en: 'Numerical Modeler (TBC)' },
    role: { zh: '助理研究员', en: 'Assistant Professor' },
    keywords: { zh: ['ROMS', 'HYCOM', '模式验证'], en: ['ROMS', 'HYCOM', 'Model validation'] },
    topics: ['deep-basin', 'hadal-circulation'],
  },
  {
    id: 'students',
    placeholder: true,
    order: 6,
    initials: 'GS',
    name: { zh: '研究生团队（待确认）', en: 'Graduate students (TBC)' },
    role: { zh: '博士 / 硕士研究生', en: 'PhD / MSc students' },
    keywords: { zh: ['数据分析', '科学可视化', '现场观测'], en: ['Data analysis', 'Scientific visualization', 'Fieldwork'] },
    topics: ['hadal-circulation', 'internal-tides', 'deep-basin', 'observing-system'],
  },
];

/**
 * 新闻动态。方案 §05：新闻覆盖论文、航次、团队、会议、招生。
 * 标题写科学结论，不写"热烈祝贺"（方案附录 A.1 首页写作规则）。
 */
export const NEWS = [
  {
    id: 'news-1',
    placeholder: true,
    date: '2026-07-18',
    kind: { zh: '航次', en: 'Expedition' },
    title: { zh: '深渊潜标完成回收，取得连续流速时间序列（占位）', en: 'Hadal moorings recovered with continuous velocity time series (placeholder)' },
  },
  {
    id: 'news-2',
    placeholder: true,
    date: '2026-05-04',
    kind: { zh: '论文', en: 'Paper' },
    title: { zh: '三层环流结构研究成果发表（占位）', en: 'Three-layer circulation results published (placeholder)' },
  },
  {
    id: 'news-3',
    placeholder: true,
    date: '2026-03-12',
    kind: { zh: '招生', en: 'Recruiting' },
    title: { zh: '研究室开放物理海洋与观测技术方向研究生名额（占位）', en: 'Graduate positions open in physical oceanography and observing technology (placeholder)' },
  },
];

/** 数据集与模型（方案 §05「数据与模型」栏目的最小集合）。 */
export const DATASETS = [
  {
    id: 'ds-hadal-mooring',
    placeholder: true,
    title: { zh: '深渊潜标流速与温盐时间序列', en: 'Hadal mooring velocity and T–S time series' },
    variables: ['u', 'v', 'T', 'S', 'P'],
    coverage: { zh: '马里亚纳海沟 · 挑战者深渊', en: 'Mariana Trench · Challenger Deep' },
    license: { zh: '开放边界待确认', en: 'Access policy TBC' },
    stations: ['challenger-deep'],
    topics: ['hadal-circulation', 'observing-system'],
  },
  {
    id: 'ds-scs-array',
    placeholder: true,
    title: { zh: '南海深层锚系阵列观测', en: 'SCS deep mooring array observations' },
    variables: ['u', 'v', 'T'],
    coverage: { zh: '南海深海盆 · 吕宋海峡', en: 'SCS deep basin · Luzon Strait' },
    license: { zh: '开放边界待确认', en: 'Access policy TBC' },
    stations: ['scs-basin', 'luzon-strait'],
    topics: ['deep-basin'],
  },
  {
    id: 'ds-regional-model',
    placeholder: true,
    title: { zh: '区域高分辨率模式输出', en: 'High-resolution regional model output' },
    variables: ['u', 'v', 'w', 'T', 'S'],
    coverage: { zh: '西北太平洋 · 南海', en: 'NW Pacific · SCS' },
    license: { zh: '开放边界待确认', en: 'Access policy TBC' },
    stations: ['philippine-basin', 'scs-basin'],
    topics: ['deep-basin', 'hadal-circulation'],
  },
];
