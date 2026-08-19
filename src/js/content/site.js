/**
 * 站点级内容：品牌、导航、首屏文案、身份带、科研流程、加入我们。
 *
 * 文案严格取自方案 v1.0 §03 品牌概念、§06.1 首页模块规格、附录 A 首页文案示例。
 * 改动前先看方案对应章节 —— 这里的每一句都是甲方已确认的口径。
 */

export const BRAND = {
  shortName: 'OCOM Lab',
  fullName: {
    zh: '海洋环流观测与数值模拟研究室',
    en: 'Ocean Circulation Observation & Modeling Laboratory',
  },
  /** ⚠ 方案 §03 明确：英文名与 OCOM Lab 属设计建议，上线前须经研究室与研究所确认 */
  nameStatus: 'proposed',
  concept: { zh: 'DEPTH / FLOW / EVIDENCE', en: 'DEPTH / FLOW / EVIDENCE' },
  conceptGloss: {
    zh: '让水深成为界面，让流场成为品牌，让证据成为内容',
    en: 'Depth as interface, flow as identity, evidence as content',
  },
  founded: 2014,
};

/** 顶部导航。栏目与"核心问题"取自方案 §05 信息架构。 */
export const NAV = [
  { id: 'discovery', label: { zh: '代表性发现', en: 'Discovery' }, ask: { zh: '发现了什么？', en: 'What did we find?' } },
  { id: 'research', label: { zh: '研究方向', en: 'Research' }, ask: { zh: '研究什么？', en: 'What do we study?' } },
  { id: 'workflow', label: { zh: '科研流程', en: 'Workflow' }, ask: { zh: '怎么做研究？', en: 'How do we work?' } },
  { id: 'expeditions', label: { zh: '观测与航次', en: 'Expeditions' }, ask: { zh: '如何获得证据？', en: 'How is evidence obtained?' } },
  { id: 'publications', label: { zh: '科研成果', en: 'Publications' }, ask: { zh: '产出了什么？', en: 'What was published?' } },
  { id: 'people', label: { zh: '团队成员', en: 'People' }, ask: { zh: '谁在研究？', en: 'Who does the work?' } },
  { id: 'join', label: { zh: '加入我们', en: 'Join' }, ask: { zh: '如何参与？', en: 'How to join?' } },
];

/** 首屏文案（方案附录 A）。 */
export const HERO = {
  eyebrow: { zh: '中国科学院深海科学与工程研究所', en: 'Institute of Deep-sea Science and Engineering, CAS' },
  title: { zh: 'FROM SURFACE TO HADAL', en: 'FROM SURFACE TO HADAL' },
  lede: {
    zh: '从表层到深渊，追踪海洋流动的结构与机制。通过长期原位观测、深海潜标与数值模型，研究深海环流、内潮混合与中尺度动力过程。',
    en: 'From the surface to the hadal zone, tracing the structure and mechanisms of ocean flow — through sustained in-situ observation, deep-sea moorings and numerical models.',
  },
  actions: [
    { id: 'research', label: { zh: '探索研究方向', en: 'Explore research' } },
    { id: 'discovery', label: { zh: '查看代表性成果', en: 'Selected findings' } },
  ],
  scrollHint: { zh: '向下滚动即下潜', en: 'Scroll to descend' },
};

/**
 * 首屏「发现标签」。方案 §06.1 模块 03：**用户主动切换**，默认不自动播放（ADR-004）。
 * scene 字段驱动 scenes/trench-scene.js 的场景状态。
 */
export const DISCOVERY_TABS = [
  {
    id: 'circulation',
    scene: 'circulation',
    label: { zh: '深渊环流', en: 'Hadal circulation' },
    caption: { zh: '世界最深深渊中的三层环流结构', en: 'Three-layer circulation in the deepest trench' },
  },
  {
    id: 'tides',
    scene: 'tides',
    label: { zh: '内潮与混合', en: 'Internal tides' },
    caption: { zh: '内潮沿海沟斜坡生成并向上传播', en: 'Internal tides generated at the trench slope' },
  },
  {
    id: 'moorings',
    scene: 'moorings',
    label: { zh: '深海观测', en: 'Deep-sea observing' },
    caption: { zh: '深海潜标连续观测系统', en: 'Sustained deep-sea mooring system' },
  },
];

