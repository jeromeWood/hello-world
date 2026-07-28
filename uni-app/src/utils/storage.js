const STORAGE_KEY = 'domoney_bills_v1'

function readAll() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return []
    const list = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(list) ? list : []
  } catch (e) {
    return []
  }
}

function writeAll(list) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(list))
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function listBills(filters = {}) {
  let list = readAll()
  if (filters.month) {
    list = list.filter((b) => (b.date || '').startsWith(filters.month))
  }
  if (filters.type && filters.type !== 'all') {
    list = list.filter((b) => b.type === filters.type)
  }
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export function addBill(partial) {
  const now = Date.now()
  const bill = {
    id: `b_${now}_${Math.floor(Math.random() * 10000)}`,
    type: partial.type || 'expense',
    amount: Number(partial.amount) || 0,
    categoryId: partial.categoryId || 'other_expense',
    categoryName: partial.categoryName || '其他',
    note: partial.note || '',
    rawText: partial.rawText || '',
    source: partial.source || 'text',
    date: partial.date || formatDate(new Date()),
    createdAt: now,
    updatedAt: now
  }
  const list = readAll()
  list.unshift(bill)
  writeAll(list)
  return bill
}

export function updateBill(id, patch) {
  const list = readAll()
  const idx = list.findIndex((b) => b.id === id)
  if (idx < 0) return null
  list[idx] = {
    ...list[idx],
    ...patch,
    id,
    updatedAt: Date.now()
  }
  writeAll(list)
  return list[idx]
}

export function removeBill(id) {
  const next = readAll().filter((b) => b.id !== id)
  writeAll(next)
  return next
}

export function clearBills() {
  writeAll([])
}

export function summarizeBills(list) {
  return list.reduce(
    (acc, b) => {
      if (b.type === 'income') acc.income += b.amount
      else acc.expense += b.amount
      return acc
    },
    { income: 0, expense: 0 }
  )
}

export function groupBillsByDate(list) {
  const map = {}
  list.forEach((b) => {
    const key = b.date || '未知日期'
    if (!map[key]) map[key] = []
    map[key].push(b)
  })
  return Object.keys(map)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => ({
      date,
      items: map[date],
      ...summarizeBills(map[date])
    }))
}

export function currentMonth() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}
