# 软件工程参考案例 · SWE Reference Cases

> 本文件是**判据来源**，不是读物清单。每条案例都必须回答同一个问题：
> **"这个模块该不该知道那个模块的存在？"**
> 凡是架构争论，回到本文件找对应案例，不要靠个人偏好。

各案例统一结构：`出处` / `核心主张` / `本项目怎么落` / `违反时长什么样`。

---

## 案例 1 · Parnas KWIC —— 模块的边界按"秘密"划，不按"步骤"划

**出处**　Parnas, D. L. (1972). *On the Criteria To Be Used in Decomposing Systems into Modules.*
Communications of the ACM, 15(12), 1053–1058.

**核心主张**
Parnas 对同一个 KWIC 索引程序给了两种分解：

| | 分解 1：按处理流程 | 分解 2：按信息隐藏 |
|---|---|---|
| 模块 | 读入 → 循环移位 → 排序 → 输出 | 行存储、循环移位器、字母排序器、输出器 |
| 每个模块知道 | 数据的**存储格式** | 只知道自己的**接口** |
| 改"行用数组存还是链表存" | 四个模块全改 | 一个模块内部改，外部无感 |

结论：**模块的划分依据是"它隐藏了哪个设计决策（secret）"，而不是"它在流程里排第几"。**
流程会变，格式和决策才是稳定的分界线。

**本项目怎么落**

- `science/bathymetry.js` 的 secret = **海沟地形怎么参数化**。外界只拿到 `depthAt(x) → m`。
  今天是解析式叠加，明天换成真实 GEBCO 采样，`scenes/` 一行不用改。
- `science/flow-field.js` 的 secret = **三层环流速度场怎么构造**。外界只拿 `velocityAt(x, z) → {u, w}`。
- `scenes/layers/particles.js` 的 secret = **粒子池怎么管理、轨迹怎么存**。外界只有 `update(dt)` / `draw(ctx)`。
- 反面示例（本项目**禁止**）：按渲染流程切成 `step1-clear.js` / `step2-draw.js` / `step3-label.js`。
  那是 Parnas 的分解 1，任何一次视觉调整都要横扫全部文件。

**违反时长什么样**
改一个数据格式，git diff 跨越 5 个以上文件，且这些文件名读起来像动词序列。

---

## 案例 2 · Lakos 物理设计与层级化（Levelization）

**出处**　Lakos, J. (1996). *Large-Scale C++ Software Design.* Addison-Wesley.

**核心主张**
"逻辑设计"（类、接口）和"**物理设计**"（文件、目录、编译单元的依赖图）是两件事，大型系统栽的跟头几乎都在后者。
Lakos 要求把组件依赖图做成 **DAG（有向无环图）**，并给每个组件分配 **level**：

- Level 0 = 不依赖本项目内任何其他组件
- Level N = 依赖的组件里最高 level 为 N−1

**只允许由高 level 指向低 level。**同 level 之间不许互相引用（否则就是隐藏的环）。
环状依赖的代价是致命的：不能单独测试、不能单独复用、不能增量理解——你必须一次性读懂整个环。

**本项目怎么落**

```
level 0   core/        —— 不 import 本项目任何其他目录
level 0   science/     —— 纯函数，不 import 任何目录（连 core 都不 import）
level 0   content/     —— 纯数据，不 import 任何目录
level 1   i18n/        —— 只可 import core
level 2   figures/     —— 只可 import core, science, content, i18n
level 2   scenes/      —— 只可 import core, science, i18n
level 3   ui/          —— 只可 import core, content, i18n, figures
level 4   main.js      —— 组合根，唯一允许 import 所有层的文件
```

`science/` 和 `content/` 被刻意放在 level 0 且**互不依赖**——它们是本项目最稳定的两块资产。
`tools/check-layers.mjs` 会静态扫描所有 `import` 语句，越级即退出码 1。

**违反时长什么样**
`science/flow-field.js` 里出现 `import { CANVAS_W } from '../core/env.js'`。
速度场是物理量，它凭什么知道画布多宽？——这是 level 0 向上偷看。

