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

export function listBills() {
  return readAll().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
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

export function removeBill(id) {
  const list = readAll().filter((b) => b.id !== id)
  writeAll(list)
  return list
}

export function clearBills() {
  writeAll([])
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
