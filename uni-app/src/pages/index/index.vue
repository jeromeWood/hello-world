<template>
  <view class="page">
    <view class="header">
      <text class="date">{{ dateLabel }}</text>
      <text class="title">{{ greeting }}，开始记账吧</text>
      <text class="subtitle">支持一次输入多笔，例如：咖啡10块，停车4块，吃饭20</text>
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
          placeholder="例如：我买咖啡10块，停车4块&#10;吃饭20"
          placeholder-class="placeholder"
          :maxlength="500"
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

    <!-- 多条确认弹层 -->
    <view v-if="showConfirm" class="mask" @click="closeConfirm">
      <view class="sheet" @click.stop>
        <text class="sheet-title">确认记账（{{ pendingList.length }} 笔）</text>

        <scroll-view scroll-y class="sheet-list">
          <view v-for="(item, idx) in pendingList" :key="idx" class="item">
            <view class="item-main">
              <text class="item-cat">{{ item.categoryName }}</text>
              <text class="item-note">{{ item.note }}</text>
            </view>
            <view class="item-right">
              <text class="item-amount" :class="item.type">
                {{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount }}
              </text>
              <text class="item-del" @click="removePending(idx)">删除</text>
            </view>
          </view>
        </scroll-view>

        <view class="sheet-actions">
          <view class="btn ghost" @click="closeConfirm">
            <text>取消</text>
          </view>
          <view class="btn primary" :class="{ disabled: !pendingList.length }" @click="confirmSave">
            <text>全部保存</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { aiParse } from '../../utils/api.js'
import { normalizeParseResult, parseBookkeepingText } from '../../utils/parser.js'
import { addBill } from '../../utils/storage.js'
import { isVoiceAvailable, startVoiceRecognize, stopVoiceRecognize } from '../../utils/voice.js'

const isRecording = ref(false)
const inputText = ref('')
const voiceHint = ref('')
const recentTip = ref('')
const showConfirm = ref(false)
const pendingList = ref([])
const voiceStarting = ref(false)

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

function openConfirm(records) {
  pendingList.value = records.map((r) => ({ ...r }))
  showConfirm.value = true
}

function closeConfirm() {
  showConfirm.value = false
}

function removePending(idx) {
  pendingList.value.splice(idx, 1)
  if (!pendingList.value.length) showConfirm.value = false
}

async function handleParse(text, source) {
  uni.showLoading({ title: '识别中', mask: true })
  let result = null
  try {
    result = normalizeParseResult(await aiParse(text), source)
  } catch (e) {
    result = null
  }
  uni.hideLoading()

  if (!result || !result.ok) {
    result = parseBookkeepingText(text, source)
  }
  if (!result.ok) {
    uni.showToast({ title: result.error || '识别失败', icon: 'none', duration: 2500 })
    return
  }
  openConfirm(result.records)
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
  if (!pendingList.value.length) return
  const saved = pendingList.value.map((item) => addBill(item))
  showConfirm.value = false
  inputText.value = ''
  voiceHint.value = ''
  recentTip.value = `已记账 ${saved.length} 笔，合计可在账单页查看`
  uni.showToast({ title: `已保存 ${saved.length} 笔`, icon: 'success' })
}

async function onVoiceStart() {
  voiceHint.value = ''
  isRecording.value = true
  voiceStarting.value = true

  const ok = await startVoiceRecognize({
    onStart: () => {
      voiceStarting.value = false
    },
    onError: (err) => {
      voiceStarting.value = false
      if (err && err.message === 'RECORD_DENIED') {
        voiceHint.value = '未获得麦克风权限'
      }
    }
  })

  voiceStarting.value = false
  if (!ok) {
    // 仍保持按压态，松手时提示
  }
}

function onVoiceEnd() {
  if (!isRecording.value) return
  isRecording.value = false

  if (!isVoiceAvailable()) {
    voiceHint.value = '请先在微信公众平台添加「同声传译」插件，或改用文字输入'
    uni.showToast({ title: '语音插件未就绪', icon: 'none' })
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
  max-height: 75vh;
  display: flex;
  flex-direction: column;
}

.sheet-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20rpx;
}

.sheet-list {
  max-height: 46vh;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.item-cat {
  display: block;
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.item-note {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a8a8a;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.item-amount {
  font-size: 30rpx;
  font-weight: 600;
}

.item-amount.expense {
  color: #fa5151;
}

.item-amount.income {
  color: #1aad19;
}

.item-del {
  font-size: 22rpx;
  color: #b2b2b2;
}

.sheet-actions {
  margin-top: 28rpx;
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

.btn.disabled {
  opacity: 0.5;
}
</style>
