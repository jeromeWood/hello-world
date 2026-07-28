<template>
  <view class="page">
    <!-- 顶部：日期 + 欢迎语 -->
    <view class="header">
      <text class="date">{{ dateLabel }}</text>
      <text class="title">{{ greeting }}，开始记账吧</text>
      <text class="subtitle">长按说话或输入文字，AI 帮你自动识别金额与分类</text>
    </view>

    <!-- 中间主操作区 -->
    <view class="main">
      <view
        class="voice-btn"
        :class="{ active: isRecording }"
        @touchstart.prevent="onVoiceStart"
        @touchend.prevent="onVoiceEnd"
        @touchcancel.prevent="onVoiceEnd"
      >
        <text class="voice-text">{{ isRecording ? '松开发送' : '按住 说话' }}</text>
      </view>

      <view v-if="isRecording" class="listening">
        <text class="listening-text">正在聆听…</text>
      </view>

      <view class="input-wrap">
        <textarea
          v-model="inputText"
          class="input"
          placeholder="也可以直接输入，例如：午饭花了 32 元"
          placeholder-class="placeholder"
          :maxlength="200"
          :auto-height="true"
          :show-confirm-bar="false"
        />
      </view>

      <view class="send-row">
        <view class="send-btn" :class="{ ready: !!inputText.trim() }">
          <text class="send-text">发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'

const isRecording = ref(false)
const inputText = ref('')
const now = new Date()
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const dateLabel = computed(() => {
  const m = now.getMonth() + 1
  const d = now.getDate()
  const w = weekdays[now.getDay()]
  return `${m}月${d}日 星期${w}`
})

const greeting = computed(() => {
  const hour = now.getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

function onVoiceStart() {
  isRecording.value = true
}

function onVoiceEnd() {
  isRecording.value = false
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 40rpx 40rpx;
  background: #f7f8fa;
}

.header {
  padding-top: 12rpx;
  padding-bottom: 24rpx;
}

.date {
  display: block;
  font-size: 26rpx;
  color: #b2b2b2;
}

.title {
  display: block;
  margin-top: 12rpx;
  font-size: 44rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.subtitle {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #576b95;
  line-height: 1.5;
}

.main {
  margin-top: 80rpx;
}

.voice-btn {
  height: 96rpx;
  border-radius: 12rpx;
  background: #f7f7f7;
  border: 1rpx solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-btn.active {
  background: #c6c6c6;
  border-color: #b5b5b5;
}

.voice-text {
  font-size: 32rpx;
  color: #353535;
}

.listening {
  margin-top: 20rpx;
  display: flex;
  justify-content: center;
}

.listening-text {
  font-size: 24rpx;
  color: #179b16;
}

.input-wrap {
  margin-top: 48rpx;
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 24rpx;
}

.input {
  width: 100%;
  min-height: 160rpx;
  font-size: 30rpx;
  color: #1a1a1a;
  line-height: 1.5;
}

.placeholder {
  color: #b2b2b2;
}

.send-row {
  margin-top: 24rpx;
  display: flex;
  justify-content: flex-end;
}

.send-btn {
  padding: 16rpx 48rpx;
  border-radius: 12rpx;
  background: #b2b2b2;
}

.send-btn.ready {
  background: #1aad19;
}

.send-text {
  font-size: 28rpx;
  color: #ffffff;
}
</style>
