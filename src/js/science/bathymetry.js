/**
 * 海沟纵剖面地形模型。
 *
 * secret：地形怎么参数化。外界只拿 depthAt(x) → 米。
 * 今天是解析式叠加，将来换成 GEBCO 实测采样时，scenes/ 一行不用改
 * —— 这正是 Parnas 分解 2 的意义（docs/REFERENCES-SWE.md 案例 1）。
 *
 * 剖面语义：一条横穿马里亚纳海沟（挑战者深渊附近）的东西向断面，
 * 由西侧太平洋深海平原经外缘隆起、海沟轴部，向东爬升至弧前与岛弧。
 *
 * ⚠ 这是**示意性解析剖面**，用于界面图形语言，不是实测测深产品。
 *   量级参照公开常识（深海平原约 5.8 km、挑战者深渊约 10.9 km），
 *   细部起伏为合成。任何科学用途须替换为实测数据。见 docs/SCIENCE-NOTES.md。
 */

import { gauss, smoothstep, clamp01 } from './math.js';

/** 断面元数据。x 为归一化横坐标 [0,1]，0 = 断面西端。 */
export const TRANSECT = {
  lengthKm: 240,
  axisX: 0.5,
  maxDepthM: 10920,
  plainDepthM: 5800,
  /**
   * 绘图时深度轴的下边界。
   * 比轴深多留约 900 m 余量：否则海沟 V 尖正好压在画布下边缘，
   * 首屏最关键的形态特征被裁掉一半（见 docs/VERIFICATION.md V-003）。
   */
  depthScaleM: 11800,
};

const TRENCH_AMP = 5120; // 5800 + 5120 = 10920 m
const TRENCH_HALF_WIDTH = 0.115; // 归一化，≈ 27.6 km

/** 轴部附近抑制小尺度起伏，保证轴深恰为 TRANSECT.maxDepthM。 */
const roughnessWindow = (x) => clamp01(1 - gauss(x, TRANSECT.axisX, 0.12));

function roughness(x) {
  return (90 * Math.sin(x * 38.0) + 55 * Math.sin(x * 17.0 + 1.2) + 32 * Math.sin(x * 61.0 + 2.6)) * roughnessWindow(x);
}

/**
 * 海底深度。
 * @param {number} x 归一化横坐标 [0,1]
 * @returns {number} 深度，单位 m，向下为正
 */
export function depthAt(x) {
  const t = Math.abs((x - TRANSECT.axisX) / TRENCH_HALF_WIDTH);

  let d = TRANSECT.plainDepthM;
  d -= 430 * gauss(x, 0.24, 0.055); // 外缘隆起（板块下弯前的上拱）
  d += TRENCH_AMP * Math.exp(-Math.pow(t, 1.35)); // 海沟 V 形轴部
  d -= 2400 * smoothstep(0.62, 1.02, x); // 弧前斜坡
  d -= 700 * gauss(x, 0.82, 0.035); // 弧前高地
  d += roughness(x);

  return d;
}

/** 海底坡度 dz/dx（归一化横坐标）。用于流场的地形跟随与坡面照明。 */
export function slopeAt(x, h = 0.0025) {
  return (depthAt(Math.min(1, x + h)) - depthAt(Math.max(0, x - h))) / (2 * h);
}

/** 给定点是否落在海底以下（粒子越界判定）。 */
export const isBelowSeafloor = (x, depthM) => depthM >= depthAt(x);

/**
 * 等间隔采样地形，供绘制填充路径。
 * @param {number} n 采样点数
 * @returns {Array<{x:number, depth:number}>}
 */
export function sampleTransect(n = 320) {
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = i / (n - 1);
    out[i] = { x, depth: depthAt(x) };
  }
  return out;
}

/** 地貌单元标注点，供图面加注记（方案 §04：科研图形必须可读出语义）。 */
export const FEATURES = [
  { id: 'plain', x: 0.13, label: { zh: '西太平洋深海平原', en: 'W. Pacific abyssal plain' } },
  { id: 'outer-rise', x: 0.24, label: { zh: '外缘隆起', en: 'Outer rise' } },
  { id: 'axis', x: 0.5, label: { zh: '海沟轴部', en: 'Trench axis' } },
  { id: 'forearc', x: 0.7, label: { zh: '弧前斜坡', en: 'Forearc slope' } },
  { id: 'high', x: 0.82, label: { zh: '弧前高地', en: 'Forearc high' } },
];

/** 横坐标 → 断面距离（km），用于底部距离轴。 */
export const kmAt = (x) => x * TRANSECT.lengthKm;