---

## 案例 3 · VS Code 源码分层 —— 把层规则写成 CI 检查

**出处**　microsoft/vscode，`src/vs/` 目录结构 + `build/lib/layersChecker.ts`。

**核心主张**
VS Code 是"大型前端项目分层"的现成教科书，它切了两个**正交**维度：

- **职责维度**：`base` → `platform` → `editor` → `workbench`（只能从右往左依赖）
- **运行环境维度**：`common`（无环境假设）→ `browser`（可用 DOM）/ `node`（可用 Node API）/ `electron-*`

关键在于 `common/` 里的代码**不允许**出现 `document`、`window`、`require('fs')`。
这条规则不是靠 code review 记住的，而是由构建期的 `layersChecker` 用 TypeScript AST 扫出来直接报错。

**本项目怎么落**

同样切两个正交维度：

| | 职责维度 | 环境维度 |
|---|---|---|
| 规则 | `core → science/content → figures/scenes → ui → main` | `science` / `content` 内**禁止**出现 `document` `window` `canvas` |
| 执行 | `tools/check-layers.mjs` 扫 import | 同一脚本扫 DOM 全局标识符 |

这保证 `science/*` 可以脱离浏览器直接跑单元测试、脱离本站被 Node 脚本复用（比如批量生成论文配图）。

**违反时长什么样**
想给 `science/profile.js` 写个测试，却发现必须先造一个 fake canvas。

---

## 案例 4 · Ousterhout 深模块 —— 接口窄、实现厚

**出处**　Ousterhout, J. (2018). *A Philosophy of Software Design.* 第 4 章 "Modules Should Be Deep"。

**核心主张**
模块的价值 = **功能量 ÷ 接口复杂度**。

- **深模块**：接口小、内部干的事多。例：Unix 文件 I/O 五个调用背后是缓存、调度、权限、设备驱动。
- **浅模块**：接口和实现一样宽，纯粹的成本转移。典型是只有 setter/getter 的"配置对象"、
  和把参数原样透传下去的一层 wrapper。

推论：**层数越多不一定越好**。每加一层都要问"这层隐藏了什么"，答不上来就是浅模块，应当删掉。

**本项目怎么落**

- `scenes/trench-scene.js` 对外接口只有 4 个：`mount(canvas)` / `setProgress(p)` / `setState(id)` / `destroy()`。
  背后是：水体渐变、等深线、粒子平流、地形遮挡、潜标、深度轴、内潮波束、随滚动下潜的深度窗口、
  DPR 适配、质量降级、reduced-motion 静态回退。**接口 4 个方法，实现 8 个图层。**
- `core/raf.js` 对外只有 `subscribe(fn) → unsubscribe`。背后是单一 rAF 循环、
  可见性暂停、帧率测量、连续掉帧后触发质量降级。
- 反面示例（本项目**禁止**）：`ui/card-title-renderer.js` 只干"把字符串塞进 h3"。
  这种浅模块直接内联回调用处。

**违反时长什么样**
新增一个图层，要同时改场景的 6 个公开方法。

---

## 案例 5 · Clean / Hexagonal —— 依赖方向永远指向稳定的一侧

**出处**
Cockburn, A. (2005). *Hexagonal Architecture (Ports and Adapters).*
Martin, R. C. (2017). *Clean Architecture.* —— The Dependency Rule。

**核心主张**
源码依赖只能**由外向内**：UI、数据库、Web 框架这些"可替换的细节"依赖内层业务规则，
内层**绝不**反向依赖。业务规则不知道自己是被 CLI 调的还是被 HTTP 调的。
配套的是 Martin 的包依赖三原则：

- **ADP**（无环）：包依赖图必须是 DAG。
- **SDP**（稳定依赖）：朝着更稳定的方向依赖。
- **SAP**（稳定抽象）：越稳定的包越应该抽象。

**本项目怎么落**

本站的"业务规则"是**科学内容**，不是渲染技术：

