/**
 * 组合根 —— 全站唯一的装配处。
 *
 * 这是唯一允许 import 所有层的文件（docs/ARCHITECTURE.md §1 level 4）。
 * 其他任何模块都不得在这里之外互相装配。
 *
 * 启动顺序有依赖，不可随意调换：
 *   1. initLocale()    —— 先确定语言，后续所有 replay 订阅才能拿到值
 *   2. initScheduler() —— 定初始质量档并广播
 *   3. watchMotion()   —— 广播 reduced-motion，场景与 reveal 都靠它
 *   4. ui / scene      —— 消费上面三者的状态
 *   5. scroll 跟踪     —— 最后启动，此时 DOM 高度已稳定
 */

import { qs, qsa } from './core/dom.js';
import { initScheduler } from './core/raf.js';
import { watchMotion, supportsCanvas2D } from './core/env.js';
import { trackStageProgress, trackSections } from './core/scroll.js';

import { initLocale } from './i18n/locale.js';
import { selfCheck } from './content/index.js';

import { createTrenchScene } from './scenes/trench-scene.js';

import { initCopy } from './ui/copy.js';
import { initHeader } from './ui/header.js';
import { initStage } from './ui/stage.js';
import { initNavRail } from './ui/nav-rail.js';
import { initOverlays } from './ui/overlays.js';
import { initDiscovery } from './ui/discovery.js';
import { initResearch } from './ui/research.js';
import { initExpeditions } from './ui/expeditions.js';
import { initPublications } from './ui/publications.js';
import { initPeople } from './ui/people.js';
import { initReveal } from './ui/reveal.js';

const teardown = [];

function boot() {
  // 内容自检：方案 §10「构建阶段校验缺失字段」的运行时版本。
  // 静态站没有构建期，这里退而求其次在开发控制台报出来。
  const problems = selfCheck().filter((p) => p.level === 'error');
  if (problems.length) console.warn('[content] 自检未通过：', problems);

  initLocale();
  initScheduler();
  teardown.push(watchMotion());

  // UI 先于场景：场景挂载时要读到已就绪的 CSS 变量与初始场景状态
  teardown.push(initCopy());
  teardown.push(initHeader());
  teardown.push(initNavRail());
  teardown.push(initOverlays());
  teardown.push(initResearch());
  teardown.push(initExpeditions());
  teardown.push(initPublications());
  teardown.push(initPeople());
  teardown.push(initStage());
  teardown.push(initDiscovery());
  teardown.push(initReveal());

  const canvas = qs('#trench-canvas');
  if (canvas && supportsCanvas2D()) {
    const scene = createTrenchScene();
    if (scene.mount(canvas, qs('#scene-caption'))) {
      teardown.push(() => scene.destroy());
      // 验证脚本的抓手（docs/VERIFICATION.md 的 canvas 非空检查）
      window.__ocomScene = scene;
    }
  } else {
    // 降级第 3 层：无 Canvas 时移除画布并保留 HTML 内容
    canvas?.remove();
    document.documentElement.classList.add('no-canvas');
  }

  teardown.push(trackStageProgress(qs('#stage')));
  teardown.push(trackSections(qsa('main > section[id]')));

  document.documentElement.classList.add('is-booted');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// 热重载 / 调试用
window.__ocomTeardown = () => teardown.splice(0).forEach((fn) => fn?.());
