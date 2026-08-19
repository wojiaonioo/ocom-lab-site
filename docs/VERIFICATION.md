# 验证记录 · VERIFICATION

倒序追加。**只记实际跑过的结果**，不记预期。命令要能被下一个人原样复现。

---

## V-002 · 内容层校验（2026-08-19）

```bash
node --input-type=module -e "import { selfCheck, related, search } from './src/js/content/index.js'; ..."
```

| 项 | 结果 |
|---|---|
| `selfCheck()` 必填字段 / id 重复 / 双语完整性 / 占位条目携带 DOI | **error=0, warn=0** |
| 反向关联索引 · `research/internal-tides` | expedition 1 · publication 2 · person 2 ✓ |
| 反向关联索引 · `station/challenger-deep` | expedition 1 · publication 3 · dataset 1 ✓ |
| 中文检索「潜标」 | 命中 5 类内容，按类型分组 ✓ |
| 英文检索「mooring」 | 命中 5 类内容 ✓ |

结论：单向声明 + 反向自动建边可用，双语索引可用。ADR-005 的占位约束由 schema 强制生效。

---

## V-001 · 分层检查器自测（2026-08-19）

**动机**：lint 若不能拦住违规就是装饰。故意注入四类违规逐一验证。

### 首次自测发现 checker 自身有 bug

`strip()` 把字符串字面量清空后再提取 import，导致 `'../core/dom.js'` 变成空串、
正则 `[^'"]+` 匹配不到 —— **越级检查静默失效，报告"全部通过"**。

第二个 bug：`export … from` 的正则用 `[\s\S]*?` 跨语句，
把文件开头的 `export const …` 一路吃到后面某个 import 的 `from`，同一处违规报两次且行号错误。

**修复**
- 拆成 `stripComments()`（保留字符串，供提取 import）与 `blankStrings()`（供扫标识符），
  剥离时用等长空白替换以保持行号。
- import 正则改用 tempered greedy token `(?:(?!\b(?:import|export)\b)[^'";])*?`，
  禁止跨越下一个 import/export 关键字或分号；并按 `行号:说明符` 去重。

### 修复后逐类验证

```bash
node tools/check-layers.mjs
```

| 用例 | 注入内容 | 结果 |
|---|---|---|
| A 基线 | 无 | `✓ 扫描 20 个文件 … 全部通过`，exit=0 |
| B 越级依赖 | `science/math.js` import `core/dom.js` | `science(L0) → core(L0) 越级；science 只可依赖 [无]`，exit=1 |
| C 循环依赖 | `math.js` ↔ `bathymetry.js` | 打印完整环路径 `bathymetry → math → bathymetry`，exit=1 |
| D 外部依赖 | `scenes/` import `'three'` | `禁止外部依赖 "three"（本项目零运行时依赖）`，exit=1 |
| E 纯层碰 DOM | `science/` 使用 `document` | `science/ 是纯层，禁止使用浏览器全局 "document"`，exit=1 |
| F 导出风格 | `export default 1` | `禁止 export default，请用具名导出`，exit=1 |
| G 还原 | 撤销全部注入 | `✓ … 全部通过`，exit=0 |

结论：四类检查均可拦截，无重复报告，行号准确。

---

## V-000 · science 层数值校验（2026-08-19）

`science/` 为纯层，直接用 Node 跑（ADR-002 的直接收益，无需浏览器）。
完整基线表见 [`SCIENCE-NOTES.md`](./SCIENCE-NOTES.md)，此处只记发现的问题与处置。

| 发现 | 处置 |
|---|---|
| 外缘隆起（原 x=0.30）被海沟侧翼淹没，未形成局部浅点 | 移到 x=0.24 并加大到 430 m。复测局部浅点 5,570 m @ x=0.237，较平原浅 230 m ✓ |
| 深渊层峰值落在 10,645 m（近底）而非层核心 | 层权重取消归一化。复测峰值 +0.041 m s⁻¹ @ 8,585 m，与设定核心 8,600 m 吻合 ✓ |
| 内潮模态半周期未反相 | 系测点选错（x=0.45 不在波束上）。改在 x=0.30, z=4,760 m 复测：−0.0108 → −0.0885 m s⁻¹，围绕背景流 −0.0491 振荡 ✓ |

同时确认：轴深 10,913 m（标称 10,920）、贴底流速衰减至 0.002 m s⁻¹、海底以下恒为 0、
断面两端收敛、三层零交叉位于 1,643 m 与 6,275 m。
