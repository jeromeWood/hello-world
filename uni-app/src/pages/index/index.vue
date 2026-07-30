<template>
  <view class="page">
    <!-- 快捷入口 -->
    <view class="quick">
      <view v-for="q in quicks" :key="q.text" class="quick-item" @click="q.go">
        <view class="quick-icon">{{ q.icon }}</view>
        <text class="quick-text">{{ q.text }}</text>
      </view>
    </view>

    <!-- 促销条（可关） -->
    <view v-if="showBanner" class="banner">
      <text class="banner-text">暑期特惠：AI 记账更省心</text>
      <text class="banner-link" @click="showBanner = false">知道了</text>
    </view>

    <!-- 本年收支 -->
    <view class="card hero">
      <view class="hero-head">
        <text class="card-title">本年收支统计</text>
        <text class="eye" @click="hideMoney = !hideMoney">{{ hideMoney ? '显示' : '隐藏' }}</text>
      </view>
      <text class="hero-label">总支出</text>
      <text class="hero-expense">{{ hideMoney ? '****' : money(year.expense) }}</text>
      <view class="hero-row">
        <text>总收入 {{ hideMoney ? '****' : money(year.income) }}</text>
        <text>结余 {{ hideMoney ? '****' : money(year.income - year.expense) }}</text>
      </view>
    </view>

    <!-- 收支报告 -->
    <view class="card">
      <text class="card-title">收支报告</text>
      <view v-for="row in reportRows" :key="row.key" class="report-row" @click="goFlow">
        <view class="report-left">
          <view class="dot" :class="row.key" />
          <view>
            <text class="report-name">{{ row.name }}</text>
            <text class="report-sub">{{ row.label }}</text>
          </view>
        </view>
        <view class="report-right">
          <text class="income">总收入 {{ hideMoney ? '****' : money(row.income) }}</text>
          <text class="expense">总支出 {{ hideMoney ? '****' : money(row.expense) }}</text>
        </view>
      </view>
    </view>

    <!-- 本月支出 -->
    <view class="card">
      <text class="card-title">本月支出情况</text>
      <view class="month-line">
        <text class="expense">总支出 {{ hideMoney ? '****' : money(month.expense) }}</text>
        <text class="muted">支出笔数 {{ month.count }}</text>
      </view>
      <view class="bar-bg">
        <view class="bar-fill" :style="{ width: monthBar }" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { formatMoney, getRangeSummary } from '../../utils/storage.js'

const hideMoney = ref(false)
const showBanner = ref(true)
const tick = ref(0)
const ranges = computed(() => {
  tick.value
  return getRangeSummary()
})

const year = computed(() => ranges.value.year)
const month = computed(() => ranges.value.month)

const reportRows = computed(() => [
  { key: 'today', name: '今天', ...ranges.value.today },
  { key: 'week', name: '本周', ...ranges.value.week },
  { key: 'month', name: '本月', ...ranges.value.month }
])

const monthBar = computed(() => {
  const max = Math.max(year.value.expense, 1)
  return `${Math.min(100, Math.round((month.value.expense / max) * 100))}%`
})

const quicks = [
  { icon: '账', text: '账户', go: () => uni.showToast({ title: '账户功能稍后完善', icon: 'none' }) },
  { icon: '预', text: '预算', go: () => uni.switchTab({ url: '/pages/stats/stats' }) },
  { icon: '图', text: '图表', go: () => uni.switchTab({ url: '/pages/stats/stats' }) },
  { icon: '记', text: '记一笔', go: () => uni.switchTab({ url: '/pages/record/record' }) },
  { icon: '设', text: '设置', go: () => uni.switchTab({ url: '/pages/mine/mine' }) }
]

function money(n) {
  return formatMoney(n)
}

function goFlow() {
  uni.switchTab({ url: '/pages/flow/flow' })
}

onShow(() => {
  tick.value += 1
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20rpx 24rpx 40rpx;
}
.quick {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 8rpx;
}
.quick-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.quick-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #eef9f4;
  color: #1aad19;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
}
.quick-text {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #353535;
}
.banner {
  margin-top: 16rpx;
  background: #fff7e8;
  border-radius: 12rpx;
  padding: 18rpx 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.banner-text {
  font-size: 24rpx;
  color: #8a5a00;
}
.banner-link {
  font-size: 24rpx;
  color: #1aad19;
}
.card {
  margin-top: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
}
.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16rpx;
}
.hero-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.eye {
  font-size: 24rpx;
  color: #1aad19;
}
.hero-label {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8a8a;
}
.hero-expense {
  display: block;
  margin-top: 8rpx;
  font-size: 52rpx;
  font-weight: 700;
  color: #1a1a1a;
}
.hero-row {
  margin-top: 16rpx;
  display: flex;
  justify-content: space-between;
  font-size: 26rpx;
  color: #576b95;
}
.report-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.report-row:last-child {
  border-bottom: none;
}
.report-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.dot {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  background: #eef9f4;
}
.dot.today {
  background: #e8f5e9;
}
.dot.week {
  background: #e3f2fd;
}
.dot.month {
  background: #fff3e0;
}
.report-name {
  display: block;
  font-size: 28rpx;
  color: #1a1a1a;
}
.report-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #b2b2b2;
}
.report-right {
  text-align: right;
}
.income {
  display: block;
  font-size: 24rpx;
  color: #fa5151;
}
.expense {
  display: block;
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #4a90e2;
}
.month-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.muted {
  font-size: 24rpx;
  color: #8a8a8a;
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
</style>
