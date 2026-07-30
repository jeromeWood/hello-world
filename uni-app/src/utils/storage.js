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

export function formatDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatMoney(n) {
  const num = Number(n) || 0
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function currentYear() {
  return String(new Date().getFullYear())
}

export function listBills(filters = {}) {
  let list = readAll()
  if (filters.year) list = list.filter((b) => (b.date || '').startsWith(filters.year))
  if (filters.month) list = list.filter((b) => (b.date || '').startsWith(filters.month))
  if (filters.date) list = list.filter((b) => b.date === filters.date)
  if (filters.type && filters.type !== 'all') list = list.filter((b) => b.type === filters.type)
  if (filters.categoryId) list = list.filter((b) => b.categoryId === filters.categoryId)
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export function addBill(partial) {
  const now = Date.now()
  const d = new Date()
  const bill = {
    id: `b_${now}_${Math.floor(Math.random() * 10000)}`,
    type: partial.type || 'expense',
    amount: Number(partial.amount) || 0,
    categoryId: partial.categoryId || 'other_expense',
    categoryName: partial.categoryName || '其他',
    note: partial.note || '',
    rawText: partial.rawText || '',
    source: partial.source || 'manual',
    date: partial.date || formatDate(d),
    time:
      partial.time ||
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
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
  list[idx] = { ...list[idx], ...patch, id, updatedAt: Date.now() }
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
      acc.count += 1
      return acc
    },
    { income: 0, expense: 0, count: 0 }
  )
}

export function groupBillsByDate(list) {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const map = {}
  list.forEach((b) => {
    const key = b.date || '未知日期'
    if (!map[key]) map[key] = []
    map[key].push(b)
  })
  return Object.keys(map)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => {
      const d = new Date(date.replace(/-/g, '/'))
      const label = Number.isNaN(d.getTime())
        ? date
        : `${d.getDate()}日 周${weekdays[d.getDay()]}`
      return {
        date,
        label,
        items: map[date],
        ...summarizeBills(map[date])
      }
    })
}

export function getRangeSummary() {
  const now = new Date()
  const today = formatDate(now)
  const month = currentMonth()
  const year = currentYear()

  const day = now.getDay() || 7
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - day + 1)
  const weekStartStr = formatDate(weekStart)

  const all = listBills()
  const todayList = all.filter((b) => b.date === today)
  const weekList = all.filter((b) => b.date >= weekStartStr && b.date <= today)
  const monthList = all.filter((b) => (b.date || '').startsWith(month))
  const yearList = all.filter((b) => (b.date || '').startsWith(year))

  return {
    today: { ...summarizeBills(todayList), label: today },
    week: {
      ...summarizeBills(weekList),
      label: `${weekStartStr.slice(5)} ~ ${today.slice(5)}`
    },
    month: { ...summarizeBills(monthList), label: month },
    year: { ...summarizeBills(yearList), label: year }
  }
}
