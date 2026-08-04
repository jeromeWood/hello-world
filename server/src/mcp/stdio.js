#!/usr/bin/env node
/**
 * doMoney MCP（stdio）
 * 供 Cursor / Claude Desktop 等本地客户端接入：
 *
 * {
 *   "mcpServers": {
 *     "domoney": {
 *       "command": "node",
 *       "args": ["src/mcp/stdio.js"],
 *       "cwd": "/path/to/server",
 *       "env": { "AI_API_KEY": "..." }
 *     }
 *   }
 * }
 */
import dotenv from 'dotenv'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createDoMoneyMcpServer } from './createServer.js'

dotenv.config()

async function main() {
  const server = createDoMoneyMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('doMoney MCP stdio failed:', err)
  process.exit(1)
})
