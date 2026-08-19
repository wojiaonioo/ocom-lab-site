/**
 * 场景图层契约 + 帧对象构造。
 *
 * secret：域坐标（归一化 x、深度 m）与画布坐标之间的映射，以及"下潜"窗口怎么插值。
 *
 * 所有图层只认 Frame，不认画布尺寸、不认滚动、不认 DPR。
 * 新增图层只需实现 { id, draw(frame) }，其余可选。这是 Ousterhout 意义上的窄接口。
 */

import { smoothstep, lerp } from '../science/math.js';
import { TRANSECT } from '../science/bathymetry.js';

/**
 * @typedef {object} Frame
 * @property {CanvasRenderingContext2D} ctx
 * @property {number} w  画布宽（CSS 像素）
 * @property {number} h  画布高（CSS 像素）
 * @property {number} dt 上一帧间隔（墙钟秒）
 * @property {number} time 海洋时间（秒），已按 TIME_SCALE 放大
 * @property {number} oceanDt 本帧的海洋时间步长（秒）= dt × TIME_SCALE
 * @property {number} progress 下潜进度 0..1
 * @property {{top:number, bottom:number}} depthWindow 当前可见深度范围（m）
 * @property {{left:number, right:number}} xWindow 当前可见归一化横坐标范围
 * @property {(x:number) => number} sx 归一化 x → 画布 x
 * @property {(z:number) => number} sy 深度 m → 画布 y
 * @property {(px:number) => number} ix 画布 x → 归一化 x
 * @property {(py:number) => number} iz 画布 y → 深度 m
 * @property {number} pxPerMeterY 每米深度对应的画布像素
 * @property {'circulation'|'tides'|'moorings'} mode
 * @property {'high'|'medium'|'low'} quality
 * @property {boolean} reducedMotion
 * @property {boolean} narrow 窄屏
 * @property {Record<string,string>} color 调色板
 * @property {(entry:any) => string} t 双语取值
 */

/**
 * @typedef {object} SceneLayer
 * @property {string} id
 * @property {(frame: Frame) => void} draw 必需
 * @property {(dt:number, frame: Frame) => void} [update] 有内部状态的图层实现（粒子池）
 * @property {(quality:string) => void} [setQuality]
 * @property {() => void} [dispose]
 */

/**
 * 动画时间放大倍数。
 *
 * 真实流速 0.135 m s⁻¹ 走完 240 km 断面约需 20 天，按真实时间平流画面完全静止。
 * 这是**渲染层的加速，不改变物理量**：science/ 收到的 time 仍是海洋时间秒，
 * M2 周期等常数保持真实。页面上必须标注倍数（方案 §04「不做无语义装饰」）。
 *
 * 取 1.6×10⁴：1 秒墙钟 ≈ 4.4 小时海洋时间；
 * 粒子 10 秒移动约 9% 断面宽度（缓慢平流感），M2 内潮周期约 2.8 秒（可辨识的脉动）。
 */
export const TIME_SCALE = 16000;

/** 加速倍数的显示文本。 */
export const TIME_SCALE_LABEL = {
  zh: `动画加速 ×1.6×10⁴（1 秒 ≈ 4.4 小时）`,
  en: `Time-accelerated ×1.6×10⁴ (1 s ≈ 4.4 h)`,
};

/** 下潜起止的视窗。progress=0 看全水柱，progress=1 收敛到深渊段并横向放大到轴部。 */
const VIEW_START = { top: 0, bottom: TRANSECT.depthScaleM, left: 0, right: 1 };
const VIEW_END = { top: 5400, bottom: 11250, left: 0.28, right: 0.72 };

/** 窄屏不做横向放大，否则海沟 V 形被裁得只剩一条缝。 */
const VIEW_END_NARROW = { top: 4200, bottom: 11250, left: 0.16, right: 0.84 };

/**
 * 画布字体栈。随帧对象下发，图层不各自硬编码。
 * 等宽字体承担全部科学量（水深、经纬度、流速、年份）—— 方案 §04 排版规范。
 */
const FONT = {
  mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  sans: '"IBM Plex Sans", "Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", system-ui, sans-serif',
};

/**
 * 构造帧对象。每帧调用一次，图层不缓存其中任何函数。
 * @returns {Frame}
 */
export function createFrame(ctx, opts) {
  const { w, h, dt, time, progress, mode, quality, reducedMotion, narrow, color, t } = opts;

  // 用 smoothstep 而非线性：下潜在起止处减速，滚动手感不生硬
  const p = smoothstep(0, 1, progress);
  const end = narrow ? VIEW_END_NARROW : VIEW_END;

  const depthWindow = {
    top: lerp(VIEW_START.top, end.top, p),
    bottom: lerp(VIEW_START.bottom, end.bottom, p),
  };
  const xWindow = {
    left: lerp(VIEW_START.left, end.left, p),
    right: lerp(VIEW_START.right, end.right, p),
  };

  const zSpan = depthWindow.bottom - depthWindow.top;
  const xSpan = xWindow.right - xWindow.left;

  return {
    ctx,
    w,
    h,
    dt,
    time,
    oceanDt: dt * TIME_SCALE,
    progress: p,
    depthWindow,
    xWindow,
    sx: (x) => ((x - xWindow.left) / xSpan) * w,
    sy: (z) => ((z - depthWindow.top) / zSpan) * h,
    ix: (px) => xWindow.left + (px / w) * xSpan,
    iz: (py) => depthWindow.top + (py / h) * zSpan,
    pxPerMeterY: h / zSpan,
    mode,
    quality,
    reducedMotion,
    narrow,
    color,
    font: FONT,
    t,
  };
}
