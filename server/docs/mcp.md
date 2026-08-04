# doMoney MCP 接入说明

将 doMoney 后端业务封装为 [Model Context Protocol](https://modelcontextprotocol.io/) tools，其他平台无需直接对接 REST 即可调用。

## Tools

### `health_check`

无参数。返回：

```json
{ "ok": true, "service": "doMoney", "ai": "local-rules|remote", "time": "..." }
```

### `parse_expense_text`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 记账原文 |

成功示例：

```json
{
  "ok": true,
  "engine": "local-rules",
  "records": [
    {
      "type": "expense",
      "amount": 32,
      "categoryId": "food",
      "categoryName": "餐饮",
      "note": "午饭",
      "rawText": "午饭花了32元",
      "source": "ai"
    }
  ],
  "record": { "...": "同 records[0]" }
}
```

### `generate_finance_advice`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `month` | string | 否 | 如 `2026-08` |
| `summary` | object | 否 | `{ income, expense, count }` |
| `budgetAmount` | number | 否 | 月度预算 |
| `maxCategory` | object | 否 | 最大开支分类 |

返回：`{ ok, engine, tips: string[] }`

### `list_categories`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `all` \| `expense` \| `income` | 否 | 默认 `all` |

## Resources

- `domoney://categories` — 分类目录 JSON

## 接入方式

### Stdio

适合桌面 IDE / 本地 Agent：

```bash
cd server && npm run mcp
```

### Streamable HTTP

适合远程平台。先 `npm run start`，再对 `POST /mcp` 发 MCP JSON-RPC。

可选鉴权：环境变量 `MCP_API_KEY`，请求头 `Authorization: Bearer ...`。

## 与 REST 的关系

| MCP Tool | REST |
|----------|------|
| `health_check` | `GET /api/health` |
| `parse_expense_text` | `POST /api/ai/parse` |
| `generate_finance_advice` | `POST /api/ai/advice` |
| `list_categories` | （仅 MCP / 内部 service） |

MCP 与 REST 共用 `src/services/ai.js`，行为一致。
