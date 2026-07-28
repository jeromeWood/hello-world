# 智记 · 个人财务 AI 小程序

基于 **Uni-app (Vue 3) + Tailwind CSS** 的微信小程序前端。

## 当前进度

已完成首页静态结构与基础样式（**不需要后端**即可预览）：

- 顶部日期与欢迎语
- 仿微信语音的长按录音按钮（按下变色，文案切换为「松开发送」）
- 文本输入框与发送按钮样式
- 底部原生 tabBar：首页 / 账单 / 统计 / 我的

## 本地运行

### 1) 小程序前端

```bash
cd uni-app
npm install
npm run dev:mp-weixin
```

用微信开发者工具导入：

```text
uni-app/dist/dev/mp-weixin
```

### 2) 后端（AI / 解析服务）

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

默认 `http://127.0.0.1:3000`。可在小程序「我的」页检测连接。

## 已完成能力

1. 文字/语音记账解析（本地规则 + 可选远程 AI）
2. 账单列表与本地存储
3. 统计、预算与消费建议
4. Express 后端与 AI 接口
