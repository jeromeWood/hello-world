const STORAGE_KEY = 'domoney_budgets_v1'

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

/** 获取某月总预算（categoryId 为空表示总预算） */
export function getMonthBudget(month, categoryId = '') {
  return (
    readAll().find(
      (b) => b.month === month && (b.categoryId || '') === (categoryId || '')
    ) || null
  )
}

export function listMonthBudgets(month) {
  return readAll().filter((b) => b.month === month)
}

export function upsertBudget({ month, categoryId = '', categoryName = '总预算', amount }) {
  const list = readAll()
  const idx = list.findIndex(
    (b) => b.month === month && (b.categoryId || '') === (categoryId || '')
  )
  const item = {
    id: idx >= 0 ? list[idx].id : `bd_${Date.now()}`,
    month,
    categoryId: categoryId || '',
    categoryName,
    amount: Number(amount) || 0,
    updatedAt: Date.now()
  }
  if (idx >= 0) list[idx] = item
  else list.push(item)
  writeAll(list)
  return item
}

export function removeBudget(id) {
  writeAll(readAll().filter((b) => b.id !== id))
}
