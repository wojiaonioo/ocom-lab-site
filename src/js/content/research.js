/**
 * 四大研究方向。内容依据方案 §01「研究内容提炼」与附录 A.1「研究方向卡片」。
 *
 * motif 字段指定该方向在界面上的视觉母题（方案 §04：固定母题 = 等深线 / 流场粒子 /
 * 水柱剖面 / 经纬度与深度刻度），由 figures/ 消费，content/ 只负责声明。
 */

export const RESEARCH = [
  {
    id: 'hadal-circulation',
    order: 1,
    motif: 'trench-section',
    title: { zh: '深海与深渊环流', en: 'Deep-sea & hadal circulation' },
    question: {
      zh: '万米深渊内部的水如何流动，又如何与大洋交换？',
      en: 'How does water circulate inside the hadal trench, and how does it exchange with the open ocean?',
    },
    summary: {
      zh: '研究深海沟内部环流、水团交换及其与大洋环流的动力联系。',
      en: 'Circulation within deep trenches, water-mass exchange, and its dynamical link to the open-ocean circulation.',
    },
    regions: ['mariana', 'yap-mariana'],
    methods: {
      zh: ['超深水潜标长期观测', '深渊 CTD 剖面', '动力诊断与理想化模型'],
      en: ['Ultra-deep long-term moorings', 'Hadal CTD profiling', 'Dynamical diagnosis and idealized modeling'],
    },
    findings: {
      zh: '在挑战者深渊观测到分层的环流结构，各层流向发生反转。',
      en: 'A layered circulation structure with reversing flow directions observed in the Challenger Deep.',
    },
  },
  {
    id: 'internal-tides',
    order: 2,
    motif: 'tidal-beam',
    title: { zh: '内潮与垂向混合', en: 'Internal tides & vertical mixing' },
    question: {
      zh: '内潮在复杂深渊地形上如何生成、传播并最终耗散？',
      en: 'How are internal tides generated, propagated and dissipated over complex hadal topography?',
    },
    summary: {
      zh: '解析内潮在复杂深渊地形中的生成、传播、耗散与混合效应。',
      en: 'Generation, propagation, dissipation and mixing effects of internal tides over rough hadal topography.',
    },
    regions: ['mariana', 'luzon-strait'],
    methods: {
      zh: ['潜标流速与温盐时间序列', '能量通量与耗散率估算', '波束射线追踪'],
      en: ['Mooring velocity and T–S time series', 'Energy flux and dissipation estimates', 'Beam ray tracing'],
    },
    findings: {
      zh: '陡峭斜坡处生成的内潮波束沿特征线向上传播，是深层混合的重要能量来源。',
      en: 'Internal-tide beams generated at steep slopes propagate upward along characteristics, supplying deep mixing.',
    },
  },
  {
    id: 'deep-basin',
    order: 3,
    motif: 'eddy-field',
    title: { zh: '深层海盆与中尺度过程', en: 'Deep basins & mesoscale processes' },
    question: {
      zh: '边缘海与深层海盆的环流如何被涡旋和高频运动调制？',
      en: 'How is circulation in marginal seas and deep basins modulated by eddies and high-frequency motions?',
    },
    summary: {
      zh: '研究南海、菲律宾海及西北太平洋深层环流、涡旋和高频运动。',
      en: 'Deep circulation, eddies and high-frequency motions in the South China Sea, Philippine Sea and NW Pacific.',
    },
    regions: ['scs-basin', 'philippine-basin', 'luzon-strait'],
    methods: {
      zh: ['锚系阵列', '卫星高度计与再分析产品', '区域模式试验'],
      en: ['Mooring arrays', 'Satellite altimetry and reanalysis', 'Regional model experiments'],
    },
    findings: {
      zh: '气旋涡可显著增强近惯性波向深层的能量输运。',
      en: 'Cyclonic eddies markedly enhance downward near-inertial energy transport.',
    },
  },
  {
    id: 'observing-system',
    order: 4,
    motif: 'mooring-chain',
    title: { zh: '海洋观测系统', en: 'Ocean observing systems' },
    question: {
      zh: '如何在万米水深实现长期、连续、可回收的观测？',
      en: 'How can sustained, continuous and recoverable observation be achieved at full-ocean depth?',
    },
    summary: {
      zh: '发展深海潜标、声学通信与长期连续观测能力。',
      en: 'Developing deep-sea moorings, acoustic communication and sustained observing capability.',
    },
    regions: ['mariana', 'scs-basin'],
    methods: {
      zh: ['潜标链设计与布放回收', '水声数据传输', '仪器耐压与长期稳定性试验'],
      en: ['Mooring design, deployment and recovery', 'Underwater acoustic data transfer', 'Pressure and long-term stability testing'],
    },
    findings: {
      zh: '形成可在深渊环境下长期驻留并实现数据回传的观测链路。',
      en: 'An observing chain capable of long-term hadal residence with data return.',
    },
  },
];

export const RESEARCH_BY_ID = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));
