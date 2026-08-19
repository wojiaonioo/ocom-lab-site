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

---

## 2026-08-19 · 段 2 —— 全站落地 + 三轮浏览器验证

**做了什么**
- 按 level 由低到高实现全部 48 个模块：`core` → `science` → `content` → `i18n` →
  `scenes`（8 图层）→ `figures`（4 件）→ `ui`（11 个）→ `main.js`，加 12 个 CSS 分层文件与 `index.html`。
- 三轮浏览器验证，共修 13 个缺陷，全部留档在 `VERIFICATION.md` V-003 / V-004 / V-005。
- 新增第二个执行器 `tools/check-contrast.mjs`（对比度契约），与分层检查同样的退出码驱动。
- 补 `PLAN-TRACE.md` 追溯矩阵，逐条对齐方案 v1.0。

**关键教训（都写进了代码注释与文档）**
1. **lint 自身必须被验证**。`check-layers` 的越级检查最初静默失效（`strip()` 把
   import 路径连同字符串一起清空）。故意注入四类违规逐一验证才发现。
2. **对比度要算，不能看**。用户指出深色字压深色底后，逐元素审计出 **95 处**不达标，
   根因是 `.band` / `.band-dark` 同特异性覆盖 + 四个令牌本身不达 AA。
3. **画布要采样，不能截图看**。岩体 `[6,25,36]` 对水体 `[5,40,58]` —— 截图上"看着还行"，
   采样才知道只差一个蓝通道，海沟轮廓根本读不出来。
4. **改视口用 `emulate`，不要用 `resize_page`** —— 后者会改用户真实浏览器窗口。

**遗留**
见 `PLAN-TRACE.md` 末尾「缺口汇总」六项。最紧的是方案 §12.1 指定第一阶段的
两个内页（观测航次详情、研究方向详情）尚未建。

**下一步**
1. 建观测航次详情页与研究方向详情页（数据模型已就位，只缺页面与路由）。
2. 迁 Astro：消除 ADR-008 的文案双份，补 hreflang / sitemap。
3. 把两个 check 脚本接进 CI。


---

## 2026-08-19 · 段 3 —— 上线

**做了什么**
- GitHub 私有仓库 `wojiaonioo/ocom-lab-site` → CF Pages → `ocom.114451.xyz`，全程免 VPS 免备案。
- 拆出 `public/` 作为显式发布根，`docs/` `tools/` `CLAUDE.md` 留在仓库不发布。

**关键教训**
1. **CF Pages 里静态文件优先于 `_redirects`**。想用 404 规则屏蔽已存在的文件是无效的，
   "哪些文件对外可见"只能由**目录边界**决定，不能靠路由规则补救。
2. **验证屏蔽要看响应体，不是状态码**。边缘缓存 HIT + `/*` 兜底规则，
   两者叠加会让人误判成"改了没生效"。
3. 大陆可访问性的关键不是"套 CF"，而是**自有域名**：`*.pages.dev` 与 `*.github.io` 同样不稳。

**下一步**
仍是 `PLAN-TRACE.md` 的缺口汇总，优先两个内页（观测航次详情、研究方向详情）。
