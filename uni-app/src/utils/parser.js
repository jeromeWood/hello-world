import { findCategory } from './categories.js'

/**
 * 解析中文记账语句，支持多条：
 * - 午饭花了32元
 * - 我买咖啡10块，\n停车4块\n吃饭20
 */
export function parseBookkeepingText(raw, source = 'text') {
  const original = String(raw || '').trim()
  if (!original) {
    return { ok: false, error: '请输入记账内容' }
  }

  const segments = splitSegments(original)
  const records = []
  for (const seg of segments) {
    const one = parseOneSegment(seg, source)
    if (one) records.push(one)
  }

  if (!records.length) {
    return {
      ok: false,
      error: '没有识别到金额，请包含数字，例如：咖啡10块，停车4块'
    }
  }

  return {
    ok: true,
    records,
    // 兼容旧字段
    record: records[0]
  }
}

/** 将一段话拆成多条候选 */
export function splitSegments(raw) {
  const text = String(raw || '').trim()
  if (!text) return []

  // 先按换行/中英文逗号分号顿号拆
  const rough = text
    .split(/[\n\r,，;；、]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const result = []
  for (const part of rough) {
    const subs = splitByAmountChunks(part)
    result.push(...subs)
  }
  return result.filter(Boolean)
}

/**
 * 把「停车4块吃饭20」这种连写拆开
 */
function splitByAmountChunks(text) {
  const compact = text.replace(/\s+/g, '')
  const re = /([^0-9]*?)(\d+(?:\.\d{1,2})?)(?:元|块钱|块|圆)?/g
  const chunks = []
  let m
  while ((m = re.exec(compact)) !== null) {
    chunks.push(m[0])
  }
  if (chunks.length <= 1) return [compact]
  return chunks.map((c) => c.trim()).filter(Boolean)
}

function parseOneSegment(seg, source) {
  const text = String(seg || '').trim().replace(/\s+/g, '')
  if (!text) return null

  const amount = extractAmount(text)
  if (amount == null || amount <= 0) return null

  const type = detectType(text)
  const category = findCategory(text, type)
  const note = buildNote(text, amount)

  return {
    type,
    amount,
    categoryId: category.id,
    categoryName: category.name,
    note,
    rawText: text,
    source
  }
}

function extractAmount(text) {
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
    .replace(/花了|花费|支出|付了|支付|消费|收到|收入|赚了|到账|我买|买了|买/g, '')
    .trim()
  if (!note) note = '未备注'
  return note.slice(0, 40)
}

/** 把后端/本地结果统一成 records[] */
export function normalizeParseResult(result, source = 'text') {
  if (!result) return { ok: false, error: '识别失败' }
  if (!result.ok) return result

  let records = []
  if (Array.isArray(result.records) && result.records.length) {
    records = result.records
  } else if (result.record) {
    records = [result.record]
  }

  records = records
    .filter((r) => r && Number(r.amount) > 0)
    .map((r) => ({
      type: r.type === 'income' ? 'income' : 'expense',
      amount: Math.round(Number(r.amount) * 100) / 100,
      categoryId: r.categoryId || '',
      categoryName: r.categoryName || (r.type === 'income' ? '其他收入' : '其他支出'),
      note: String(r.note || '未备注').slice(0, 40),
      rawText: r.rawText || '',
      source: r.source || source
    }))

  if (!records.length) {
    return { ok: false, error: '没有识别到有效账单' }
  }

  return { ok: true, records, record: records[0], engine: result.engine }
}
