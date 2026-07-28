import { listBills, summarizeBills } from './storage.js'
import { getMonthBudget } from './budget.js'

export function getMonthStats(month) {
  const bills = listBills({ month })
  const summary = summarizeBills(bills)
  const byCategory = {}

  bills
    .filter((b) => b.type === 'expense')
    .forEach((b) => {
      if (!byCategory[b.categoryId]) {
        byCategory[b.categoryId] = {
          categoryId: b.categoryId,
          categoryName: b.categoryName,
          amount: 0,
          count: 0
        }
      }
      byCategory[b.categoryId].amount += b.amount
      byCategory[b.categoryId].count += 1
    })

  const categories = Object.values(byCategory).sort((a, b) => b.amount - a.amount)
  const maxCategory = categories[0] || null

  return {
    bills,
    summary,
    categories,
    maxCategory
  }
}

export function getRecentMonthsTrend(count = 6) {
  const now = new Date()
  const result = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const summary = summarizeBills(listBills({ month }))
    result.push({
      month,
      label: `${d.getMonth() + 1}月`,
      ...summary
    })
  }
  return result
}

export function buildAdvice(month) {
  const { summary, maxCategory, bills } = getMonthStats(month)
  const budget = getMonthBudget(month, '')
  const tips = []

  if (!bills.length) {
    return ['本月还没有账单，记一笔后可获得消费建议。']
  }

  if (budget && budget.amount > 0) {
    const used = summary.expense
    const ratio = used / budget.amount
    if (ratio >= 1) {
      tips.push(`本月支出已超出总预算 ¥${budget.amount.toFixed(2)}，建议先控制非必要消费。`)
    } else if (ratio >= 0.8) {
      tips.push(`本月预算已使用 ${(ratio * 100).toFixed(0)}%，接近上限，留意大额支出。`)
    } else {
      tips.push(`本月预算使用 ${(ratio * 100).toFixed(0)}%，整体还算从容。`)
    }
  } else {
    tips.push('还没有设置本月总预算，可在下方设置后跟踪支出进度。')
  }

  if (maxCategory && summary.expense > 0) {
    const share = (maxCategory.amount / summary.expense) * 100
    tips.push(
      `「${maxCategory.categoryName}」占比最高（${share.toFixed(0)}%，¥${maxCategory.amount.toFixed(2)}）。`
    )
  }

  const balance = summary.income - summary.expense
  if (summary.income > 0 && balance < 0) {
    tips.push('本月已入不敷出，建议优先保证刚需，延后可推迟的购物。')
  } else if (balance > 0) {
    tips.push(`当前结余 ¥${balance.toFixed(2)}，可考虑预留一部分作为应急金。`)
  }

  return tips
}
