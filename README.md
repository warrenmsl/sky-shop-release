# sky-shop-auto

电商运营自动化中台，支持自动上架、市场采集、店铺监控与 AI 分析。

当前仓库包含一个可运行的前端演示版，保留现有 UI、页面结构和演示模式提示，适合作为首版展示与后续真实能力接入的基础。

## 当前版本定位

- 保留现有 UI 与页面结构
- 保留演示模式提示
- 暂不接入真实自动化执行器
- 以可正常开发、构建、测试、发布为目标

## 技术栈

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- Recharts
- Vitest

## 本地启动

```bash
npm install
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:8080
```

## 构建

```bash
npm run build
```

构建产物输出到：

```text
dist/
```

## 代码检查

```bash
npm run lint
npm run test
```

说明：

- `lint` 当前无 error，有少量来自 shadcn/ui 模板文件的 warning
- `test` 当前可通过

## 发布说明

这是一个前端静态站点项目，可直接部署到支持静态资源托管的平台，例如：

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

发布时使用 `dist/` 目录即可。

## 演示模式说明

当前项目默认保留“演示模式”提示：

- 页面中的业务数据大多来自本地 mock 数据
- `127.0.0.1:7800` 代表未来本地自动化执行器的预留地址
- 当前版本不包含真实 Playwright Agent

## 后续方向

后续如果要接真实能力，建议按这个顺序推进：

1. 本地 Agent 探活接口
2. 任务拉取与状态回写
3. 市场采集回传
4. 店铺监控数据持久化
5. Locator 实测与日志回放
