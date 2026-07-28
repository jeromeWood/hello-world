<template>
  <view class="page">
    <!-- 月份与汇总 -->
    <view class="summary">
      <view class="month-row" @click="pickMonth">
        <text class="month">{{ monthLabel }}</text>
        <text class="month-hint">切换月份</text>
      </view>
      <view class="nums">
        <view class="num-item">
          <text class="num-label">支出</text>
          <text class="num-value expense">¥{{ formatMoney(summary.expense) }}</text>
        </view>
        <view class="num-item">
          <text class="num-label">收入</text>
          <text class="num-value income">¥{{ formatMoney(summary.income) }}</text>
        </view>
        <view class="num-item">
          <text class="num-label">结余</text>
          <text class="num-value">¥{{ formatMoney(summary.income - summary.expense) }}</text>
        </view>
      </view>
    </view>

    <!-- 类型筛选 -->
    <view class="filters">
      <view
        v-for="f in filters"
        :key="f.value"
        class="chip"
        :class="{ active: typeFilter === f.value }"
        @click="typeFilter = f.value"
      >
        <text>{{ f.label }}</text>
      </view>
    </view>

    <!-- 列表 -->
    <view v-if="groups.length" class="list">
      <view v-for="g in groups" :key="g.date" class="group">
        <view class="group-head">
          <text class="group-date">{{ g.date }}</text>
          <text class="group-sum">
            支 ¥{{ formatMoney(g.expense) }} / 收 ¥{{ formatMoney(g.income) }}
          </text>
        </view>
        <view
          v-for="item in g.items"
          :key="item.id"
          class="bill"
          @longpress="onDelete(item)"
        >
          <view class="bill-left">
            <text class="bill-cat">{{ item.categoryName }}</text>
            <text class="bill-note">{{ item.note || '无备注' }}</text>
          </view>
          <text class="bill-amount" :class="item.type">
            {{ item.type === 'income' ? '+' : '-' }}¥{{ formatMoney(item.amount) }}
          </text>
        </view>
      </view>
      <text class="footer-tip">长按账单可删除</text>
    </view>

    <view v-else class="empty">
      <text class="empty-title">本月还没有账单</text>
      <text class="empty-desc">去首页用文字或语音记一笔吧</text>
      <view class="empty-btn" @click="goHome">
        <text>去记账</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  currentMonth,
  groupBillsByDate,
  listBills,
  removeBill,
  summarizeBills
} from '../../utils/storage.js'

const month = ref(currentMonth())
const typeFilter = ref('all')
const bills = ref([])

const filters = [
  { label: '全部', value: 'all' },
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' }
]

const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return `${y}年${Number(m)}月`
})

const filtered = computed(() =>
  listBills({ month: month.value, type: typeFilter.value })
)

const groups = computed(() => groupBillsByDate(filtered.value))

const summary = computed(() =>
  summarizeBills(listBills({ month: month.value }))
)

function reload() {
  bills.value = listBills({ month: month.value })
}

function formatMoney(n) {
  return (Number(n) || 0).toFixed(2)
}

function pickMonth() {
  const now = new Date()
  const months = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
  }
  uni.showActionSheet({
    itemList: months.map((v) => {
      const [y, m] = v.split('-')
      return `${y}年${Number(m)}月`
    }),
    success: (res) => {
      month.value = months[res.tapIndex]
      reload()
    }
  })
}

function onDelete(item) {
  uni.showModal({
    title: '删除账单',
    content: `确定删除「${item.categoryName} ¥${formatMoney(item.amount)}」吗？`,
    success: (res) => {
      if (!res.confirm) return
      removeBill(item.id)
      reload()
      uni.showToast({ title: '已删除', icon: 'success' })
    }
  })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

onShow(() => {
  reload()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 40rpx;
}

.summary {
  margin: 24rpx 24rpx 0;
  padding: 28rpx;
  background: #fff;
  border-radius: 16rpx;
}

.month-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.month {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.month-hint {
  font-size: 24rpx;
  color: #8a8a8a;
}

.nums {
  margin-top: 24rpx;
  display: flex;
}

.num-item {
  flex: 1;
}

.num-label {
  display: block;
  font-size: 24rpx;
  color: #8a8a8a;
}

.num-value {
  display: block;
  margin-top: 8rpx;
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 600;
}

.num-value.expense {
  color: #fa5151;
}

.num-value.income {
  color: #1aad19;
}

.filters {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
}

.chip {
  padding: 10rpx 28rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #353535;
  font-size: 26rpx;
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

.group {
  margin-bottom: 24rpx;
}

.group-head {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 8rpx 12rpx;
}

.group-date {
  font-size: 26rpx;
  color: #8a8a8a;
}

.group-sum {
  font-size: 24rpx;
  color: #b2b2b2;
}

.bill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 12rpx;
}

.bill-cat {
  display: block;
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.bill-note {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8a8a;
}

.bill-amount {
  font-size: 32rpx;
  font-weight: 600;
}

.bill-amount.expense {
  color: #fa5151;
}

.bill-amount.income {
  color: #1aad19;
}

.footer-tip {
  display: block;
  text-align: center;
  color: #b2b2b2;
  font-size: 22rpx;
  padding: 12rpx 0 24rpx;
}

.empty {
  margin-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40rpx;
}

.empty-title {
  font-size: 32rpx;
  color: #1a1a1a;
  font-weight: 600;
}

.empty-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #8a8a8a;
}

.empty-btn {
  margin-top: 40rpx;
  padding: 18rpx 48rpx;
  background: #1aad19;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style>
