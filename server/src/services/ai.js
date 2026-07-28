const EXPENSE_CATEGORIES = [
  { id: 'food', name: '餐饮', keywords: ['午饭', '晚餐', '早饭', '早餐', '午餐', '晚饭', '吃饭', '外卖', '咖啡', '奶茶', '宵夜', '食堂'] },
  { id: 'transport', name: '交通', keywords: ['地铁', '公交', '打车', '滴滴', '加油', '停车', '高铁', '机票'] },
  { id: 'shopping', name: '购物', keywords: ['购物', '淘宝', '京东', '拼多多', '衣服', '鞋子'] },
  { id: 'housing', name: '居住', keywords: ['房租', '水电', '电费', '水费', '燃气', '物业', '宽带'] },
  { id: 'entertainment', name: '娱乐', keywords: ['电影', '游戏', '旅游', '健身', '会员'] },
  { id: 'medical', name: '医疗', keywords: ['医院', '看病', '药', '体检'] },
  { id: 'education', name: '教育', keywords: ['学费', '培训', '课程'] },
  { id: 'social', name: '社交', keywords: ['红包', '请客', '礼物'] },
  { id: 'other_expense', name: '其他支出', keywords: [] }
]

const INCOME_CATEGORIES = [
  { id: 'salary', name: '工资', keywords: ['工资', '薪水', '发薪'] },
  { id: 'bonus', name: '奖金', keywords: ['奖金', '年终奖', '提成'] },
  { id: 'freelance', name: '兼职', keywords: ['兼职', '外快'] },
  { id: 'investment', name: '理财', keywords: ['理财', '利息', '分红'] },
  { id: 'other_income', name: '其他收入', keywords: ['收款', '退款'] }
]

function findCategory(text, type) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  for (const cat of list) {
    if (cat.keywords.some((k) => text.includes(k))) return cat
  }
  return list[list.length - 1]
}

function localParse(raw) {
  const text = String(raw || '').trim().replace(/\s+/g, '')
  if (!text) return { ok: false, error: '请输入记账内容' }

  const patterns = [
    /(?:花了|花费|支出|付了|支付|消费|收到|收入|赚了|到账)(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)(?:元|块钱|块|圆)/,
    /(\d+(?:\.\d{1,2})?)/
  ]
  let amount = null
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      amount = Math.round(Number(m[1]) * 100) / 100
      break
    }
  }
  if (!amount || amount <= 0) {
    return { ok: false, error: '没有识别到金额' }
  }

  const incomeHints = ['收到', '收入', '工资', '奖金', '到账', '赚了', '收款']
  const type = incomeHints.some((k) => text.includes(k)) ? 'income' : 'expense'
  const category = findCategory(text, type)
  let note = text
    .replace(String(amount), '')
    .replace(/元|块钱|块|圆/g, '')
    .replace(/花了|花费|支出|付了|支付|消费|收到|收入|赚了|到账/g, '')
    .trim() || '未备注'

  return {
    ok: true,
    engine: 'local-rules',
    record: {
      type,
      amount,
      categoryId: category.id,
      categoryName: category.name,
      note: note.slice(0, 40),
      rawText: String(raw || '').trim(),
      source: 'ai'
    }
  }
}

function localAdvice(payload) {
  const summary = payload.summary || { income: 0, expense: 0 }
  const budget = payload.budgetAmount || 0
  const maxCategory = payload.maxCategory || null
  const tips = []

  if (budget > 0) {
    const ratio = summary.expense / budget
    if (ratio >= 1) tips.push('本月支出已超预算，建议先冻结非必要购物。')
    else if (ratio >= 0.8) tips.push(`预算已使用 ${(ratio * 100).toFixed(0)}%，接近上限。`)
    else tips.push(`预算使用 ${(ratio * 100).toFixed(0)}%，节奏尚可。`)
  } else {
    tips.push('建议先设置月度总预算，便于控制支出节奏。')
  }

  if (maxCategory) {
    tips.push(`「${maxCategory.categoryName}」是最大开支项，可尝试设定该类单独限额。`)
  }

  const balance = (summary.income || 0) - (summary.expense || 0)
  if (balance < 0) tips.push('本月入不敷出，优先保障刚需与固定支出。')
  else tips.push(`当前结余约 ¥${balance.toFixed(2)}，可预留一部分应急金。`)

  return { ok: true, engine: 'local-rules', tips }
}

async function chatJson(system, user) {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) return null

  const base = (process.env.AI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gpt-4o-mini'

  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`AI 请求失败: ${resp.status} ${text}`)
  }

  const data = await resp.json()
  const content = data.choices?.[0]?.message?.content || '{}'
  return JSON.parse(content)
}

export async function parseExpenseText(text) {
  try {
    const ai = await chatJson(
      '你是记账助手。从用户中文句子提取记账信息，只返回 JSON：{"ok":true,"record":{"type":"expense|income","amount":number,"categoryName":"分类","note":"备注","rawText":"原文"}}。分类优先：餐饮/交通/购物/居住/娱乐/医疗/教育/社交/工资/奖金/兼职/理财/其他。',
      text
    )
    if (ai?.ok && ai.record?.amount) {
      const type = ai.record.type === 'income' ? 'income' : 'expense'
      const name = ai.record.categoryName || (type === 'income' ? '其他收入' : '其他支出')
      const cat = findCategory(name + text, type)
      return {
        ok: true,
        engine: 'remote-ai',
        record: {
          type,
          amount: Number(ai.record.amount),
          categoryId: cat.id,
          categoryName: cat.name || name,
          note: String(ai.record.note || '未备注').slice(0, 40),
          rawText: text,
          source: 'ai'
        }
      }
    }
  } catch (e) {
    console.warn('AI parse fallback:', e.message)
  }
  return localParse(text)
}

export async function generateAdvice(payload) {
  try {
    const ai = await chatJson(
      '你是个人理财顾问。根据用户本月收支与预算，给出 3 条以内简短中文建议。只返回 JSON：{"ok":true,"tips":["..."]}',
      JSON.stringify(payload)
    )
    if (ai?.ok && Array.isArray(ai.tips) && ai.tips.length) {
      return { ok: true, engine: 'remote-ai', tips: ai.tips.slice(0, 5) }
    }
  } catch (e) {
    console.warn('AI advice fallback:', e.message)
  }
  return localAdvice(payload)
}
