#!/usr/bin/env node
/**
 * 通过 HTTP MCP 列出 tools 并调用 parse_expense_text。
 * 需先启动：npm start
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const base = process.env.MCP_URL || 'http://127.0.0.1:3000/mcp'

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(base))
  const client = new Client({ name: 'domoney-mcp-probe', version: '1.0.0' })
  await client.connect(transport)

  const tools = await client.listTools()
  console.log(
    'tools:',
    tools.tools.map((t) => t.name).join(', ')
  )

  const parsed = await client.callTool({
    name: 'parse_expense_text',
    arguments: { text: '咖啡10块，停车4块' }
  })
  console.log('parse result:', parsed.content?.[0]?.text)

  const advice = await client.callTool({
    name: 'generate_finance_advice',
    arguments: {
      summary: { income: 8000, expense: 3000 },
      budgetAmount: 5000
    }
  })
  console.log('advice result:', advice.content?.[0]?.text)

  await client.close()
  console.log('http mcp probe ok')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
