# doMoney Server

个人财务小程序后端（Express）。提供 AI 记账解析与消费建议接口；未配置 `AI_API_KEY` 时自动降级为本地规则引擎。

## 启动

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

默认地址：`http://127.0.0.1:3000`

## 接口

- `GET /api/health`
- `POST /api/ai/parse` `{ "text": "午饭花了32元" }`
- `POST /api/ai/advice` `{ "summary": {...}, "budgetAmount": 5000, "maxCategory": {...} }`

## 可选 AI

在 `.env` 中配置 OpenAI 兼容接口：

```bash
AI_API_KEY=sk-xxx
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```
