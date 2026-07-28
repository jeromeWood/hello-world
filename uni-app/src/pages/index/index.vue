<template>
  <view class="page">
    <view class="header">
      <text class="date">{{ dateLabel }}</text>
      <text class="title">{{ greeting }}，开始记账吧</text>
      <text class="subtitle">长按说话或输入文字，自动识别金额与分类</text>
    </view>

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
      <view v-else-if="voiceHint" class="listening">
        <text class="hint-text">{{ voiceHint }}</text>
      </view>

      <view class="input-wrap">
        <textarea
          v-model="inputText"
          class="input"
          placeholder="例如：午饭花了 32 元 / 收到工资 12000"
          placeholder-class="placeholder"
          :maxlength="200"
          :auto-height="true"
          :show-confirm-bar="false"
        />
      </view>

      <view class="send-row">
        <view
          class="send-btn"
          :class="{ ready: !!inputText.trim() }"
          @click="onSendText"
        >
          <text class="send-text">发送</text>
        </view>
      </view>

      <view v-if="recentTip" class="recent-tip">
        <text class="recent-text">{{ recentTip }}</text>
      </view>
    </view>

    <!-- 解析确认弹层 -->
    <view v-if="showConfirm" class="mask" @click="closeConfirm">
      <view class="sheet" @click.stop>
        <text class="sheet-title">确认记账</text>
        <view class="row">
          <text class="label">类型</text>
          <text class="value">{{ pending.type === 'income' ? '收入' : '支出' }}</text>
        </view>
        <view class="row">
          <text class="label">金额</text>
          <text class="value amount" :class="pending.type">
            {{ pending.type === 'income' ? '+' : '-' }}¥{{ pending.amount }}
          </text>
        </view>
        <view class="row">
          <text class="label">分类</text>
          <text class="value">{{ pending.categoryName }}</text>
        </view>
        <view class="row">
          <text class="label">备注</text>
          <text class="value">{{ pending.note }}</text>
        </view>
        <view class="sheet-actions">
          <view class="btn ghost" @click="closeConfirm">
            <text>取消</text>
          </view>
          <view class="btn primary" @click="confirmSave">
            <text>保存</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { aiParse } from '../../utils/api.js'
import { parseBookkeepingText } from '../../utils/parser.js'
import { addBill } from '../../utils/storage.js'
import { isVoiceAvailable, startVoiceRecognize, stopVoiceRecognize } from '../../utils/voice.js'

const isRecording = ref(false)
const inputText = ref('')
const voiceHint = ref('')
const recentTip = ref('')
const showConfirm = ref(false)
const pending = ref({
  type: 'expense',
  amount: 0,
  categoryName: '',
  note: '',
  categoryId: '',
  rawText: '',
  source: 'text'
})

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

function openConfirm(record) {
  pending.value = { ...record }
  showConfirm.value = true
}

function closeConfirm() {
  showConfirm.value = false
}

async function handleParse(text, source) {
  uni.showLoading({ title: '识别中', mask: true })
  let result = null
  try {
    result = await aiParse(text)
  } catch (e) {
    result = null
  }
  uni.hideLoading()

  if (!result || !result.ok) {
    result = parseBookkeepingText(text)
  }
  if (!result.ok) {
    uni.showToast({ title: result.error || '识别失败', icon: 'none', duration: 2500 })
    return
  }
  openConfirm({ ...result.record, source })
}

function onSendText() {
  const text = inputText.value.trim()
  if (!text) {
    uni.showToast({ title: '请先输入内容', icon: 'none' })
    return
  }
  handleParse(text, 'text')
}

function confirmSave() {
  const bill = addBill(pending.value)
  showConfirm.value = false
  inputText.value = ''
  voiceHint.value = ''
  const sign = bill.type === 'income' ? '+' : '-'
  recentTip.value = `已记账：${bill.categoryName} ${sign}¥${bill.amount}`
  uni.showToast({ title: '记账成功', icon: 'success' })
}

function onVoiceStart() {
  voiceHint.value = ''
  isRecording.value = true

  const ok = startVoiceRecognize({
    onError: () => {
      // 插件不可用时，松手再提示
    }
  })

  if (!ok) {
    // 无语音插件时仍展示按压态，松手提示改用文字
  }
}

function onVoiceEnd() {
  if (!isRecording.value) return
  isRecording.value = false

  if (!isVoiceAvailable()) {
    voiceHint.value = '当前未配置语音识别插件，请直接输入文字记账'
    uni.showToast({ title: '请使用文字输入', icon: 'none' })
    return
  }

  stopVoiceRecognize({
    onResult: (text) => {
      if (!text) {
        uni.showToast({ title: '没听清，请再说一次或改用文字', icon: 'none' })
        return
      }
      inputText.value = text
      handleParse(text, 'voice')
    },
    onError: () => {
      voiceHint.value = '语音识别失败，请改用文字输入'
      uni.showToast({ title: '识别失败', icon: 'none' })
    }
  })
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

.listening,
.recent-tip {
  margin-top: 20rpx;
  display: flex;
  justify-content: center;
}

.listening-text {
  font-size: 24rpx;
  color: #179b16;
}

.hint-text,
.recent-text {
  font-size: 24rpx;
  color: #8a8a8a;
  text-align: center;
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

.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
}

.sheet-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 28rpx;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.label {
  font-size: 28rpx;
  color: #8a8a8a;
}

.value {
  font-size: 28rpx;
  color: #1a1a1a;
  max-width: 70%;
  text-align: right;
}

.amount.expense {
  color: #fa5151;
}

.amount.income {
  color: #1aad19;
}

.sheet-actions {
  margin-top: 36rpx;
  display: flex;
  gap: 24rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.btn.ghost {
  background: #f5f5f5;
  color: #353535;
}

.btn.primary {
  background: #1aad19;
  color: #fff;
}
</style>
