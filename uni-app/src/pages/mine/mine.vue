<template>
  <view class="page">
    <!-- 用户信息 -->
    <view class="profile" @click="onProfileClick">
      <image v-if="user?.avatarUrl" class="avatar" :src="user.avatarUrl" mode="aspectFill" />
      <view v-else class="avatar avatar-fallback">{{ avatarText }}</view>
      <view class="profile-main">
        <text class="name">{{ user?.nickName || '未登录' }}</text>
        <text class="sub">{{ user ? '已微信登录' : '点击前往登录' }}</text>
      </view>
      <text class="arrow">></text>
    </view>

    <!-- 功能卡片：等高对齐 -->
    <view class="grid">
      <view class="grid-card" @click="toast('封账功能稍后完善')">
        <text class="grid-title">封账</text>
        <text class="grid-desc">封存部分流水防止修改</text>
      </view>
      <view class="grid-card" @click="exportData">
        <text class="grid-title">数据导出</text>
        <text class="grid-desc">一键导出流水、报表数据</text>
      </view>
      <view class="grid-card" @click="toast('导入功能稍后完善')">
        <text class="grid-title">数据导入</text>
        <text class="grid-desc">支持导入支付宝、微信等账单</text>
        <text class="badge">限时免费</text>
      </view>
      <view class="grid-card" @click="goRecord">
        <text class="grid-title">增值功能</text>
        <text class="grid-desc">管理 AI 记账等功能使用</text>
      </view>
    </view>

    <text class="section">基础功能</text>
    <view class="list">
      <view class="row" @click="goTags">
        <view class="row-left">
          <view class="row-icon">标</view>
          <text class="row-title">分类标签</text>
        </view>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="goStats">
        <view class="row-left">
          <view class="row-icon">预</view>
          <text class="row-title">预算中心</text>
        </view>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="goStats">
        <view class="row-left">
          <view class="row-icon">图</view>
          <text class="row-title">图表分析</text>
        </view>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="goFlow">
        <view class="row-left">
          <view class="row-icon">流</view>
          <text class="row-title">全部流水</text>
        </view>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="clearAll">
        <view class="row-left">
          <view class="row-icon danger">清</view>
          <text class="row-title">清空本地账单</text>
        </view>
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
      <text class="card-title">语音识别</text>
      <text class="line">已配置同声传译插件，真机可长按说话记账。</text>
      <text class="line">请在隐私指引中声明「访问你的麦克风」。</text>
    </view>

    <view v-if="user" class="logout" @click="onLogout">退出登录</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getApiBase, healthCheck, setApiBase } from '../../utils/api.js'
import { clearBills, listBills } from '../../utils/storage.js'
import { clearUser, getUser } from '../../utils/user.js'

const apiBase = ref(getApiBase())
const statusText = ref('尚未检测')
const user = ref(getUser())

const avatarText = computed(() => (user.value?.nickName || '未').slice(0, 1))

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
function goTags() {
  uni.navigateTo({ url: '/pages/tags/tags' })
}
function onProfileClick() {
  if (!user.value) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  uni.showToast({ title: `当前用户：${user.value.nickName}`, icon: 'none' })
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

function onLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定退出当前微信登录吗？',
    success: (res) => {
      if (!res.confirm) return
      clearUser()
      user.value = null
      uni.reLaunch({ url: '/pages/login/login' })
    }
  })
}

onShow(() => {
  apiBase.value = getApiBase()
  user.value = getUser()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
}
.profile {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background: #eef9f4;
  flex-shrink: 0;
}
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1aad19;
  font-size: 36rpx;
  font-weight: 700;
}
.profile-main {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8a8a;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.grid-card {
  width: calc(50% - 8rpx);
  min-height: 168rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.grid-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}
.grid-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #8a8a8a;
  line-height: 1.45;
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
  min-height: 104rpx;
  padding: 0 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.row:last-child {
  border-bottom: none;
}
.row-left {
  display: flex;
  align-items: center;
}
.row-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  background: #eef9f4;
  color: #1aad19;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18rpx;
  font-size: 24rpx;
  font-weight: 600;
}
.row-icon.danger {
  background: #fff1f0;
  color: #fa5151;
}
.row-title {
  font-size: 30rpx;
  color: #1a1a1a;
}
.arrow {
  color: #c0c0c0;
  font-size: 28rpx;
}
.card {
  padding: 28rpx;
  margin-bottom: 16rpx;
}
.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12rpx;
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
  color: #353535;
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
.line {
  display: block;
  font-size: 26rpx;
  color: #353535;
  line-height: 1.6;
  margin-bottom: 6rpx;
}
.logout {
  margin-top: 24rpx;
  height: 88rpx;
  border-radius: 16rpx;
  background: #fff;
  color: #fa5151;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
</style>
