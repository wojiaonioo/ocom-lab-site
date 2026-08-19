/**
 * 地图投影。
 *
 * secret：用哪种投影、如何适配画布纵横比。
 * 外界只拿 project(lon, lat) → { x, y }（画布坐标）。
 *
 * 当前为等距圆柱（Plate Carrée）+ 中央纬度余弦校正，够西太平洋这个小范围用。
 * 若后续换 MapLibre（ADR-006），只有本文件与 figures/station-map.js 需要改。
 */

/** 站位图的地理范围：南海 — 菲律宾海 — 马里亚纳。 */
export const BOUNDS = { west: 105, east: 150, south: 2, north: 28 };

/**
 * 构造投影器。
 * @param {{west:number,east:number,south:number,north:number}} bounds
 * @param {number} width 画布宽（用户单位）
 * @param {number} height 画布高
 */
export function makeProjection(bounds, width, height) {
  const { west, east, south, north } = bounds;
  const lat0 = ((north + south) / 2) * (Math.PI / 180);
  const kx = Math.cos(lat0); // 中央纬度处的经度压缩

  const spanX = (east - west) * kx;
  const spanY = north - south;

  // 保持纵横比，居中留白
  const scale = Math.min(width / spanX, height / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const project = (lon, lat) => ({
    x: offsetX + (lon - west) * kx * scale,
    y: offsetY + (north - lat) * scale,
  });

  const unproject = (x, y) => ({
    lon: west + (x - offsetX) / (kx * scale),
    lat: north - (y - offsetY) / scale,
  });

  return { project, unproject, scale, bounds };
}

/** 折线批量投影，返回 SVG path 的 d 字符串。 */
export function pathOf(projection, coords, close = false) {
  if (!coords.length) return '';
  const d = coords
    .map(([lat, lon], i) => {
      const p = projection.project(lon, lat);
      return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(' ');
  return close ? `${d} Z` : d;
}

/** 经纬网刻度值。 */
export function graticule(bounds, stepLon = 10, stepLat = 5) {
  const lons = [];
  const lats = [];
  for (let lon = Math.ceil(bounds.west / stepLon) * stepLon; lon <= bounds.east; lon += stepLon) lons.push(lon);
  for (let lat = Math.ceil(bounds.south / stepLat) * stepLat; lat <= bounds.north; lat += stepLat) lats.push(lat);
  return { lons, lats };
}
