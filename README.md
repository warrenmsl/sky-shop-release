# sky-shop-auto

电商运营自动化中台，当前真实采集范围为：

- 淘宝关键词采集
- 天猫关键词采集
- 真实采集结果展示
- 爆款元素分析
- 本地人工登录 / 验证接管

项目保留现有深色科技风 UI、左侧导航和演示模式提示。

## 推荐使用方式

线上 Render 版用于页面展示和查看结果。

真实采集推荐在本地运行，因为淘宝 / 天猫可能要求登录、滑块或验证码，只有本地可见浏览器窗口适合人工处理。

## 首次安装

```bash
cd D:\codex\sky-shop-main
npm install
npm run playwright:install
```

## 一键启动真实采集

```bash
npm run local:market
```

该命令会同时启动：

- 淘宝 / 天猫本地采集器
- 前端开发服务
- 本地市场采集页

如果浏览器没有自动打开，手动访问：

```text
http://127.0.0.1:8080/market
```

## 采集步骤

1. 确认右侧显示“人工接管：已启用”
2. 打开“本地人工接管验证”开关
3. 选择“淘宝”或“天猫”
4. 输入关键词，例如“沙发垫”
5. 点击“开始采集”

遇到登录、滑块或验证码时：

1. 任务进入“等待人工验证”
2. 在本地弹出的 Playwright 浏览器窗口完成登录或验证
3. 回到市场采集页点击“继续采集”

## 单独启动

普通无界面采集器：

```bash
npm run crawler:server
```

有界面人工接管采集器：

```bash
npm run crawler:headed
```

前端：

```bash
npm run dev
```

## 数据位置

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

平台选择器：

```text
scripts/market-crawler/config/taobao-selectors.json
scripts/market-crawler/config/tmall-selectors.json
```

## 已接真实数据的页面

- 市场采集
- 爆款元素分析

## 仍为演示数据的页面

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

## 构建与测试

```bash
npm run build
npm run test
```
