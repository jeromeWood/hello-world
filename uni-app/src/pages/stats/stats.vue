<template>
  <view class="page">
    <view class="month-nav">
      <text class="nav-btn" @click="shiftMonth(-1)">‹</text>
      <text class="month">{{ monthLabel }}</text>
      <text class="nav-btn" @click="shiftMonth(1)">›</text>
    </view>

    <!-- 概况 -->
    <view class="card">
      <text class="card-title">账本概况</text>
      <view class="kv">
        <text class="k">本月收入</text>
        <text class="v income">{{ money(summary.income) }}</text>
      </view>
      <view class="kv">
        <text class="k">本月支出</text>
        <text class="v expense">{{ money(summary.expense) }}</text>
      </view>
      <view class="kv">
        <text class="k">本月结余</text>
        <text class="v">{{ money(summary.income - summary.expense) }}</text>
      </view>
      <view class="kv">
        <text class="k">记账笔数</text>
        <text class="v">{{ summary.count }}</text>
      </view>
    </view>

    <!-- 预算 -->
    <view class="card">
      <view class="card-head">
        <text class="card-title">本月预算</text>
        <text class="link" @click="editBudget">设置</text>
      </view>
      <view v-if="budget && budget.amount > 0">
        <view class="budget-row">
          <text>已用 {{ money(summary.expense) }} / {{ money(budget.amount) }}</text>
          <text :class="{ danger: ratio >= 1 }">{{ Math.min(100, Math.round(ratio * 100)) }}%</text>
        </view>
        <view class="bar-bg">
          <view class="bar-fill" :class="{ danger: ratio >= 1, warn: ratio >= 0.8 && ratio < 1 }" :style="{ width: barWidth }" />
        </view>
      </view>
      <text v-else class="muted">尚未设置总预算</text>
    </view>

    <!-- 分类占比 -->
    <view class="card">
      <text class="card-title">支出分类</text>
      <view v-if="categories.length">
        <view v-for="(c, idx) in categories" :key="c.categoryId" class="cat">
          <view class="cat-top">
            <text>{{ idx + 1 }}. {{ c.categoryName }}</text>
            <text>{{ money(c.amount) }}（{{ pct(c.amount) }}%）</text>
          </view>
          <view class="bar-bg">
            <view class="bar-fill soft" :style="{ width: catWidth(c.amount) }" />
          </view>
        </view>
      </view>
      <text v-else class="muted">暂无支出数据</text>
    </view>

    <!-- 趋势 -->
    <view class="card">
      <text class="card-title">近 6 个月支出</text>
      <view class="trend">
        <view v-for="t in trend" :key="t.month" class="trend-col">
          <view class="trend-wrap">
            <view class="trend-bar" :style="{ height: trendHeight(t.expense) }" />
          </view>
          <text class="trend-label">{{ t.label }}</text>
        </view>
      </view>
    </view>

    <!-- 建议 -->
    <view class="card">
      <text class="card-title">消费建议</text>
      <view v-for="(tip, i) in advice" :key="i" class="tip">
        <text class="tip-dot">•</text>
        <text class="tip-text">{{ tip }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { aiAdvice } from '../../utils/api.js'
import { getMonthBudget, upsertBudget } from '../../utils/budget.js'
import { buildAdvice, getMonthStats, getRecentMonthsTrend } from '../../utils/stats.js'
import { currentMonth, formatMoney } from '../../utils/storage.js'

const month = ref(currentMonth())
const stats = ref(getMonthStats(month.value))
const trend = ref(getRecentMonthsTrend(6))
const budget = ref(getMonthBudget(month.value, ''))
const advice = ref(buildAdvice(month.value))

const summary = computed(() => stats.value.summary)
const categories = computed(() => stats.value.categories)
const ratio = computed(() => {
  if (!budget.value?.amount) return 0
  return summary.value.expense / budget.value.amount
})
const barWidth = computed(() => `${Math.min(100, Math.round(ratio.value * 100))}%`)
const maxCat = computed(() => Math.max(1, ...categories.value.map((c) => c.amount), 1))
const maxTrend = computed(() => Math.max(1, ...trend.value.map((t) => t.expense), 1))

const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return `${y}年${Number(m)}月`
})

function money(n) {
  return formatMoney(n)
}
function pct(amount) {
  const total = summary.value.expense || 1
  return ((amount / total) * 100).toFixed(1)
}
function catWidth(amount) {
  return `${Math.round((amount / maxCat.value) * 100)}%`
}
function trendHeight(amount) {
  return `${Math.max(8, Math.round((amount / maxTrend.value) * 160))}rpx`
}

function shiftMonth(delta) {
  const [y, m] = month.value.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  month.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  reload()
}

async function reload() {
  stats.value = getMonthStats(month.value)
  trend.value = getRecentMonthsTrend(6)
  budget.value = getMonthBudget(month.value, '')
  advice.value = buildAdvice(month.value)
  try {
    const remote = await aiAdvice({
      month: month.value,
      summary: summary.value,
      budgetAmount: budget.value?.amount || 0,
      maxCategory: stats.value.maxCategory
    })
    if (remote?.ok && remote.tips?.length) advice.value = remote.tips
  } catch (e) {}
}

function editBudget() {
  uni.showModal({
    title: '设置本月总预算',
    editable: true,
    placeholderText: '例如 5000',
    content: budget.value?.amount ? String(budget.value.amount) : '',
    success: (res) => {
      if (!res.confirm) return
      const amount = Number(res.content)
      if (!amount || amount <= 0) {
        uni.showToast({ title: '请输入有效金额', icon: 'none' })
        return
      }
      upsertBudget({ month: month.value, amount, categoryName: '总预算' })
      reload()
      uni.showToast({ title: '已保存', icon: 'success' })
    }
  })
}

onShow(() => reload())
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20rpx 24rpx 40rpx;
}
.month-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32rpx;
  margin-bottom: 12rpx;
}
.nav-btn {
  font-size: 40rpx;
  color: #1aad19;
  padding: 0 16rpx;
}
.month {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.card-head .card-title {
  margin-bottom: 0;
}
.link {
  color: #1aad19;
  font-size: 26rpx;
}
.kv {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.k {
  color: #8a8a8a;
  font-size: 26rpx;
}
.v {
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: 600;
}
.income {
  color: #fa5151;
}
.expense {
  color: #4a90e2;
}
.budget-row {
  display: flex;
  justify-content: space-between;
  margin: 12rpx 0;
  font-size: 26rpx;
}
.danger {
  color: #fa5151;
}
.bar-bg {
  height: 14rpx;
  background: #f0f0f0;
  border-radius: 999rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: #1aad19;
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
  color: #b2b2b2;
  font-size: 26rpx;
}
.cat {
  margin-bottom: 18rpx;
}
.cat-top {
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  margin-bottom: 8rpx;
  color: #353535;
}
.trend {
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
.trend-wrap {
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
}
.trend-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8a8a8a;
}
.tip {
  display: flex;
  margin-bottom: 10rpx;
}
.tip-dot {
  color: #1aad19;
  margin-right: 8rpx;
}
.tip-text {
  flex: 1;
  font-size: 26rpx;
  color: #353535;
  line-height: 1.5;
}
</style>
