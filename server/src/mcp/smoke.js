#!/usr/bin/env node
/**
 * 本地冒烟：不经传输层，直接调用 tools 注册逻辑对应的业务函数。
 * 用法：node src/mcp/smoke.js
 */
import dotenv from 'dotenv'
import {
  generateAdvice,
  getHealthInfo,
  listCategories,
  parseExpenseText
} from '../services/ai.js'

dotenv.config()

async function main() {
  const health = getHealthInfo()
  console.log('[health_check]', health)

  const cats = listCategories('expense')
  console.log('[list_categories] count=', cats.categories.length)

  const parsed = await parseExpenseText('午饭花了32元，停车4块')
  console.log('[parse_expense_text]', parsed)

  const advice = await generateAdvice({
    month: '2026-08',
    summary: { income: 10000, expense: 4200, count: 18 },
    budgetAmount: 5000,
    maxCategory: { categoryName: '餐饮', amount: 1200 }
  })
  console.log('[generate_finance_advice]', advice)

  if (!health.ok || !parsed.ok || !advice.ok) {
    process.exitCode = 1
    console.error('smoke failed')
    return
  }
  console.log('smoke ok')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
