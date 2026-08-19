/**
 * 界面文案（不属于内容模型的那部分：按钮、标签、提示、无障碍标注）。
 *
 * 内容型文案在 content/ 里；这里只放 UI 外壳。
 * 二者都用 { zh, en } 结构，t() 通吃 —— 方案原则 05「双语同构」。
 */

export const UI = {
  skipToContent: { zh: '跳到主要内容', en: 'Skip to main content' },
  menu: { zh: '菜单', en: 'Menu' },
  close: { zh: '关闭', en: 'Close' },
  searchLabel: { zh: '全站检索', en: 'Search site' },
  searchPlaceholder: { zh: '检索研究方向、论文、航次、站位…', en: 'Search research, papers, expeditions, stations…' },
  searchEmpty: { zh: '没有匹配的内容。试试「潜标」「内潮」「南海」。', en: 'No matches. Try “mooring”, “internal tides”, “SCS”.' },
  searchHint: { zh: '按内容类型分组显示', en: 'Grouped by content type' },
  langToggle: { zh: 'EN', en: '中文' },
  langToggleLabel: { zh: '切换到英文', en: 'Switch to Chinese' },
  sectionNav: { zh: '版块导航', en: 'Section navigation' },

  /** 内容类型名（检索结果分组标题） */
  kind: {
    research: { zh: '研究方向', en: 'Research' },
    publication: { zh: '论文', en: 'Publications' },
    expedition: { zh: '航次', en: 'Expeditions' },
    person: { zh: '成员', en: 'People' },
    dataset: { zh: '数据与模型', en: 'Data & models' },
    station: { zh: '观测站位', en: 'Stations' },
  },

  /** 图件与场景 */
  figureNote: { zh: '示意图', en: 'Schematic' },
  schematicCoastline: { zh: '示意图 · 简化岸线，非制图产品', en: 'Schematic · simplified coastline, not a cartographic product' },
  schematicField: { zh: '示意性解析模型 · 非实测数据', en: 'Schematic analytic model · not measured data' },
  timeScaleNote: { zh: '动画时间已加速', en: 'Animation time-accelerated' },
  reducedMotionNote: { zh: '已按系统设置关闭动效，显示静态流线', en: 'Motion reduced by system setting — showing static streamlines' },
  depthAxis: { zh: '水深', en: 'Depth' },
  distanceAxis: { zh: '断面距离', en: 'Distance along section' },
  velocityAxis: { zh: '纬向流速', en: 'Zonal velocity' },
  eastward: { zh: '东向 →', en: 'eastward →' },
  westward: { zh: '← 西向', en: '← westward' },
  reversalDepth: { zh: '流向反转深度', en: 'Flow reversal depth' },
  spreadBand: { zh: '阴影为示意离散度', en: 'Shading: schematic spread' },
  seafloor: { zh: '海底', en: 'Seafloor' },

  /** 交互 */
  filterAll: { zh: '全部', en: 'All' },
  filterYear: { zh: '年份', en: 'Year' },
  filterTopic: { zh: '研究方向', en: 'Topic' },
  filterRegion: { zh: '海域', en: 'Region' },
  resultCount: { zh: '条结果', en: 'results' },
  doiPending: { zh: 'DOI 待补充', en: 'DOI pending' },
  placeholderTag: { zh: '占位', en: 'Placeholder' },
  readMethod: { zh: '查看观测方法', en: 'View methods' },
  readData: { zh: '浏览相关数据', en: 'Browse data' },
  relatedItems: { zh: '关联内容', en: 'Related' },
  hoverProfile: { zh: '在剖面上移动指针读取流速', en: 'Move the pointer over the profile to read velocity' },
  selectStation: { zh: '选择站位查看详情', en: 'Select a station for details' },
  maxDepth: { zh: '最大水深', en: 'Max depth' },
  platformLabel: { zh: '观测平台', en: 'Platform' },
  variablesLabel: { zh: '观测变量', en: 'Variables' },
  instrumentsLabel: { zh: '仪器清单', en: 'Instruments' },
  stationsLabel: { zh: '站位', en: 'Stations' },

  /** 页脚 */
  footerNote: {
    zh: '本页为网站设计方案 v1.0 的首页体验原型。所有人员、论文、数据与联系方式须在上线前核验。',
    en: 'Prototype of the homepage experience for site design plan v1.0. All people, papers, data and contacts require verification before launch.',
  },
  footerSources: { zh: '资料快照日期 2026-08-19', en: 'Content snapshot 2026-08-19' },
};
