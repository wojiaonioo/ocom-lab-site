# 架构 · ARCHITECTURE

判据来源见 [`REFERENCES-SWE.md`](./REFERENCES-SWE.md)。本文件只写**本项目的具体规则**。

---

## 1. 分层与依赖方向

依赖**只能向下**。同层之间不得互相 import（同层互引 = 隐藏的环）。

```
level 4   main.js                组合根：唯一装配处，允许 import 全部
             │
level 3   ui/                    交互组件（DOM）        ← core science content i18n figures
             │
level 2   scenes/  figures/      渲染层（Canvas / SVG） ← core science content i18n
             │
level 1   i18n/                  语言状态 + 文案        ← core
             │
level 0   core/    science/    content/
          基础设施   物理模型      科研内容
          (可用 DOM) (纯函数)     (纯数据)
```

**level 0 三者互不依赖。** `science/` 与 `content/` 连 `core/` 都不 import。

### 各层的 secret（Parnas 判据）

| 层 | 它隐藏了什么 | 对外暴露 |
|---|---|---|
| `core/` | 事件分发、rAF 调度、能力探测、滚动观测的实现 | `bus` `raf` `env` `scroll` `dom` |
| `science/` | 地形/流场/剖面/投影**怎么算** | 纯函数：`depthAt` `velocityAt` `profileAt` `project` |
| `content/` | 内容存放形式（今天 JS 对象，明天 MDX/JSON） | `repo.research` `repo.publications` … + 关联索引 |
| `i18n/` | 语言持久化与广播 | `t(entry)` `getLocale()` `setLocale()` |
| `scenes/` | 图层组合、粒子池、质量降级、DPR | `mount` `setProgress` `setState` `destroy` |
| `figures/` | SVG 的构造细节 | `render(host, data) → cleanup` |
| `ui/` | DOM 事件绑定与状态同步 | `init(root) → cleanup` |

### 环境维度（VS Code 判据）

`science/` 和 `content/` 内**禁止**出现：`document` `window` `navigator` `canvas` `localStorage`。
目的：这两层能脱离浏览器被 Node 直接跑（单测、批量出图、构建期校验）。

### 强制手段

```bash
node tools/check-layers.mjs      # 越级 import / level0 里的 DOM 全局 → 退出码 1
```

不是靠 code review 记住，是靠脚本。提交前必跑，见 `docs/PROGRESS.md` 的工作流。

---

## 2. 目录

```
site/
├── CLAUDE.md                    # 上下文入口：任何会话先读这个
├── index.html                   # 唯一 HTML，内容骨架（无 JS 也可读）
├── tools/check-layers.mjs       # 分层规则的执行者
├── docs/                        # 见 §4
└── src/
    ├── styles/
    │   ├── tokens.css           # 设计令牌：色彩/字体/间距/层级的唯一来源
    │   ├── base.css             # reset + 元素基线 + a11y
    │   ├── layout.css           # 栅格、全幅 band、sticky stage
    │   ├── components/          # 跨版块复用：header nav-rail card chip figure overlay
    │   └── sections/            # 单版块专属：stage discovery research …
    └── js/
        ├── main.js              # 组合根
        ├── core/                # bus env raf scroll dom
        ├── science/             # math bathymetry flow-field profile projection format
        ├── content/             # schema site research expeditions publications people index
        ├── i18n/                # locale strings
        ├── scenes/              # scene-contract palette trench-scene
        │   └── layers/          # water-column isobaths tidal-beams streamlines
        │                        # particles terrain moorings annotations depth-axis
        ├── figures/             # velocity-profile station-map visual-abstract
        └── ui/                  # header nav-rail overlays discovery research
                                 # expeditions publications people reveal
```

CSS 同样分层：`tokens → base → layout → components → sections`，后者可用前者的变量，反之不行。

---

## 3. 跨层通信：只走 `core/bus.js`

`ui/` 不直接调用 `scenes/`，`scenes/` 也不知道 `ui/` 存在。两边只认事件名。

| 事件 | 发布者 | 订阅者 | 载荷 |
|---|---|---|---|
| `locale:change` | `i18n/locale`（由 `ui/header` 触发） | 所有渲染层 | `'zh' \| 'en'` |
| `stage:progress` | `core/scroll` | `scenes/trench-scene` | `0..1` |
| `scene:state` | `ui/discovery` | `scenes/trench-scene` | `'circulation' \| 'tides' \| 'moorings'` |
| `section:active` | `core/scroll` | `ui/nav-rail` `ui/header` | `{id, theme}` |
| `quality:change` | `core/raf` | `scenes/*` | `'high' \| 'medium' \| 'low'` |
| `motion:change` | `core/env` | `scenes/*` `ui/reveal` | `boolean` |

订阅方普遍使用 `on(EVENT.X, render, { replay: true })`：
总线保留每个事件的最后一次载荷，晚挂载的模块立即用当前状态渲染一次。
这消除了"各模块自己缓存一份初始状态"的重复，也让 `main.js` 的启动顺序只需保证
**状态源先于消费者**，而不必精确编排每一次渲染。

**规则**：事件名在 `core/bus.js` 里集中声明为常量，禁止裸字符串。
新增事件必须同时更新本表——这张表就是跨层契约。

---

## 4. 文档职责（`docs/`）

| 文件 | 回答什么 | 谁维护 |
|---|---|---|
| `../CLAUDE.md` | 新会话进来先看什么、红线是什么 | 每次架构变更 |
| `REFERENCES-SWE.md` | 架构争论的判据来源 | 极少变 |
| `ARCHITECTURE.md` | 本项目的层、目录、事件契约 | 每次结构变更 |
| `DECISIONS.md` | 为什么这么选（ADR，只增不改） | 每个决策点 |
| `PLAN-TRACE.md` | 方案 v1.0 条款 → 代码落点，验收用 | 每完成一个模块 |
| `CONTENT-MODEL.md` | 内容字段契约，科研人员填表依据 | 模型变更时 |
| `SCIENCE-NOTES.md` | 每个科学图形的模型、参数、单位、出处 | 新增图形时 |
| `PROGRESS.md` | 工作日志，做了什么/为什么/下一步 | 每个工作段 |
| `VERIFICATION.md` | 验证记录：截图、console、性能、a11y | 每轮验证 |
| `GLOSSARY.md` | 中英术语对照（双语同构的唯一词表） | 新术语时 |

---

## 5. 降级链（方案 §08/§09 + skill 的 Failure Model）

三层，**任一层失败只影响自己**：

1. **完整**：Canvas 粒子平流 + 滚动下潜 + SVG 交互图件
2. **静态**：`prefers-reduced-motion` 或低帧率 → 静态流线图、完整等深线、剖面直接全画
3. **纯内容**：JS 失败 → `index.html` 的语义骨架仍可读、可导航、可键盘操作

`science/` 的纯函数在第 2 层照常使用（画静态图也要地形和流场），这是把它做成 level 0 的直接收益。

---

## 6. 命名

- 文件：`kebab-case.js`，一个文件一个 secret
- 导出：具名导出，禁止 `export default`（便于静态扫描依赖）
- 场景图层统一实现 `{ id, draw(ctx, frame), update?(dt), dispose?() }`，契约在 `scenes/scene-contract.js`
- UI 模块统一 `init(root) → cleanup()`
- 科学函数带单位后缀或在 JSDoc 注明单位，例：`depthAt(x) → number  // 单位 m，向下为正`
