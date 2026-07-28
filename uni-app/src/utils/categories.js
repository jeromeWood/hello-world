/** 收支分类定义 */

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: '餐饮', keywords: ['午饭', '晚餐', '早饭', '早餐', '午餐', '晚饭', '吃饭', '外卖', '咖啡', '奶茶', '早餐', '宵夜', '食堂', '麦当劳', '肯德基', '火锅', '烧烤', '零食', '水果', '超市买菜', '买菜'] },
  { id: 'transport', name: '交通', keywords: ['地铁', '公交', '打车', '出租车', '滴滴', '加油', '停车', '高铁', '火车', '机票', '飞机', '共享单车', '哈啰', '青桔'] },
  { id: 'shopping', name: '购物', keywords: ['购物', '淘宝', '京东', '拼多多', '衣服', '鞋子', '日用品', '电器', '数码'] },
  { id: 'housing', name: '居住', keywords: ['房租', '水电', '电费', '水费', '燃气', '物业', '宽带', '网费'] },
  { id: 'entertainment', name: '娱乐', keywords: ['电影', '游戏', 'KTV', '门票', '旅游', '健身', '会员', '爱奇艺', '腾讯视频'] },
  { id: 'medical', name: '医疗', keywords: ['医院', '看病', '药', '药店', '挂号', '体检'] },
  { id: 'education', name: '教育', keywords: ['学费', '培训', '书', '课程', '网课'] },
  { id: 'social', name: '社交', keywords: ['红包', '请客', '礼物', '份子钱', '送礼'] },
  { id: 'other_expense', name: '其他支出', keywords: [] }
]

export const INCOME_CATEGORIES = [
  { id: 'salary', name: '工资', keywords: ['工资', '薪水', '发薪', '月薪'] },
  { id: 'bonus', name: '奖金', keywords: ['奖金', '年终奖', '提成'] },
  { id: 'freelance', name: '兼职', keywords: ['兼职', '外快', '稿费'] },
  { id: 'investment', name: '理财', keywords: ['理财', '利息', '分红', '股票'] },
  { id: 'other_income', name: '其他收入', keywords: ['收款', '转入', '退款'] }
]

export function findCategory(text, type) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  for (const cat of list) {
    if (cat.keywords.some((k) => text.includes(k))) {
      return cat
    }
  }
  return list[list.length - 1]
}

export function getCategoryById(id) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.id === id) ||
    INCOME_CATEGORIES.find((c) => c.id === id) ||
    null
  )
}
