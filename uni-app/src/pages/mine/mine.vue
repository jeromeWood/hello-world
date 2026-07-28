<template>
  <view class="page">
    <view class="card">
      <text class="title">我的</text>
      <text class="desc">账户与服务设置</text>
    </view>

    <view class="card">
      <text class="section">后端服务</text>
      <text class="label">API 地址</text>
      <input
        class="input"
        v-model="apiBase"
        placeholder="http://127.0.0.1:3000"
      />
      <view class="actions">
        <view class="btn ghost" @click="saveBase">
          <text>保存地址</text>
        </view>
        <view class="btn primary" @click="ping">
          <text>检测连接</text>
        </view>
      </view>
      <text class="status">{{ statusText }}</text>
    </view>

    <view class="card">
      <text class="section">语音识别</text>
      <text class="line">已启用微信同声传译插件（WechatSI）。</text>
      <text class="line">首页长按「按住 说话」即可语音记账。</text>
      <text class="line">首次使用请允许麦克风权限；模拟器可能不弹窗，建议真机预览。</text>
      <text class="line">若白屏，请确认公众平台插件版本与 manifest 中 version 一致。</text>
    </view>

    <view class="card">
      <text class="section">说明</text>
      <text class="line">1. 本机先启动 server：`cd server && npm install && npm run dev`</text>
      <text class="line">2. 微信开发者工具需关闭域名校验（详情 → 本地设置）</text>
      <text class="line">3. 未配置 AI_API_KEY 时，后端使用本地规则引擎</text>
      <text class="line">4. 支持一次输入多笔：咖啡10块，停车4块，吃饭20</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getApiBase, healthCheck, setApiBase } from '../../utils/api.js'

const apiBase = ref(getApiBase())
const statusText = ref('尚未检测')

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

onShow(() => {
  apiBase.value = getApiBase()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #8a8a8a;
}

.section {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20rpx;
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
  padding: 20rpx 24rpx;
  font-size: 28rpx;
}

.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.btn {
  flex: 1;
  height: 80rpx;
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
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #576b95;
}

.line {
  display: block;
  font-size: 26rpx;
  color: #353535;
  line-height: 1.6;
  margin-bottom: 8rpx;
}
</style>
