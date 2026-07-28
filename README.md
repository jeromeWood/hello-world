# 智记 · 个人财务 AI 小程序

基于 **Uni-app (Vue 3) + Tailwind CSS** 的微信小程序前端。

## 当前进度

已完成首页静态结构与基础样式（**不需要后端**即可预览）：

- 顶部日期与欢迎语
- 仿微信语音的长按录音按钮（按下变色，文案切换为「松开发送」）
- 文本输入框与发送按钮样式
- 底部原生 tabBar：首页 / 账单 / 统计 / 我的

## 本地运行

```bash
cd uni-app
npm install
npm run dev:mp-weixin
```

用微信开发者工具导入目录（必须是编译产物）：

```text
uni-app/dist/dev/mp-weixin
```

不要导入 `uni-app` 或 `uni-app/src`。

## 下一步（规划）

- 接入语音识别与 AI 记账解析
- 账单、预算、统计分析
- 后端 API 与数据持久化
