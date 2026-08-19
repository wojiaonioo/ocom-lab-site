# OCOM Lab 网站 · 上下文入口

海洋环流观测与数值模拟研究室独立网站。当前阶段：**首页 demo 原型**。

## 新会话必读顺序

1. 本文件（红线 + 当前状态）
2. `docs/PROGRESS.md` —— 上一段做到哪、下一步是什么
3. `docs/ARCHITECTURE.md` —— 层、目录、事件契约
4. 动代码前：`docs/REFERENCES-SWE.md` §快速判据卡

改任何结构前先看 `docs/DECISIONS.md`，里面记了已经吵完的问题，**不要重开**。

## 需求源

- `../_plan/海洋环流观测与数值模拟研究室_网站设计方案_v1.0.docx`（甲方方案，**最高优先级**）
- `../shopify-editions-3d-site/`（工程手法参考 skill，只借骨架不借视觉）

两者冲突时**方案 v1.0 优先**，并在 `docs/DECISIONS.md` 记一条 ADR。

## 红线

- **禁止**：高频自动轮播、鼠标跟随光斑、大面积 3D 海浪、强视差、全元素同时淡入（方案 §08 禁止项）
- **禁止**：无法说明变量/单位/来源的装饰性"科技感"线条。所有科研图形必须标注单位与变量
- **禁止**：`science/` `content/` 里出现 `document` `window` 等 DOM 全局（`tools/check-layers.mjs` 会拦）
- **禁止**：越级 import（依赖只能向下，见 ARCHITECTURE §1）
- **禁止**：编造真实人名、论文标题、DOI、联系方式。占位内容一律标 `PLACEHOLDER`，
  并在页面上有可见的 demo 提示条。人员与论文信息上线前须由研究室核验（方案 §11/§12）
- **禁止**：`export default`（静态依赖扫描需要具名导出）
- **禁止**：改动方案 §04 的七个品牌色令牌。浅底文字对比度不够时另立 `--c-*-ink` 变体
- **注意**：首屏与版块抬头文案在 `index.html` 与 `content/site.js` 各有一份，**改一处必须改两处**（ADR-008）

## 提交前必跑

```bash
node tools/check-layers.mjs     # 分层规则：越级 / 纯层碰 DOM / 循环依赖 / export default
node tools/check-contrast.mjs   # 色彩令牌对比度（WCAG AA 4.5:1）
python3 -m http.server 5173 -d public   # 本地预览（发布根是 public/）
```

浏览器验证请用 chrome-devtools 的 `emulate` 改视口，**不要用 `resize_page`**
（那会改真实浏览器窗口）；验证完必须把 viewport 传空串清除覆盖。

## 当前状态

见 `docs/PROGRESS.md` 末尾"下一步"。
