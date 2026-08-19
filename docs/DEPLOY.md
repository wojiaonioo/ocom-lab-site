# 发布 · DEPLOY

零构建静态站。**仓库根 ≠ 站点根**：

```
public/     ← 发布根，CF Pages 的 build output directory 指向这里
docs/       ← 设计与验证文档，不发布
tools/      ← lint 脚本，不发布
CLAUDE.md   ← 会话工作指令，不发布
```

一开始把输出目录设为 `/`（整个仓库），结果 `CLAUDE.md`、`tools/` 全部对外可访问。
试图用 `_redirects` 写 404 规则屏蔽 —— **无效**：CF Pages 中静态文件优先于 `_redirects`，
已存在的文件无法在那里屏蔽。**"哪些文件对外可见"只能由目录边界决定，不能靠路由规则补救。**

```
体积：gzip 后约 80.6 KB（HTML 16K + CSS 68K + JS 280K，48 个 ES 模块）
外部请求：0 —— 无字体 CDN、无地图瓦片、无分析脚本
```

零外部请求这一点对大陆访问最关键：不会出现"页面出来了但卡在某个境外 CDN"的情况。

---

## 方案对比（针对"大陆可访问"）

| 方案 | 大陆可访问性 | 需要 VPS | 需要备案 | 结论 |
|---|---|---|---|---|
| `*.github.io` 裸站 | ✗ 不稳，常被干扰 | 否 | 否 | 不能作为评审入口 |
| `*.pages.dev` 裸站 | ✗ 同样不稳 | 否 | 否 | 只适合自己看 |
| **CF Pages + 自有域名** | ◐ 可访问，走境外节点，约 150–300 ms | **否** | 否 | **当前选用** |
| 甲骨文 VPS 反代 | ◐ 同为境外，中转不改善，只多一跳 | 是 | 否 | 不解决问题 |
| 国内 CDN / OSS | ✅ 快 | 否 | **是** | 正式上线时的目标 |

**当前选用**：GitHub 私有仓库 → Cloudflare Pages → 自有域名子域。
`ocom.114451.xyz` 这类子域走 CF 代理，域名本身不被墙，是免 VPS 免备案条件下最稳的。

> 正式上线（方案 §12 P4）应迁到研究所服务器或国内 CDN，届时需完成备案。
> 本站零构建、纯静态，迁移成本是"拷贝目录"。

---

## 一次性配置

### 1. GitHub 仓库

**建议设为私有。** 页面含真实机构名称但内容全是占位（ADR-005），
公开仓库会被搜索引擎和代码搜索抓到。CF Pages 通过 GitHub App 读取私有仓库，不受影响。

```bash
git remote add origin git@github.com:<用户名>/ocom-lab-site.git
git push -u origin main
```

### 2. Cloudflare Pages

Dashboard → Workers & Pages → Create → Pages → Connect to Git

| 字段 | 值 |
|---|---|
| Framework preset | **None** |
| Build command | **留空** |
| Build output directory | **`public`** |
| Root directory | 留空 |

零构建，CF 只做静态分发。

### 3. 自定义域名

Pages 项目 → Custom domains → Set up a custom domain → 填 `ocom.114451.xyz`。
该域名的 zone 若在同一 CF 账号下，DNS 记录会自动创建，无需手动加 CNAME。

### 4. 访问控制（可选，建议开）

演示阶段若只给评审人看：Zero Trust → Access → Applications → 添加该域名，
策略选邮箱白名单或一次性验证码。免费额度 50 用户。

---

## 日常更新

```bash
git push          # CF Pages 自动构建部署，约 30 秒
```

---

## 正式上线前必须撤销的"演示锁"

以下三处是**故意加的**，防止占位内容被搜索引擎收录到研究所名下。
方案 §12.1 上线签署项完成后一并移除：

1. `index.html` 的 `<meta name="robots" content="noindex, nofollow">`
2. `robots.txt` 整个文件
3. `_headers` 中的 `X-Robots-Tag: noindex, nofollow`

同时移除页面顶部的 demo 提示条（`content/site.js` 的 `DEMO_NOTICE` 与 `index.html` 的 `#demo-ribbon`）。

---

## 备注

- `public/.nojekyll`：GitHub Pages 兜底用（禁用 Jekyll 处理）。CF Pages 忽略它。
- `public/_headers`：CF Pages 的响应头配置。GitHub Pages 忽略它。
- `public/_redirects`：只保留"未知路径回首页"。**不要指望用它屏蔽文件**（见上）。
- 所有资源路径均为相对路径（`./src/...`），因此在子路径（如 `user.github.io/repo/`）下同样可用。
