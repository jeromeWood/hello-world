<template>
  <view class="page">
    <!-- 顶部汇总 -->
    <view class="summary">
      <text class="balance">
        {{ money(summary.income - summary.expense) }} 结余
      </text>
      <text class="sub">
        收入 {{ money(summary.income) }} | 支出 {{ money(summary.expense) }}
      </text>
    </view>

    <!-- 月筛选 -->
    <view class="month-bar" @click="pickMonth">
      <text class="month">{{ monthLabel }}</text>
      <view class="month-right">
        <text>结余 {{ money(monthSummary.income - monthSummary.expense) }}</text>
        <text class="income">收入 {{ money(monthSummary.income) }}</text>
        <text class="expense">支出 {{ money(monthSummary.expense) }}</text>
      </view>
    </view>

    <!-- 类型筛选 -->
    <view class="filters">
      <view
        v-for="f in typeFilters"
        :key="f.value"
        class="chip"
        :class="{ active: typeFilter === f.value }"
        @click="typeFilter = f.value"
      >
        {{ f.label }}
      </view>
    </view>

    <!-- 列表 -->
    <view v-if="groups.length" class="list">
      <view v-for="g in groups" :key="g.date" class="group">
        <view class="group-head">
          <text>{{ g.label }}</text>
          <text class="group-sum">支 {{ money(g.expense) }} / 收 {{ money(g.income) }}</text>
        </view>
        <view
          v-for="item in g.items"
          :key="item.id"
          class="bill"
          @longpress="onDelete(item)"
        >
          <view class="bill-icon">{{ (item.categoryName || '?').slice(0, 1) }}</view>
          <view class="bill-main">
            <text class="bill-cat">{{ item.categoryName }}</text>
            <text class="bill-note">{{ item.note || '无备注' }}</text>
            <text class="bill-meta">{{ item.time || '' }} · {{ sourceLabel(item.source) }}</text>
          </view>
          <text class="bill-amount" :class="item.type">
            {{ item.type === 'income' ? '+' : '-' }}{{ money(item.amount) }}
          </text>
        </view>
      </view>
      <text class="tip">长按可删除流水</text>
    </view>

    <view v-else class="empty">
      <text class="empty-title">暂无流水</text>
      <view class="empty-btn" @click="goRecord">去记一笔</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  currentMonth,
  formatMoney,
  groupBillsByDate,
  listBills,
  removeBill,
  summarizeBills
} from '../../utils/storage.js'

const month = ref(currentMonth())
const typeFilter = ref('all')
const tick = ref(0)
const typeFilters = [
  { label: '全部', value: 'all' },
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' }
]

const allMonth = computed(() => {
  tick.value
  return listBills({ month: month.value })
})
const filtered = computed(() => {
  tick.value
  return listBills({ month: month.value, type: typeFilter.value })
})
const groups = computed(() => groupBillsByDate(filtered.value))
const monthSummary = computed(() => summarizeBills(allMonth.value))
const summary = computed(() => {
  tick.value
  return summarizeBills(listBills())
})

const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return `${Number(m)}月 ${y}`
})

function money(n) {
  return formatMoney(n)
}

function sourceLabel(s) {
  if (s === 'voice') return '语音'
  if (s === 'ai' || s === 'text') return 'AI'
  return '手动'
}

function pickMonth() {
  const now = new Date()
  const months = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  uni.showActionSheet({
    itemList: months.map((v) => {
      const [y, m] = v.split('-')
      return `${y}年${Number(m)}月`
    }),
    success: (res) => {
      month.value = months[res.tapIndex]
    }
  })
}

function onDelete(item) {
  uni.showModal({
    title: '删除流水',
    content: `确定删除「${item.categoryName} ${money(item.amount)}」吗？`,
    success: (res) => {
      if (!res.confirm) return
      removeBill(item.id)
      uni.showToast({ title: '已删除', icon: 'success' })
    }
  })
}

function goRecord() {
  uni.switchTab({ url: '/pages/record/record' })
}

onShow(() => {
  tick.value += 1
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 40rpx;
}
.summary {
  padding: 40rpx 32rpx 28rpx;
  background: linear-gradient(180deg, #e8f5e9 0%, #f7f8fa 100%);
}
.balance {
  display: block;
  text-align: center;
  font-size: 44rpx;
  font-weight: 700;
  color: #1a1a1a;
}
.sub {
  display: block;
  margin-top: 12rpx;
  text-align: center;
  font-size: 24rpx;
  color: #576b95;
}
.month-bar {
  margin: 0 24rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.month {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}
.month-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
  font-size: 22rpx;
  color: #8a8a8a;
}
.income {
  color: #fa5151;
}
.expense {
  color: #4a90e2;
}
.filters {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 24rpx;
}
.chip {
  padding: 10rpx 28rpx;
  border-radius: 999rpx;
  background: #fff;
  font-size: 26rpx;
  color: #353535;
  border: 1rpx solid #e5e5e5;
}
.chip.active {
  background: #1aad19;
  color: #fff;
  border-color: #1aad19;
}
.list {
  padding: 0 24rpx;
}
.group-head {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 8rpx;
  font-size: 24rpx;
  color: #8a8a8a;
}
.group-sum {
  color: #b2b2b2;
}
.bill {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
}
.bill-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: #eef9f4;
  color: #1aad19;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 16rpx;
}
.bill-main {
  flex: 1;
}
.bill-cat {
  display: block;
  font-size: 30rpx;
  color: #1a1a1a;
}
.bill-note {
  display: block;
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #8a8a8a;
}
.bill-meta {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #b2b2b2;
}
.bill-amount {
  font-size: 32rpx;
  font-weight: 600;
}
.bill-amount.expense {
  color: #4a90e2;
}
.bill-amount.income {
  color: #fa5151;
}
.tip {
  display: block;
  text-align: center;
  color: #b2b2b2;
  font-size: 22rpx;
  padding: 16rpx 0;
}
.empty {
  margin-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-title {
  font-size: 30rpx;
  color: #8a8a8a;
}
.empty-btn {
  margin-top: 28rpx;
  padding: 16rpx 40rpx;
  background: #1aad19;
  color: #fff;
  border-radius: 12rpx;
}
</style>
