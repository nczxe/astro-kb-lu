## 目的 — 让 AI 代理快速上手此仓库

这是一个基于 Astro 的博客模板，部署在 Cloudflare Workers（使用 `@astrojs/cloudflare` + `wrangler`）。本文件给出项目结构、开发/构建流程、以及对 AI 代理有用的具体代码位置与示例，便于自动化修改和 PR 创建。

### 一句话概述
- 框架：Astro (v5.x)。
- 部署：Cloudflare Workers via `wrangler` 与 `@astrojs/cloudflare`。
- 内容：使用 Astro Content Collections（`src/content/blog/`，通过 `src/content.config.ts` 定义 `zod` 前端模式）。

### 关键文件与目录（常被修改）
- `package.json` — 脚本入口（`dev`, `build`, `preview`, `deploy`, `cf-typegen`, `check`）。
- `wrangler.json` — Cloudflare Workers 配置（部署/路由相关）。
- `astro.config.mjs` — Astro 配置（构建适配 Cloudflare）。
- `src/content.config.ts` — 内容集合定义，使用 `defineCollection` + `zod`，重要用于解析 frontmatter（示例见下）。
- `src/content/blog/` — Markdown/MDX 博客文章（添加新文章时放此处）。
- `src/pages/blog/index.astro` 与 `src/pages/blog/[...slug].astro` — 列表页与文章页路由。
- `src/layouts/BlogPost.astro` — 博客文章布局。

### 内容 frontmatter 约定（必须遵循）
在 `src/content.config.ts` 中 schema 要求：

```yaml
---
title: "示例标题"
description: "短描述"
pubDate: "2025-01-01"
updatedDate: "2025-02-01" # 可选
heroImage: "/path/to/image.jpg" # 可选
---
```

注意：Astro 的 schema 使用 `z.coerce.date()` 来将字符串转换为 Date 对象 —— AI 修改 frontmatter 时请保证日期为 ISO 可解析字符串。

### 常用开发命令（在仓库根目录运行）
- 本地开发：`npm run dev`（启动 Astro dev server）。
- 生成类型：`npm run cf-typegen`（`wrangler types`，用于 Cloudflare 类型）。
- 本地构建：`npm run build`。
- 预览构建：`npm run preview`（内部为 `astro build && wrangler dev`）。
- 检查（build + tsc + wrangler dry-run）：`npm run check`。
- 部署：`npm run deploy`（`wrangler deploy`）。

示例（PowerShell）:
```powershell
npm install
npm run dev
```

### 对 AI 的具体指导（可直接用于自动化修改）
- 添加博客文章：在 `src/content/blog/` 新建 `.md` 或 `.mdx` 文件，遵循上面 frontmatter schema。不要修改 `src/content.config.ts` 的 schema 除非确实需要新增字段，并同时更新使用这些字段的布局。
- 更新导航或链接：编辑 `src/components/Header.astro` 或 `src/pages/*`，保持路由命名约定（例如 `pages/blog/[...slug].astro` 使用动态 slug）。
- 修改布局：优先修改 `src/layouts/BlogPost.astro`，该文件控制文章渲染（图片、meta、日期格式化等）。
- 静态资源：将图片/字体放入 `public/`（例如 `public/fonts/`），引用路径为 `/fonts/...` 或 `/images/...`。

### 注意事项与约束（不要越权的改动）
- 不要在没有必要的情况下修改 `wrangler.json` 或 `astro.config.mjs`，这会影响部署行为；如果确需改动，请同时更新 `package.json` 的相关脚本并在 PR 描述中说明原因。
- 保持 frontmatter 的字段与 `src/content.config.ts` 中 `zod` schema 一致，尤其是 `pubDate` 的格式。
- 项目没有内置测试套件；任何大的行为更改（如路由/构建变更）应在本地 `npm run build` 与 `npm run preview` 下验证。

### 常见自动化任务示例（AI 可执行）
- 新文章 PR：创建 `src/content/blog/YYYY-MM-DD-slug.md`，填好 frontmatter、内容、并在 PR 描述里列出标题与发布日期。
- 修复日期/时区：若发现日期解析问题，更新 frontmatter 为 `YYYY-MM-DD` 或带时区的 ISO 格式（如 `2025-11-16T00:00:00Z`）。

### 参考文件（便于定位实现）
- `src/content.config.ts` — 内容 schema 的单一来源。
- `src/pages/blog/[...slug].astro`、`src/layouts/BlogPost.astro` — 渲染逻辑与页面路由。
- `package.json` — 脚本与部署命令。

如果有任何不明或仓库内未覆盖的工作流（例如 CI、Secrets、或特定 Cloudflare 路由需求），请指出我会据此补充。请审阅此草稿并告诉我需要强调或删除的部分。
