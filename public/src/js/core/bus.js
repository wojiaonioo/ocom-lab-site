/**
 * 极简事件总线 —— 跨层通信的唯一通道。
 *
 * secret：订阅表的存储方式与"最后一次载荷"的重放策略。
 *
 * 存在理由：ui/ 不许直接调 scenes/，scenes/ 也不知道 ui/ 存在。
 * 两边只认 EVENT 里的常量。契约表见 docs/ARCHITECTURE.md §3。
 *
 * latest() 让"晚挂载的订阅者"也能拿到当前状态，避免各模块自己缓存一份。
 */

/** 跨层事件名。禁止裸字符串；新增必须同步 ARCHITECTURE.md §3 的契约表。 */
export const EVENT = {
  /** 语言切换 → 'zh' | 'en' */
  LOCALE_CHANGE: 'locale:change',
  /** 首屏舞台滚动进度 → 0..1 */
  STAGE_PROGRESS: 'stage:progress',
  /** 场景状态（发现标签）→ 'circulation' | 'tides' | 'moorings' */
  SCENE_STATE: 'scene:state',
  /** 当前版块 → { id, theme } */
  SECTION_ACTIVE: 'section:active',
  /** 渲染质量档 → 'high' | 'medium' | 'low' */
  QUALITY_CHANGE: 'quality:change',
  /** 减少动态效果 → boolean */
  MOTION_CHANGE: 'motion:change',
};

const channels = new Map();
const lastPayload = new Map();

/**
 * 订阅事件。
 * @param {string} event EVENT 中的常量
 * @param {(payload:any) => void} handler
 * @param {{replay?: boolean}} [opts] replay=true 时立即用最后一次载荷回调一次
 * @returns {() => void} 取消订阅
 */
export function on(event, handler, opts = {}) {
  if (!channels.has(event)) channels.set(event, new Set());
  channels.get(event).add(handler);
  if (opts.replay && lastPayload.has(event)) handler(lastPayload.get(event));
  return () => {
    const set = channels.get(event);
    if (set) set.delete(handler);
  };
}

/**
 * 发布事件。单个订阅者抛错不影响其他订阅者 —— 对应 skill 的 Failure Model：
 * 任一模块失败只影响自己。
 */
export function emit(event, payload) {
  lastPayload.set(event, payload);
  const set = channels.get(event);
  if (!set) return;
  for (const handler of [...set]) {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[bus] ${event} 订阅者异常：`, err);
    }
  }
}

/** 读取某事件最后一次载荷；从未发布过返回 fallback。 */
export function latest(event, fallback = undefined) {
  return lastPayload.has(event) ? lastPayload.get(event) : fallback;
}
