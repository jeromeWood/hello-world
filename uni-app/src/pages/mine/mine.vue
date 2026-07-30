<template>
  <view class="page">
    <!-- 功能卡片 -->
    <view class="grid">
      <view class="grid-card" @click="toast('封账功能稍后完善')">
        <text class="grid-title">封账</text>
        <text class="grid-desc">封存部分流水防止修改</text>
      </view>
      <view class="grid-card" @click="exportData">
        <text class="grid-title">数据导出</text>
        <text class="grid-desc">一键导出流水数据</text>
      </view>
      <view class="grid-card" @click="toast('导入功能稍后完善')">
        <text class="grid-title">数据导入</text>
        <text class="grid-desc">支持导入微信等账单</text>
        <text class="badge">敬请期待</text>
      </view>
      <view class="grid-card" @click="goRecord">
        <text class="grid-title">AI 记账</text>
        <text class="grid-desc">语音/文字智能识别</text>
      </view>
    </view>

    <text class="section">基础功能</text>
    <view class="list">
      <view class="row" @click="goStats">
        <text>预算中心</text>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="goStats">
        <text>图表分析</text>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="goFlow">
        <text>全部流水</text>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="clearAll">
        <text>清空本地账单</text>
        <text class="arrow">></text>
      </view>
    </view>

    <text class="section">后端服务</text>
    <view class="card">
      <text class="label">API 地址</text>
      <input v-model="apiBase" class="input" placeholder="http://127.0.0.1:3000" />
      <view class="actions">
        <view class="btn ghost" @click="saveBase">保存</view>
        <view class="btn primary" @click="ping">检测连接</view>
      </view>
      <text class="status">{{ statusText }}</text>
    </view>

    <view class="card">
      <text class="section-inline">语音识别</text>
      <text class="line">已配置同声传译插件。真机可长按说话记账。</text>
      <text class="line">请在隐私指引中声明「访问你的麦克风」。</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getApiBase, healthCheck, setApiBase } from '../../utils/api.js'
import { clearBills, listBills } from '../../utils/storage.js'

const apiBase = ref(getApiBase())
const statusText = ref('尚未检测')

function toast(title) {
  uni.showToast({ title, icon: 'none' })
}
function goRecord() {
  uni.switchTab({ url: '/pages/record/record' })
}
function goStats() {
  uni.switchTab({ url: '/pages/stats/stats' })
}
function goFlow() {
  uni.switchTab({ url: '/pages/flow/flow' })
}

function saveBase() {
  setApiBase(apiBase.value.trim() || 'http://127.0.0.1:3000')
  apiBase.value = getApiBase()
  uni.showToast({ title: '已保存', icon: 'success' })
}

async function ping() {
  statusText.value = '检测中…'
  try {
    setApiBase(apiBase.value.trim())
    const res = await healthCheck()
    statusText.value = `连接成功 · AI=${res.ai || 'unknown'}`
    uni.showToast({ title: '连接成功', icon: 'success' })
  } catch (e) {
    statusText.value = '连接失败，请确认后端已启动'
    uni.showToast({ title: '连接失败', icon: 'none' })
  }
}

function exportData() {
  const bills = listBills()
  if (!bills.length) {
    uni.showToast({ title: '暂无数据可导出', icon: 'none' })
    return
  }
  const text = bills
    .map(
      (b) =>
        `${b.date} ${b.time || ''} ${b.type} ${b.categoryName} ${b.amount} ${b.note || ''}`
    )
    .join('\n')
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
  })
}

function clearAll() {
  uni.showModal({
    title: '清空账单',
    content: '将删除本地全部流水，确定吗？',
    success: (res) => {
      if (!res.confirm) return
      clearBills()
      uni.showToast({ title: '已清空', icon: 'success' })
    }
  })
}

onShow(() => {
  apiBase.value = getApiBase()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20rpx 24rpx 40rpx;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.grid-card {
  width: calc(50% - 8rpx);
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  position: relative;
  box-sizing: border-box;
}
.grid-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}
.grid-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #8a8a8a;
  line-height: 1.4;
}
.badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  background: #fa5151;
  color: #fff;
  font-size: 18rpx;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
}
.section {
  display: block;
  margin: 28rpx 8rpx 12rpx;
  font-size: 26rpx;
  color: #8a8a8a;
}
.list,
.card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 30rpx;
  color: #1a1a1a;
}
.row:last-child {
  border-bottom: none;
}
.arrow {
  color: #c0c0c0;
}
.card {
  padding: 28rpx;
  margin-bottom: 16rpx;
}
.label {
  display: block;
  font-size: 26rpx;
  color: #8a8a8a;
  margin-bottom: 12rpx;
}
.input {
  background: #f7f8fa;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  font-size: 28rpx;
}
.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}
.btn {
  flex: 1;
  height: 76rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}
.btn.ghost {
  background: #f5f5f5;
}
.btn.primary {
  background: #1aad19;
  color: #fff;
}
.status {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #576b95;
}
.section-inline {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.line {
  display: block;
  font-size: 26rpx;
  color: #353535;
  line-height: 1.6;
  margin-bottom: 6rpx;
}
</style>
