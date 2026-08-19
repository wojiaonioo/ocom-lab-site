# 发布 · DEPLOY

> **主入口**：https://wojiaonioo.github.io/ocom-lab-site/　（GitHub Pages，Actions 发布 `public/`）
> 备用入口：https://ocom.114451.xyz　·　https://ocom-lab-site.pages.dev　（Cloudflare Pages）
>
> 仓库 `wojiaonioo/ocom-lab-site`，**公开**。


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


---

## 已完成的实际配置（2026-08-19）

| 项 | 值 |
|---|---|
| GitHub 仓库 | `wojiaonioo/ocom-lab-site`（**私有**） |
| CF Pages 项目 | `ocom-lab-site` |
| 生产分支 | `main`，自动部署已启用 |
| Build command | 空 |
| Build output directory | `public` |
| 自定义域名 | `ocom.114451.xyz`（CNAME → `ocom-lab-site.pages.dev`，Auto TTL） |

⚠ 该 zone 上原有 `*.114451.xyz` 通配符记录。新增的 `ocom` CNAME 对该子域优先生效，
**通配符记录保留未动**，其他子域不受影响。

### 上线验收实测

```
站点资源            index.html / main.css / main.js / flow-field.js / station-map.js / robots.txt  全 200
不应暴露的          CLAUDE.md、tools/、docs/  均已屏蔽（回退首页）
响应头              x-robots-tag: noindex, nofollow ✓
浏览器渲染          9 个版块、4 研究方向、8 论文、6 成员、3 航次、6 站位、剖面 SVG 均在
Canvas              非空率 100%
控制台              无应用报错
```

### 一个坑（已在正文说明）

首次验证时 `/CLAUDE.md` 仍返回原文，一度以为屏蔽失败 —— 实为 CF 边缘缓存
（`cf-cache-status: HIT`）。**判断是否生效要看响应体，不能只看状态码**：
本站 `_redirects` 有 `/* → /index.html 200` 兜底，未知路径本来就返回 200。


---

## GitHub Pages（主入口）

### 为什么仓库必须公开

免费账号的 GitHub Pages **只能从公开仓库发布**（设置页原话：
"Upgrade or make this repository public to enable Pages"）。私有仓库发布需 Pro 及以上。

仓库公开后，占位内容可被浏览与 fork。站点上的 `noindex` 只挡搜索引擎抓**站点**，
挡不住**仓库本身**被收录，因此 README 顶部加了醒目免责声明（非官方 / 占位内容 / 示意模型）。

### 为什么走 Actions 而不是分支发布

Pages 的分支发布只支持**仓库根**或 **`/docs`**，而站点根是 `public/`，两者都不匹配
（`/docs` 已被设计文档占用）。因此用 `.github/workflows/pages.yml` 显式上传 `public/`，
与 Cloudflare Pages 的边界保持一致：`docs/` `tools/` `CLAUDE.md` 不发布。

顺带把三个检查接进 CI，**不通过就不发布**：

```
node tools/check-layers.mjs      分层规则
node tools/check-contrast.mjs    色彩令牌对比度
content/index.js selfCheck()     内容模型
```

### 与 Cloudflare 版的差异

| | GitHub Pages | Cloudflare Pages |
|---|---|---|
| URL | `wojiaonioo.github.io/ocom-lab-site/`（**子路径**） | `ocom.114451.xyz`（根路径） |
| 大陆访问 | 不稳 | 可访问 |
| `_headers`（`X-Robots-Tag`） | **忽略** | 生效 |
| `_redirects`（未知路径回首页） | **忽略**，用 GitHub 默认 404 | 生效 |
| `robots.txt` | **不生效** —— 项目站的 robots.txt 必须在 `wojiaonioo.github.io/robots.txt`，子路径下的不被读取 | 生效 |

因此在 GitHub Pages 上，禁止收录只剩 `<meta name="robots">` 这一道。
站点全部资源为相对路径，子路径部署已实测可用。

### 上线验收实测（GitHub Pages）

```
站点资源      index.html / main.css / main.js / flow-field.js / station-map.js  全 200
不应发布的    CLAUDE.md、tools/、docs/  全部 404 ✓
meta robots   noindex, nofollow ✓
浏览器渲染    9 版块 / 4 方向 / 8 论文 / 6 成员 / 3 航次 / 6 站位 / 剖面 SVG 全在
Canvas        非空率 100%
```
