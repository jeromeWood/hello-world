<template>
  <view class="page">
    <!-- 本月总览 -->
    <view class="card">
      <view class="card-head">
        <text class="card-title">{{ monthLabel }}概览</text>
        <text class="link" @click="pickMonth">切换</text>
      </view>
      <view class="overview">
        <view class="ov-item">
          <text class="ov-label">支出</text>
          <text class="ov-value expense">¥{{ money(stats.summary.expense) }}</text>
        </view>
        <view class="ov-item">
          <text class="ov-label">收入</text>
          <text class="ov-value income">¥{{ money(stats.summary.income) }}</text>
        </view>
        <view class="ov-item">
          <text class="ov-label">结余</text>
          <text class="ov-value">¥{{ money(stats.summary.income - stats.summary.expense) }}</text>
        </view>
      </view>
    </view>

    <!-- 预算进度 -->
    <view class="card">
      <view class="card-head">
        <text class="card-title">本月预算</text>
        <text class="link" @click="editBudget">设置</text>
      </view>
      <view v-if="budget && budget.amount > 0">
        <view class="budget-row">
          <text class="budget-text">
            已用 ¥{{ money(stats.summary.expense) }} / 预算 ¥{{ money(budget.amount) }}
          </text>
          <text class="budget-pct" :class="{ danger: budgetRatio >= 1 }">
            {{ Math.min(100, Math.round(budgetRatio * 100)) }}%
          </text>
        </view>
        <view class="bar-bg">
          <view
            class="bar-fill"
            :class="{ danger: budgetRatio >= 1, warn: budgetRatio >= 0.8 && budgetRatio < 1 }"
            :style="{ width: barWidth }"
          />
        </view>
      </view>
      <text v-else class="muted">尚未设置总预算，点击右上角设置</text>
    </view>

    <!-- 分类占比 -->
    <view class="card">
      <text class="card-title">支出分类</text>
      <view v-if="stats.categories.length" class="cats">
        <view v-for="c in stats.categories" :key="c.categoryId" class="cat">
          <view class="cat-top">
            <text class="cat-name">{{ c.categoryName }}</text>
            <text class="cat-amt">¥{{ money(c.amount) }}</text>
          </view>
          <view class="bar-bg">
            <view
              class="bar-fill soft"
              :style="{ width: categoryWidth(c.amount) }"
            />
          </view>
        </view>
      </view>
      <text v-else class="muted">暂无支出数据</text>
    </view>

    <!-- 近月趋势 -->
    <view class="card">
      <text class="card-title">近 6 个月支出</text>
      <view class="trend">
        <view v-for="t in trend" :key="t.month" class="trend-col">
          <view class="trend-bar-wrap">
            <view class="trend-bar" :style="{ height: trendHeight(t.expense) }" />
          </view>
          <text class="trend-label">{{ t.label }}</text>
        </view>
      </view>
    </view>

    <!-- 建议 -->
    <view class="card">
      <text class="card-title">消费建议</text>
      <view v-for="(tip, idx) in advice" :key="idx" class="tip">
        <text class="tip-dot">•</text>
        <text class="tip-text">{{ tip }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { currentMonth } from '../../utils/storage.js'
import { getMonthBudget, upsertBudget } from '../../utils/budget.js'
import { buildAdvice, getMonthStats, getRecentMonthsTrend } from '../../utils/stats.js'

const month = ref(currentMonth())
const stats = ref(getMonthStats(month.value))
const trend = ref(getRecentMonthsTrend(6))
const budget = ref(getMonthBudget(month.value, ''))
const advice = ref(buildAdvice(month.value))

const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return `${y}年${Number(m)}月`
})

const budgetRatio = computed(() => {
  if (!budget.value || !budget.value.amount) return 0
  return stats.value.summary.expense / budget.value.amount
})

const barWidth = computed(() => `${Math.min(100, Math.round(budgetRatio.value * 100))}%`)

const maxExpense = computed(() => {
  const list = trend.value.map((t) => t.expense)
  return Math.max(1, ...list)
})

const maxCategoryAmount = computed(() => {
  const list = stats.value.categories.map((c) => c.amount)
  return Math.max(1, ...list)
})

function money(n) {
  return (Number(n) || 0).toFixed(2)
}

function categoryWidth(amount) {
  return `${Math.round((amount / maxCategoryAmount.value) * 100)}%`
}

function trendHeight(amount) {
  const h = Math.round((amount / maxExpense.value) * 160)
  return `${Math.max(8, h)}rpx`
}

function reload() {
  stats.value = getMonthStats(month.value)
  trend.value = getRecentMonthsTrend(6)
  budget.value = getMonthBudget(month.value, '')
  advice.value = buildAdvice(month.value)
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
      reload()
    }
  })
}

function editBudget() {
  uni.showModal({
    title: '设置本月总预算',
    editable: true,
    placeholderText: '例如 5000',
    content: budget.value && budget.value.amount ? String(budget.value.amount) : '',
    success: (res) => {
      if (!res.confirm) return
      const amount = Number(res.content)
      if (!amount || amount <= 0) {
        uni.showToast({ title: '请输入有效金额', icon: 'none' })
        return
      }
      upsertBudget({
        month: month.value,
        categoryId: '',
        categoryName: '总预算',
        amount
      })
      reload()
      uni.showToast({ title: '预算已保存', icon: 'success' })
    }
  })
}

onShow(() => reload())
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
  padding-bottom: 48rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16rpx;
}

.card-head .card-title {
  margin-bottom: 0;
}

.link {
  font-size: 26rpx;
  color: #1aad19;
}

.overview {
  display: flex;
  margin-top: 20rpx;
}

.ov-item {
  flex: 1;
}

.ov-label {
  display: block;
  font-size: 24rpx;
  color: #8a8a8a;
}

.ov-value {
  display: block;
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.ov-value.expense {
  color: #fa5151;
}

.ov-value.income {
  color: #1aad19;
}

.budget-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.budget-text {
  font-size: 26rpx;
  color: #353535;
}

.budget-pct {
  font-size: 26rpx;
  color: #1aad19;
  font-weight: 600;
}

.budget-pct.danger {
  color: #fa5151;
}

.bar-bg {
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 999rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #1aad19;
  border-radius: 999rpx;
}

.bar-fill.warn {
  background: #fa9d3b;
}

.bar-fill.danger {
  background: #fa5151;
}

.bar-fill.soft {
  background: #7ed321;
}

.muted {
  font-size: 26rpx;
  color: #b2b2b2;
}

.cats {
  margin-top: 8rpx;
}

.cat {
  margin-bottom: 20rpx;
}

.cat-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.cat-name,
.cat-amt {
  font-size: 26rpx;
  color: #353535;
}

.trend {
  margin-top: 12rpx;
  display: flex;
  align-items: flex-end;
  height: 220rpx;
  gap: 8rpx;
}

.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trend-bar-wrap {
  height: 160rpx;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 28rpx;
  background: #1aad19;
  border-radius: 8rpx 8rpx 0 0;
  min-height: 8rpx;
}

.trend-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #8a8a8a;
}

.tip {
  display: flex;
  margin-bottom: 12rpx;
}

.tip-dot {
  color: #1aad19;
  margin-right: 10rpx;
  font-size: 28rpx;
}

.tip-text {
  flex: 1;
  font-size: 26rpx;
  color: #353535;
  line-height: 1.5;
}
</style>