```
        [ 可替换的细节 ]                    [ 稳定的内核 ]
   Canvas 2D 渲染 ─┐
   SVG 图件      ─┼──→  figures/scenes  ──→  science/  ← 物理模型
   DOM 交互      ─┘         ui/         ──→  content/  ← 科研内容
```

今天用 Canvas 2D，明天换 WebGL/Three.js，`science/` 和 `content/` 零改动——
这正是方案 v1.0 §08 留的口子（"只有在科学表达确有必要时才引入 WebGL"）。
渲染技术是细节，海沟地形和三层环流是内核。

**违反时长什么样**
决定换渲染方案时，发现速度场公式写在了 `requestAnimationFrame` 回调里。

---

## 案例 6 · Big Ball of Mud —— 反面基线

**出处**　Foote, B. & Yoder, J. (1997). *Big Ball of Mud.* PLoP '97 / *Pattern Languages of Program Design 4*.

**核心主张**
论文承认："**迄今为止最常见的软件架构就是没有架构**"（a haphazardly structured, sprawling,
duct-tape-and-baling-wire, spaghetti-code jungle）。它不是嘲讽，而是解释了泥球为什么**总是赢**：
工期压力、程序员流动、需求碎片化，让每次"就先这样凑合一下"都是局部最优。

论文给的对抗手法不是"一次性设计对"，而是承认演化并加护栏：
**SHEARING LAYERS**（变化速率不同的东西分开放）、**SWEEPING IT UNDER THE RUG**（把混乱围起来别扩散）、
**RECONSTRUCTION**（该重写就重写）。

**本项目怎么落**

按**变化速率**分层（Shearing Layers 的直接应用）：

| 变化速率 | 归属 | 谁来改 |
|---|---|---|
| 几乎不变（物理规律） | `science/` | 开发 |
| 常变（论文、航次、成员） | `content/` | 科研人员，Markdown/数据文件 |
| 中等（视觉、交互） | `styles/`, `ui/` | 设计 + 开发 |
| 一次性（demo 占位内容） | 明确标注 `PLACEHOLDER` | 上线前清空 |

这正是方案 v1.0 原则 04「内容可维护——页面由结构化内容生成，不让更新依赖开发人员改代码」的实现路径：
**科研人员改 `content/` 永远不会碰到渲染代码。**

**违反时长什么样**
加一篇论文要动 `.js` 渲染逻辑。

---

## 快速判据卡（争论时按顺序问）

1. **这个模块隐藏了哪个会变的决策？** 答不上来 → 它不该是独立模块（Parnas / Ousterhout）
2. **它 import 的东西 level 比自己低吗？** 否 → 越级（Lakos）
3. **它出现 `document` / `window` 了吗？** 若它在 `science/` 或 `content/` → 违规（VS Code）
4. **接口方法数 vs 内部文件数，比值大于 1 吗？** 是 → 浅模块，考虑内联（Ousterhout）
5. **依赖方向是指向更稳定的一侧吗？** 否 → 依赖倒置（Clean/Hexagonal）
6. **这块东西的变化速率和邻居一致吗？** 否 → 该拆到别的层（Shearing Layers）

---

## 本项目未采用的经典（记录原因，避免反复讨论）

| 案例 | 未采用原因 |
|---|---|
| DDD 聚合根 / 仓储（Evans 2003） | 静态站无写模型、无事务边界，引入聚合根是纯开销。仅借用 **ubiquitous language**：见 `docs/GLOSSARY.md` |
| Redux / Flux 单一 store | 全站可变状态仅 6 项（语言、活动版块、导航主题、搜索、渲染质量、reduced-motion）。用 `core/bus.js` 够了，上 store 是浅模块 |
| 微前端 | 单团队、单部署目标，Conway's Law 不支持切分 |
| 组件框架（React/Vue） | 方案 v1.0 §10 要求"低 JavaScript 负担"、脚本失败时内容仍可读。原生 ESM + 渐进增强更契合 |
