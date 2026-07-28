import { findCategory } from './categories.js'

/**
 * 解析中文记账语句，例如：
 * - 午饭花了32元
 * - 地铁6块
 * - 收到工资12000
 * - 支出 咖啡 18
 */
export function parseBookkeepingText(raw) {
  const text = String(raw || '').trim().replace(/\s+/g, '')
  if (!text) {
    return { ok: false, error: '请输入记账内容' }
  }

  const amount = extractAmount(text)
  if (amount == null || amount <= 0) {
    return { ok: false, error: '没有识别到金额，请包含数字，例如：午饭花了32元' }
  }

  const type = detectType(text)
  const category = findCategory(text, type)
  const note = buildNote(text, amount)

  return {
    ok: true,
    record: {
      type,
      amount,
      categoryId: category.id,
      categoryName: category.name,
      note,
      rawText: String(raw || '').trim(),
      source: 'text'
    }
  }
}

function extractAmount(text) {
  // 优先匹配「花了/支出/收入」后的数字
  const patterns = [
    /(?:花了|花费|支出|付了|支付|消费|收到|收入|赚了|到账)(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)(?:元|块钱|块|圆)/,
    /(\d+(?:\.\d{1,2})?)/
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const n = Number(m[1])
      if (!Number.isNaN(n)) return Math.round(n * 100) / 100
    }
  }
  return null
}

function detectType(text) {
  const incomeHints = ['收到', '收入', '工资', '奖金', '到账', '赚了', '收款', '兼职', '理财收益']
  if (incomeHints.some((k) => text.includes(k))) return 'income'
  return 'expense'
}

function buildNote(text, amount) {
  let note = text
    .replace(String(amount), '')
    .replace(/元|块钱|块|圆/g, '')
    .replace(/花了|花费|支出|付了|支付|消费|收到|收入|赚了|到账/g, '')
    .trim()
  if (!note) note = '未备注'
  return note.slice(0, 40)
}
