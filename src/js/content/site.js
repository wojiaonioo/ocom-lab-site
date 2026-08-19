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

/**
 * 页面骨架里的静态文案。
 *
 * 键名与 index.html 的 `data-copy="..."` 一一对应，由 ui/copy.js 统一写入。
 *
 * 为什么这些字既在 HTML 里写一遍、又在这里存一份：
 * HTML 里那份是**无脚本时的可读内容**（方案 §12 验收：脚本失败时内容仍可阅读），
 * 这里这份是**双语切换的数据源**（方案原则 05）。
 * 静态站没有服务端渲染，二者只能并存；迁到 Astro 后由模板从本文件渲染，重复即消除（ADR-008）。
 */
export const COPY = {
  'hero.eyebrow': { zh: '中国科学院深海科学与工程研究所 · 成立于 2014 年', en: 'Institute of Deep-sea Science and Engineering, CAS · Established 2014' },
  'hero.lede': {
    zh: '从表层到深渊，追踪海洋流动的结构与机制。通过长期原位观测、深海潜标与数值模型，研究深海环流、内潮混合与中尺度动力过程。',
    en: 'From the surface to the hadal zone, tracing the structure and mechanisms of ocean flow — through sustained in-situ observation, deep-sea moorings and numerical models of deep circulation, internal-tide mixing and mesoscale dynamics.',
  },
  'hero.action.research': { zh: '探索研究方向', en: 'Explore research' },
  'hero.action.discovery': { zh: '查看代表性成果', en: 'Selected findings' },
  'hero.scroll': { zh: '向下滚动即下潜', en: 'Scroll to descend' },

  'hadal.eyebrow': { zh: 'HADAL ZONE · 深渊带', en: 'HADAL ZONE' },
  'hadal.title': { zh: '万米之下的三层环流', en: 'Three layers below eleven kilometres' },
  'hadal.body': {
    zh: '背景断面为横穿马里亚纳海沟的示意剖面，长 240 km。粒子按三层环流速度场平流，颜色对应各层，越过海底即被地形遮挡。',
    en: 'The backdrop is a schematic 240 km section across the Mariana Trench. Particles advect with the three-layer velocity field, coloured by layer, and are occluded once they cross the seafloor.',
  },

  'sec.discovery.eyebrow': { zh: 'SELECTED DISCOVERY', en: 'SELECTED DISCOVERY' },
  'sec.discovery.title': { zh: '代表性发现', en: 'Selected discovery' },
  'sec.discovery.lede': {
    zh: '左侧为海沟轴部的纬向流速垂向剖面，可用指针或方向键读取任意深度的流速与离散度；右侧给出对应的科学问题、观测方法、关键发现，以及通往论文、站位与航次的入口。',
    en: 'Left: the vertical profile of zonal velocity at the trench axis — read any depth with the pointer or arrow keys. Right: the science question, methods, key finding, and links into papers, stations and cruises.',
  },

  'sec.research.eyebrow': { zh: 'RESEARCH', en: 'RESEARCH' },
  'sec.research.title': { zh: '四个研究方向', en: 'Four research themes' },
  'sec.research.lede': {
    zh: '深海与深渊环流、内潮与垂向混合、深层海盆与中尺度过程、海洋观测系统。每个方向都对应一组可追溯的证据：观测站位、航次、数据与论文。',
    en: 'Hadal circulation, internal tides and mixing, deep basins and mesoscale processes, and observing systems. Each theme resolves into traceable evidence: stations, cruises, datasets and papers.',
  },

  'sec.workflow.eyebrow': { zh: 'OBSERVE → DATA → MODEL → EXPLAIN → OUTPUTS', en: 'OBSERVE → DATA → MODEL → EXPLAIN → OUTPUTS' },
  'sec.workflow.title': { zh: '从观测到解释', en: 'From observation to explanation' },
  'sec.workflow.lede': {
    zh: '这条主轴同时是全站内容的关联方式：每篇论文至少关联一个研究方向，代表性论文进一步关联观测海域、航次、数据、模型与参与成员。',
    en: 'This spine is also how the site links its content: every paper connects to at least one theme, and key papers further connect to regions, cruises, datasets, models and people.',
  },

  'sec.expeditions.eyebrow': { zh: 'EXPEDITIONS & OBSERVING', en: 'EXPEDITIONS & OBSERVING' },
  'sec.expeditions.title': { zh: '观测与航次', en: 'Expeditions & observing' },
  'sec.expeditions.lede': {
    zh: '观测航次是本站相对通用实验室模板最重要的新增资产。选择地图上的站位，右侧航次列表会高亮相关条目；窄屏下地图自动替换为重点站位列表。',
    en: 'Cruise records are this site’s most distinctive asset compared with a generic lab template. Select a station on the map to highlight the related cruises; on narrow screens the map is replaced by a station list.',
  },

  'sec.publications.eyebrow': { zh: 'PUBLICATIONS', en: 'PUBLICATIONS' },
  'sec.publications.title': { zh: '科研成果', en: 'Publications' },
  'sec.publications.lede': {
    zh: '论文按年份、研究方向与海域筛选。每条给出一句话结论与结构性视觉摘要，而不是仅有题录。正式 DOI、摘要图与开放状态须在上线前补齐并核验。',
    en: 'Filter by year, theme and region. Each entry carries a one-sentence result and a structural visual abstract rather than a bare citation. DOIs, abstract figures and access status must be completed and verified before launch.',
  },

  'sec.people.eyebrow': { zh: 'PEOPLE & NEWS', en: 'PEOPLE & NEWS' },
  'sec.people.title': { zh: '团队与动态', en: 'People & news' },
  'sec.people.lede': {
    zh: '成员信息、肖像、联系方式与论文归属须由研究室提供并在上线前逐项核验，因此此处全部为角色占位，头像使用程序生成的字母标记，不使用任何人像。',
    en: 'Names, portraits, contacts and authorship must be supplied and verified by the laboratory before launch. Everything here is a role placeholder; avatars are generated monograms — no photographs are used.',
  },

  'sec.join.eyebrow': { zh: 'JOIN US', en: 'JOIN US' },
  'sec.join.title': { zh: '加入我们', en: 'Join us' },

  'footer.org': { zh: '海洋环流观测与数值模拟研究室 · 中国科学院深海科学与工程研究所', en: 'Ocean Circulation Observation & Modeling Laboratory · IDSSE, Chinese Academy of Sciences' },
  'footer.meta': { zh: '资料快照日期 2026-08-19 · 网站设计方案 v1.0 首页体验原型', en: 'Content snapshot 2026-08-19 · Homepage experience prototype for site design plan v1.0' },

  'ui.skip': { zh: '跳到主要内容', en: 'Skip to main content' },
  'ui.close': { zh: '关闭', en: 'Close' },
  'ui.noscript': {
    zh: '脚本未启用。首屏动态场景、检索与筛选不可用，但下列全部文字内容、栏目结构与链接仍可正常阅读与导航。',
    en: 'JavaScript is disabled. The animated scene, search and filters are unavailable, but all text, section structure and links below remain readable and navigable.',
  },
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
