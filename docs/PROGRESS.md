# 工作日志 · PROGRESS

倒序追加。每段记：**做了什么 / 为什么 / 遗留 / 下一步**。
新会话读完 `CLAUDE.md` 后直接看本文件末尾。

---

## 2026-08-19 · 段 1 —— 文档骨架与分层约束

**做了什么**
- 读完需求源：方案 v1.0（docx 全文）+ `shopify-editions-3d-site` skill 的 5 份 reference。
- 立 `docs/`：`REFERENCES-SWE.md`（6 个判据案例）、`ARCHITECTURE.md`（5 层 + 事件契约）、
  `DECISIONS.md`（ADR-001..006）、`CLAUDE.md`（上下文入口 + 红线）。
- 写 `tools/check-layers.mjs`：4 类检查（越级 / 纯层碰 DOM / 循环依赖 / export default），
  退出码驱动。分层规则从此是可执行约束，不是文档里的口号。

**为什么**
方案与 skill 在技术选型上直接冲突（Canvas vs WebGL、克制 vs 沉浸）。
先把裁决写成 ADR-001，后续不再反复讨论。分层则是为 ADR-001 留退路：
渲染技术是可替换的细节，`science/` `content/` 是内核。

**遗留**
- `docs/CONTENT-MODEL.md`、`docs/SCIENCE-NOTES.md`、`docs/GLOSSARY.md` 待随代码一起写。
- `docs/PLAN-TRACE.md` 追溯矩阵待逐模块回填。

**下一步**
按 level 由低到高实现：`core/` → `science/` → `content/` → `i18n/` → `scenes/` → `figures/` → `ui/` → `main.js`，
最后 `index.html` + 样式，再用 chrome-devtools MCP 做桌面/移动双端验证并留档到 `docs/VERIFICATION.md`。
