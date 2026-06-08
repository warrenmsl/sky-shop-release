# sky-shop-auto

电商运营自动化中台，当前已经支持：

- Temu 关键词采集
- 真实采集结果展示
- 爆款元素分析
- 本地人工接管验证

项目保留了现有深色科技风 UI、左侧导航和演示模式提示，适合作为演示后台继续逐步接入真实功能。

## 最稳妥方案

推荐把系统分成两种使用方式：

1. 线上 Render 版  
用于展示页面、查看已保存结果、做远程演示。

2. 本地人工接管版  
用于真正执行 Temu 采集、处理拼图验证、继续采集。

原因很简单：

- Temu 的人机验证需要可交互浏览器窗口
- Render 线上服务没有你能直接操作的本地浏览器窗口
- 所以“人工过验证”最稳妥的方式，一定是在你自己的电脑本地执行

## 安装

```bash
npm install
npm run playwright:install
```

## 本地启动

前端：

```bash
npm run dev
```

访问地址：

```text
http://127.0.0.1:8080
```

本地普通采集服务：

```bash
npm run crawler:server
```

本地人工接管采集服务：

```bash
npm run crawler:headed
```

## 使用教程

### 方案 A：最便捷演示

适合：

- 只看页面
- 看已有结果
- 做远程展示

步骤：

1. 打开线上 Web Service 页面
2. 查看市场采集页和爆款元素分析页
3. 如果出现 Temu 验证，线上模式只会记录失败，不建议在线上做人机接管

### 方案 B：最稳妥真实采集

适合：

- 真正执行 Temu 采集
- 遇到拼图时手动处理
- 处理完后继续采集

步骤：

1. 在项目目录执行：

```bash
npm install
npm run playwright:install
```

2. 启动本地人工接管采集器：

```bash
npm run crawler:headed
```

3. 另开一个终端启动前端：

```bash
npm run dev
```

4. 打开：

```text
http://127.0.0.1:8080/market
```

5. 确认右侧状态里显示：

```text
人工接管：已启用
```

6. 打开“本地人工接管验证”开关
7. 输入关键词或直接点击预设关键词
8. 点击“开始采集”

### 遇到 Temu 人机验证时

如果遇到拼图或验证墙：

1. 页面任务会进入：

```text
等待人工验证
```

2. 页面会弹出“等待人工验证”弹窗
3. 你优先在本地已经弹出的 Playwright 浏览器窗口里完成验证
4. 完成后回到页面点击：

```text
继续采集
```

注意：

- 弹窗里的链接只是辅助跳转
- 真正能续跑当前任务的是本地已打开的那个 Playwright 浏览器窗口

## 数据保存位置

任务状态：

```text
data/market-crawler/tasks.json
```

采集结果：

```text
data/market-crawler/results.json
```

失败截图：

```text
data/market-crawler/screenshots/
```

## 当前已接真实数据的页面

- 市场采集
- 爆款元素分析

## 当前仍然是演示或 mock 的页面

- 仪表盘
- 上架任务
- 店铺监控
- 链接评分
- 操作建议
- 素材库
- 执行器控制台
- Locator 管理
- 配置中心
- 日志中心
- 用户权限

## 构建

```bash
npm run build
```

## 测试

```bash
npm run test
```
