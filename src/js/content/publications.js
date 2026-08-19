/**
 * 论文条目。
 *
 * ⚠ ADR-005：全部为**占位示例**。标题由方案已公开的研究主题改写而成，
 *   作者一律不写真实姓名，**DOI 字段一律为 null**（schema.js 会拒绝占位条目携带 DOI）。
 *   上线前由科研人员按方案 §11 补齐 DOI、摘要图、标签与关联关系。
 *
 * 方案 §01 要求：「论文不只列题录，而是关联视觉摘要、海域、仪器、数据、模型和成员」。
 * 因此每条都带 topics / regions / stations / datasets / people 关联字段，
 * 关联索引在 content/index.js 里反向建立。
 */

export const PUBLICATIONS = [
  {
    id: 'pub-hadal-three-layer',
    placeholder: true,
    doi: null,
    year: 2025,
    venue: { zh: '示例期刊', en: 'Example Journal' },
    title: {
      zh: '世界最深深渊中的三层环流结构',
      en: 'Three-layer circulation structure in the world’s deepest trench',
    },
    oneLine: {
      zh: '超深水潜标观测揭示挑战者深渊内部存在流向反转的三层环流。',
      en: 'Ultra-deep mooring observations reveal a three-layer, direction-reversing circulation inside the Challenger Deep.',
    },
    topics: ['hadal-circulation'],
    regions: ['mariana'],
    stations: ['challenger-deep'],
    methods: { zh: ['潜标观测', '动力诊断'], en: ['Mooring observation', 'Dynamical diagnosis'] },
    abstractFigure: 'profile',
  },
  {
    id: 'pub-eddy-nio',
    placeholder: true,
    doi: null,
    year: 2025,
    venue: { zh: '示例期刊', en: 'Example Journal' },
    title: {
      zh: '气旋涡对近惯性波向深层输运的增强作用',
      en: 'Cyclonic eddy enhancement of downward near-inertial energy transport',
    },
    oneLine: {
      zh: '锚系阵列显示气旋涡显著提高近惯性能量向深层的穿透深度。',
      en: 'Mooring arrays show cyclonic eddies markedly deepen near-inertial energy penetration.',
    },
    topics: ['deep-basin'],
    regions: ['scs-basin'],
    stations: ['scs-basin'],
    methods: { zh: ['锚系阵列', '波数—频率谱分析'], en: ['Mooring array', 'Wavenumber–frequency spectra'] },
    abstractFigure: 'timeseries',
  },
  {
    id: 'pub-tidal-beam',
    placeholder: true,
    doi: null,
    year: 2024,
    venue: { zh: '示例期刊', en: 'Example Journal' },
    title: {
      zh: '海沟陡坡内潮生成与波束上传的观测证据',
      en: 'Observational evidence of internal-tide generation and upward beam propagation at a trench slope',
    },
    oneLine: {
      zh: '流速与温盐时间序列刻画出沿特征线上传的 M2 内潮波束。',
      en: 'Velocity and T–S time series delineate an M2 internal-tide beam propagating along characteristics.',
    },
    topics: ['internal-tides'],
    regions: ['mariana', 'yap-mariana'],
    stations: ['yap-mariana'],
    methods: { zh: ['调和分析', '能量通量估算'], en: ['Harmonic analysis', 'Energy flux estimation'] },
    abstractFigure: 'beam',
  },
  {
    id: 'pub-mixing-rate',
    placeholder: true,
    doi: null,
    year: 2024,
    venue: { zh: '示例期刊', en: 'Example Journal' },
    title: {
      zh: '深渊地形上方的湍流混合率分布',
      en: 'Distribution of turbulent mixing rates above hadal topography',
    },
    oneLine: {
      zh: '粗糙地形上方的混合率较开阔大洋高出一至两个量级。',
      en: 'Mixing rates above rough topography exceed open-ocean values by one to two orders of magnitude.',
    },
    topics: ['internal-tides', 'hadal-circulation'],
    regions: ['mariana'],
    stations: ['challenger-deep', 'mariana-north'],
    methods: { zh: ['湍流剖面仪', '细尺度参数化'], en: ['Turbulence profiler', 'Finescale parameterization'] },
    abstractFigure: 'profile',
  },
  {
    id: 'pub-scs-deep',
    placeholder: true,
    doi: null,
    year: 2023,
    venue: { zh: '示例期刊', en: 'Example Journal' },
    title: {
      zh: '南海深层环流的季节内变率',
      en: 'Intraseasonal variability of the South China Sea deep circulation',
    },
    oneLine: {
      zh: '深层流速存在显著的季节内振荡，与吕宋海峡溢流事件相关。',
      en: 'Deep currents show pronounced intraseasonal oscillation linked to Luzon Strait overflow events.',
    },
    topics: ['deep-basin'],
    regions: ['scs-basin', 'luzon-strait'],
    stations: ['scs-basin', 'luzon-strait'],
    methods: { zh: ['长期锚系', '区域模式'], en: ['Long-term moorings', 'Regional model'] },
    abstractFigure: 'timeseries',
  },
  {
    id: 'pub-mooring-tech',
    placeholder: true,
    doi: null,
    year: 2023,
    venue: { zh: '示例期刊', en: 'Example Journal' },
    title: {
      zh: '万米级深海潜标系统的设计与长期布放实践',
      en: 'Design and sustained deployment of a full-ocean-depth mooring system',
    },
    oneLine: {
      zh: '面向深渊环境的潜标链设计、耐压方案与数据回传链路。',
      en: 'Mooring-chain design, pressure housing and data-return path for hadal environments.',
    },
    topics: ['observing-system'],
    regions: ['mariana'],
    stations: ['challenger-deep'],
    methods: { zh: ['工程设计', '现场试验'], en: ['Engineering design', 'Field trials'] },
    abstractFigure: 'mooring',
  },
  {
    id: 'pub-water-mass',
    placeholder: true,
    doi: null,
    year: 2022,
    venue: { zh: '示例期刊', en: 'Example Journal' },
    title: {
      zh: '深渊与大洋之间的水团交换路径',
      en: 'Water-mass exchange pathways between the hadal zone and the open ocean',
    },
    oneLine: {
      zh: 'CTD 断面刻画出经连接区进入海沟的深层水路径。',
      en: 'CTD sections delineate deep-water pathways entering the trench through the junction.',
    },
    topics: ['hadal-circulation'],
    regions: ['yap-mariana', 'philippine-basin'],
    stations: ['yap-mariana', 'philippine-basin'],
    methods: { zh: ['CTD 断面', '水团分析'], en: ['CTD sections', 'Water-mass analysis'] },
    abstractFigure: 'section',
  },
  {
    id: 'pub-model-validation',
    placeholder: true,
    doi: null,
    year: 2022,
    venue: { zh: '示例期刊', en: 'Example Journal' },
    title: {
      zh: '区域高分辨率模式对深层环流的再现能力评估',
      en: 'Assessing a high-resolution regional model’s skill in reproducing deep circulation',
    },
    oneLine: {
      zh: '以潜标观测为基准检验模式在深层的流速与温盐结构。',
      en: 'Model deep-layer velocity and T–S structure evaluated against mooring observations.',
    },
    topics: ['deep-basin', 'hadal-circulation'],
    regions: ['scs-basin', 'philippine-basin'],
    stations: ['scs-basin', 'philippine-basin'],
    methods: { zh: ['ROMS / HYCOM', '观测—模式比对'], en: ['ROMS / HYCOM', 'Obs–model comparison'] },
    abstractFigure: 'section',
  },
];

/** 可选筛选维度（方案 §05：论文可按年份、研究方向、海域筛选）。 */
export const PUB_YEARS = [...new Set(PUBLICATIONS.map((p) => p.year))].sort((a, b) => b - a);
