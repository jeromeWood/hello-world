# doMoney Server

个人财务小程序后端（Express）。提供 REST API 与 **MCP tools**，方便其他平台接入记账解析、理财建议等业务。

未配置 `AI_API_KEY` 时自动降级为本地规则引擎。

## 启动

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

默认地址：`http://127.0.0.1:3000`

## REST 接口

- `GET /api/health`
- `POST /api/ai/parse` `{ "text": "午饭花了32元" }`
- `POST /api/ai/advice` `{ "summary": {...}, "budgetAmount": 5000, "maxCategory": {...} }`

## MCP Tools

同一套业务通过 MCP 暴露，供 Cursor、Claude Desktop、自建 Agent 等接入。

| Tool | 说明 |
|------|------|
| `health_check` | 服务健康与 AI 模式 |
| `parse_expense_text` | 自然语言 → 结构化账单草稿 |
| `generate_finance_advice` | 根据收支/预算生成建议 |
| `list_categories` | 内置支出/收入分类目录 |

另有 Resource：`domoney://categories`

### 方式一：stdio（本地客户端）

```bash
npm run mcp
```

Cursor / Claude Desktop 示例配置：

```json
{
  "mcpServers": {
    "domoney": {
      "command": "node",
      "args": ["src/mcp/stdio.js"],
      "cwd": "/absolute/path/to/server",
      "env": {
        "AI_API_KEY": ""
      }
    }
  }
}
```

### 方式二：HTTP（远程平台）

服务启动后：

```http
POST http://127.0.0.1:3000/mcp
Content-Type: application/json
```

若配置了 `MCP_API_KEY`，需带：

```http
Authorization: Bearer <MCP_API_KEY>
```

详见 [docs/mcp.md](docs/mcp.md)。

冒烟测试（不经传输层）：

```bash
npm run mcp:smoke
```

## 可选 AI

在 `.env` 中配置 OpenAI 兼容接口：

```bash
AI_API_KEY=sk-xxx
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```
