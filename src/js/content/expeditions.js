/**
 * 观测站位与航次。
 *
 * 方案 §07 明确：「观测航次详情页是本项目相对通用实验室模板最重要的新增资产」。
 * 因此站位/航次在数据模型里是一等公民，不是新闻的附属。
 *
 * ⚠ 站位**经纬度与水深量级为真实地理信息**；航次名称、日期、仪器清单为占位（ADR-005）。
 */

/** 观测站位。lat/lon 为十进制度，北纬东经为正。 */
export const STATIONS = [
  {
    id: 'challenger-deep',
    name: { zh: '挑战者深渊', en: 'Challenger Deep' },
    region: 'mariana',
    lat: 11.373,
    lon: 142.591,
    depthM: 10920,
    platform: 'mooring',
    variables: ['u', 'v', 'T', 'S', 'P'],
  },
  {
    id: 'yap-mariana',
    name: { zh: '雅浦—马里亚纳连接区', en: 'Yap–Mariana Junction' },
    region: 'yap-mariana',
    lat: 9.05,
    lon: 137.75,
    depthM: 8900,
    platform: 'mooring',
    variables: ['u', 'v', 'T', 'S'],
  },
  {
    id: 'mariana-north',
    name: { zh: '马里亚纳海沟北段', en: 'Northern Mariana Trench' },
    region: 'mariana',
    lat: 19.5,
    lon: 147.2,
    depthM: 8300,
    platform: 'ctd',
    variables: ['T', 'S', 'O2'],
  },
  {
    id: 'scs-basin',
    name: { zh: '南海深海盆', en: 'SCS deep basin' },
    region: 'scs-basin',
    lat: 17.8,
    lon: 116.2,
    depthM: 4300,
    platform: 'mooring',
    variables: ['u', 'v', 'T', 'S'],
  },
  {
    id: 'luzon-strait',
    name: { zh: '吕宋海峡', en: 'Luzon Strait' },
    region: 'luzon-strait',
    lat: 20.6,
    lon: 121.0,
    depthM: 2600,
    platform: 'mooring',
    variables: ['u', 'v', 'T'],
  },
  {
    id: 'philippine-basin',
    name: { zh: '菲律宾海盆', en: 'Philippine Basin' },
    region: 'philippine-basin',
    lat: 15.2,
    lon: 130.5,
    depthM: 5900,
    platform: 'glider',
    variables: ['T', 'S'],
  },
];

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]));

/** 观测海域。用于筛选与图例。 */
export const REGIONS = [
  { id: 'mariana', label: { zh: '马里亚纳海沟', en: 'Mariana Trench' } },
  { id: 'yap-mariana', label: { zh: '雅浦—马里亚纳连接区', en: 'Yap–Mariana Junction' } },
  { id: 'scs-basin', label: { zh: '南海', en: 'South China Sea' } },
  { id: 'philippine-basin', label: { zh: '菲律宾海', en: 'Philippine Sea' } },
  { id: 'luzon-strait', label: { zh: '吕宋海峡', en: 'Luzon Strait' } },
];

/** 观测平台类型，决定地图上的符号。 */
export const PLATFORMS = [
  { id: 'mooring', label: { zh: '深海潜标', en: 'Deep-sea mooring' }, symbol: 'square' },
  { id: 'ctd', label: { zh: 'CTD 剖面', en: 'CTD profile' }, symbol: 'circle' },
  { id: 'glider', label: { zh: '水下滑翔机', en: 'Underwater glider' }, symbol: 'triangle' },
];

/**
 * 航次。placeholder=true 的条目在上线前必须替换（方案 §12.1 上线签署项）。
 */
export const EXPEDITIONS = [
  {
    id: 'exp-hadal-2024',
    placeholder: true,
    name: { zh: '深渊环流潜标航次（占位）', en: 'Hadal circulation mooring cruise (placeholder)' },
    start: '2024-04-11',
    end: '2024-05-06',
    region: 'mariana',
    maxDepthM: 10920,
    platforms: ['mooring', 'ctd'],
    stations: ['challenger-deep', 'mariana-north'],
    instruments: {
      zh: ['深海潜标链 × 2', '全海深 CTD', '声学释放器', '海流计阵列'],
      en: ['Deep-sea mooring chain × 2', 'Full-depth CTD', 'Acoustic releasers', 'Current-meter array'],
    },
    summary: {
      zh: '在挑战者深渊完成潜标回收与重新布放，取得连续流速与温盐时间序列。',
      en: 'Recovered and redeployed moorings in the Challenger Deep, obtaining continuous velocity and T–S time series.',
    },
    topics: ['hadal-circulation', 'observing-system'],
  },
  {
    id: 'exp-junction-2023',
    placeholder: true,
    name: { zh: '雅浦—马里亚纳连接区观测航次（占位）', en: 'Yap–Mariana Junction survey (placeholder)' },
    start: '2023-09-02',
    end: '2023-09-28',
    region: 'yap-mariana',
    maxDepthM: 8900,
    platforms: ['mooring', 'ctd'],
    stations: ['yap-mariana'],
    instruments: {
      zh: ['深海潜标链 × 1', 'CTD 断面 12 站', '湍流剖面仪'],
      en: ['Deep-sea mooring × 1', '12-station CTD section', 'Turbulence profiler'],
    },
    summary: {
      zh: '沿连接区布设 CTD 断面，考察深层水交换路径。',
      en: 'CTD section across the junction to examine deep water-exchange pathways.',
    },
    topics: ['hadal-circulation', 'internal-tides'],
  },
  {
    id: 'exp-scs-2023',
    placeholder: true,
    name: { zh: '南海深层环流航次（占位）', en: 'SCS deep circulation cruise (placeholder)' },
    start: '2023-05-15',
    end: '2023-06-04',
    region: 'scs-basin',
    maxDepthM: 4300,
    platforms: ['mooring', 'glider'],
    stations: ['scs-basin', 'luzon-strait'],
    instruments: {
      zh: ['锚系阵列 × 4', '水下滑翔机 × 2', 'ADCP'],
      en: ['Mooring array × 4', 'Gliders × 2', 'ADCP'],
    },
    summary: {
      zh: '在南海深海盆与吕宋海峡布设锚系阵列，观测深层环流与涡旋过程。',
      en: 'Mooring array in the SCS deep basin and Luzon Strait observing deep circulation and eddy processes.',
    },
    topics: ['deep-basin'],
  },
];