/** 科研身份带。方案 §06.1 模块 04：用稳定标签，**不堆叠易过期数字**。 */
export const IDENTITY = [
  { value: '2014', label: { zh: '研究室成立', en: 'Established' } },
  { value: '10.9 km', label: { zh: '最大观测水深量级', en: 'Max observing depth' } },
  { value: 'Observation', label: { zh: '原位观测 · 潜标 / CTD / 海流计', en: 'In-situ · moorings / CTD / current meters' } },
  { value: 'Modeling', label: { zh: '数值模拟 · HYCOM / ROMS / POM', en: 'Numerical · HYCOM / ROMS / POM' } },
];

/** 科研流程主轴。方案 §06.2：Observe → Data → Model → Explain → Outputs。 */
export const WORKFLOW = [
  {
    id: 'observe',
    step: 'Observe',
    title: { zh: '原位观测', en: 'In-situ observation' },
    ask: { zh: '证据如何获得？', en: 'How is evidence obtained?' },
    body: { zh: '潜标、CTD、滑翔机、航次与仪器。', en: 'Moorings, CTD, gliders, cruises and instruments.' },
  },
  {
    id: 'data',
    step: 'Data',
    title: { zh: '数据治理', en: 'Data curation' },
    ask: { zh: '数据是否可信、可复用？', en: 'Is the data trustworthy and reusable?' },
    body: { zh: '质量控制、剖面、时间序列与元数据。', en: 'QC, profiles, time series and metadata.' },
  },
  {
    id: 'model',
    step: 'Model',
    title: { zh: '数值模拟', en: 'Numerical modeling' },
    ask: { zh: '如何补足观测并检验机制？', en: 'How to complement observation and test mechanisms?' },
    body: { zh: 'HYCOM、ROMS、POM 及理想化试验。', en: 'HYCOM, ROMS, POM and idealized experiments.' },
  },
  {
    id: 'explain',
    step: 'Explain',
    title: { zh: '动力诊断', en: 'Dynamical diagnosis' },
    ask: { zh: '过程为什么发生？', en: 'Why does the process occur?' },
    body: { zh: '环流、内潮、涡旋、输运与能量收支。', en: 'Circulation, internal tides, eddies, transport and energetics.' },
  },
  {
    id: 'outputs',
    step: 'Outputs',
    title: { zh: '科学产出', en: 'Scientific outputs' },
    ask: { zh: '形成了哪些可验证成果？', en: 'What verifiable results emerged?' },
    body: { zh: '论文、数据集、模型、项目与人才。', en: 'Papers, datasets, models, projects and people.' },
  },
];

/** 加入我们（方案附录 A.1）。 */
export const JOIN = {
  title: { zh: '加入我们', en: 'Join us' },
  body: {
    zh: '面向物理海洋、流体力学、海洋观测、数值模拟、数据分析与科学可视化方向招收研究生和科研人员。',
    en: 'Recruiting graduate students and researchers in physical oceanography, fluid dynamics, ocean observation, numerical modeling, data analysis and scientific visualization.',
  },
  caveat: {
    zh: '具体名额、要求和联系方式以研究室当期正式通知为准。',
    en: 'Quotas, requirements and contact details follow the laboratory’s current official announcement.',
  },
};

/** demo 提示条（ADR-005：占位内容必须可见标注）。 */
export const DEMO_NOTICE = {
  zh: '演示原型 · 人员、论文、DOI、联系方式均为占位，海沟地形与流场为示意模型',
  en: 'Prototype · people, papers, DOIs and contacts are placeholders; bathymetry and flow field are schematic',
};
