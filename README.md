# OCOM Lab · 海洋环流观测与数值模拟研究室网站

首页 demo 原型。零构建、零运行时依赖，原生 ES Modules。

```bash
python3 -m http.server 5173      # → http://localhost:5173
node tools/check-layers.mjs      # 分层规则检查
```

## 这是什么

依据《海洋环流观测与数值模拟研究室 网站设计方案 v1.0》实现的首页体验原型：
海沟纵剖面 + 三层环流粒子平流 + 水深刻度构成首屏，滚动即下潜；
其后是代表性发现（交互式流速剖面）、四大研究方向、科研流程、观测海域地图、
论文 / 团队 / 加入我们。

概念主线：**DEPTH / FLOW / EVIDENCE** —— 让水深成为界面，让流场成为品牌，让证据成为内容。

## 文档

**动代码前先读 [`CLAUDE.md`](./CLAUDE.md)。**

| 文档 | 内容 |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | 分层、目录、跨层事件契约 |
| [`docs/REFERENCES-SWE.md`](./docs/REFERENCES-SWE.md) | 架构判据来源（Parnas / Lakos / VS Code / Ousterhout / Clean / BBoM） |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | ADR，为什么这么选 |
| [`docs/PROGRESS.md`](./docs/PROGRESS.md) | 工作日志 |
| [`docs/PLAN-TRACE.md`](./docs/PLAN-TRACE.md) | 方案条款 → 代码落点，验收用 |
| [`docs/VERIFICATION.md`](./docs/VERIFICATION.md) | 验证记录 |

## 注意

页面内容为**演示占位**。人员、论文、DOI、联系方式均未填入真实信息，
上线前须按方案 §12.1 逐项核验签署。
