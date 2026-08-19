/**
 * 科学量的显示格式。
 *
 * secret：单位符号、有效数字、经纬度分秒的写法。
 * 集中在这里，是为了保证同一个量在首屏、剖面图、地图、元数据表里写法完全一致
 * —— 方案 §03.1 品牌语气「中英文术语统一，同一概念不得多种译法」。
 *
 * 纯函数，不碰 DOM，可在 Node 下用于构建期校验。
 */

/** 上标负号用真正的减号 U+2212，避免和连字符混淆。 */
const MINUS = '−';

/** 深度：10920 → "10,920 m"。向下为正，不写负号。 */
export function formatDepth(meters, { unit = true } = {}) {
  const v = Math.round(meters).toLocaleString('en-US');
  return unit ? `${v} m` : v;
}

/** 深度（千米档）：10920 → "10.9 km"，用于紧凑标签。 */
export function formatDepthKm(meters, digits = 1) {
  return `${(meters / 1000).toFixed(digits)} km`;
}

/** 流速：0.135 → "0.135 m s⁻¹"；负值用真减号。东西向由 signed 决定是否带方向词。 */
export function formatSpeed(ms, { digits = 3, unit = true } = {}) {
  const abs = Math.abs(ms).toFixed(digits);
  const sign = ms < 0 ? MINUS : '';
  return unit ? `${sign}${abs} m s⁻¹` : `${sign}${abs}`;
}

/** 流向词。东向为正。 */
export function speedDirection(ms, locale = 'zh') {
  if (Math.abs(ms) < 1e-4) return locale === 'zh' ? '静止' : 'slack';
  const east = ms > 0;
  if (locale === 'zh') return east ? '东向' : '西向';
  return east ? 'eastward' : 'westward';
}

/** 单个坐标分量：11.373, 'lat' → "11°22.4′N"。 */
export function formatCoord(value, kind) {
  const hemi = kind === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${deg}°${min.toFixed(1)}′${hemi}`;
}

/** 站位坐标对："11°22.4′N, 142°35.4′E"。 */
export function formatLatLon(lat, lon) {
  return `${formatCoord(lat, 'lat')}, ${formatCoord(lon, 'lon')}`;
}

/** 距离：27.6 → "27.6 km"。 */
export function formatKm(km, digits = 0) {
  return `${km.toFixed(digits)} km`;
}

/** 时长：小时 → "12.42 h" / "8 d"。 */
export function formatDuration(hours, locale = 'zh') {
  if (hours < 48) return `${hours.toFixed(hours < 10 ? 2 : 0)} h`;
  const days = Math.round(hours / 24);
  return locale === 'zh' ? `${days} 天` : `${days} d`;
}

/** 日期区间："2023-04-11 — 2023-05-06"。输入为 ISO 字符串。 */
export function formatDateRange(startIso, endIso) {
  return endIso && endIso !== startIso ? `${startIso} — ${endIso}` : startIso;
}

/** 年份提取，供论文/航次筛选。 */
export const yearOf = (iso) => Number(String(iso).slice(0, 4));
