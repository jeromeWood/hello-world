import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  generateAdvice,
  getHealthInfo,
  listCategories,
  parseExpenseText
} from '../services/ai.js'

function textResult(data, isError = false) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    ...(isError ? { isError: true } : {})
  }
}

/**
 * 创建并注册 doMoney 业务 MCP tools。
 * 直接复用 services 层，与 REST API 行为一致。
 */
export function createDoMoneyMcpServer() {
  const server = new McpServer({
    name: 'domoney',
    version: '1.0.0'
  })

  server.registerTool(
    'health_check',
    {
      title: '健康检查',
      description:
        '检查 doMoney 后端服务是否可用，并返回当前 AI 模式（remote / local-rules）。'
    },
    async () => textResult(getHealthInfo())
  )

  server.registerTool(
    'parse_expense_text',
    {
      title: '解析记账文本',
      description:
        '将自然语言记账文本解析为结构化账单草稿。支持多笔（如「咖啡10块，停车4块」）。返回 type、amount、categoryId、categoryName、note 等字段。',
      inputSchema: {
        text: z
          .string()
          .min(1)
          .describe('用户记账原文，例如：午饭花了32元，停车4块')
      }
    },
    async ({ text }) => {
      const result = await parseExpenseText(String(text).trim())
      return textResult(result, result?.ok === false)
    }
  )

  server.registerTool(
    'generate_finance_advice',
    {
      title: '生成理财建议',
      description:
        '根据本月收支汇总、预算与最大开支分类，生成简短中文理财建议列表 tips。',
      inputSchema: {
        month: z.string().optional().describe('月份，如 2026-08'),
        summary: z
          .object({
            income: z.number().optional().describe('本月收入合计'),
            expense: z.number().optional().describe('本月支出合计'),
            count: z.number().optional().describe('本月账单笔数')
          })
          .optional()
          .describe('本月收支汇总'),
        budgetAmount: z.number().optional().describe('本月总预算金额'),
        maxCategory: z
          .object({
            categoryId: z.string().optional(),
            categoryName: z.string().optional().describe('最大开支分类名称'),
            amount: z.number().optional(),
            count: z.number().optional()
          })
          .optional()
          .describe('支出最高的分类')
      }
    },
    async (args) => {
      const result = await generateAdvice({
        month: args.month,
        summary: args.summary || { income: 0, expense: 0 },
        budgetAmount: args.budgetAmount || 0,
        maxCategory: args.maxCategory || null
      })
      return textResult(result, result?.ok === false)
    }
  )

  server.registerTool(
    'list_categories',
    {
      title: '列出分类目录',
      description:
        '返回 doMoney 内置的支出/收入分类目录（含 id、name、keywords），便于其他平台对齐分类。',
      inputSchema: {
        type: z
          .enum(['all', 'expense', 'income'])
          .optional()
          .describe('筛选类型：all / expense / income，默认 all')
      }
    },
    async (args) => textResult(listCategories(args?.type || 'all'))
  )

  server.registerResource(
    'categories',
    'domoney://categories',
    {
      description: 'doMoney 内置收支分类目录（JSON）',
      mimeType: 'application/json'
    },
    async (uri) => ({
      contents: [
        {
          uri: String(uri),
          mimeType: 'application/json',
          text: JSON.stringify(listCategories('all'), null, 2)
        }
      ]
    })
  )

  return server
}
