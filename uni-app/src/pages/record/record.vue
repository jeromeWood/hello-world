<template>
  <view class="page">
    <!-- 模式切换 -->
    <view class="tabs">
      <view class="tab" :class="{ active: mode === 'ai' }" @click="mode = 'ai'">AI 识别</view>
      <view class="tab" :class="{ active: mode === 'manual' }" @click="mode = 'manual'">手动输入</view>
    </view>

    <!-- 类型：支出/收入 -->
    <view class="type-tabs">
      <view class="type" :class="{ on: billType === 'expense' }" @click="billType = 'expense'">支出</view>
      <view class="type" :class="{ on: billType === 'income' }" @click="billType = 'income'">收入</view>
    </view>

    <!-- AI 模式 -->
    <view v-if="mode === 'ai'" class="ai-box">
      <view
        class="voice-btn"
        :class="{ active: isRecording }"
        @touchstart.prevent="onVoiceStart"
        @touchend.prevent="onVoiceEnd"
        @touchcancel.prevent="onVoiceEnd"
      >
        {{ isRecording ? '松开发送' : '按住 说话' }}
      </view>
      <text v-if="voiceHint" class="hint">{{ voiceHint }}</text>

      <view class="input-wrap">
        <textarea
          v-model="aiText"
          class="textarea"
          placeholder="例如：咖啡10块，停车4块，吃饭20"
          placeholder-class="ph"
          :maxlength="500"
          :auto-height="true"
          :show-confirm-bar="false"
        />
      </view>
      <view class="ai-send" :class="{ ready: !!aiText.trim() }" @click="onAiSend">识别并记账</view>
    </view>

    <!-- 手动模式 -->
    <view v-else class="manual-box">
      <view class="amount-row">
        <text class="amount" :class="billType">{{ displayAmount }}</text>
      </view>

      <view class="field" @click="pickCategory">
        <text class="label">分类</text>
        <text class="value">{{ categoryName }} ></text>
      </view>
      <view class="field">
        <text class="label">备注</text>
        <input v-model="note" class="note-input" placeholder="可选备注" placeholder-class="ph" />
      </view>

      <!-- 数字键盘 -->
      <view class="keypad">
        <view class="keys">
          <view v-for="k in keys" :key="k" class="key" @click="onKey(k)">{{ k }}</view>
        </view>
        <view class="side">
          <view class="key side-key" @click="onKey('del')">删除</view>
          <view class="key side-key confirm" @click="onManualSave">确定</view>
        </view>
      </view>
    </view>

    <!-- 多条确认 -->
    <view v-if="showConfirm" class="mask" @click="showConfirm = false">
      <view class="sheet" @click.stop>
        <text class="sheet-title">确认记账（{{ pendingList.length }} 笔）</text>
        <scroll-view scroll-y class="sheet-list">
          <view v-for="(item, idx) in pendingList" :key="idx" class="item">
            <view>
              <text class="item-cat">{{ item.categoryName }}</text>
              <text class="item-note">{{ item.note }}</text>
            </view>
            <view class="item-right">
              <text class="item-amt" :class="item.type">
                {{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount }}
              </text>
              <text class="item-del" @click="pendingList.splice(idx, 1)">删除</text>
            </view>
          </view>
        </scroll-view>
        <view class="sheet-actions">
          <view class="btn ghost" @click="showConfirm = false">取消</view>
          <view class="btn primary" @click="confirmSave">全部保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { aiParse } from '../../utils/api.js'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories.js'
import { normalizeParseResult, parseBookkeepingText } from '../../utils/parser.js'
import { addBill } from '../../utils/storage.js'
import { isVoiceAvailable, startVoiceRecognize, stopVoiceRecognize } from '../../utils/voice.js'

const mode = ref('ai')
const billType = ref('expense')
const aiText = ref('')
const voiceHint = ref('')
const isRecording = ref(false)
const amountStr = ref('0')
const note = ref('')
const categoryId = ref('food')
const categoryName = ref('餐饮')
const showConfirm = ref(false)
const pendingList = ref([])

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C']

const categories = computed(() =>
  billType.value === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
)

const displayAmount = computed(() => {
  const n = Number(amountStr.value)
  if (Number.isNaN(n)) return '0.00'
  return n.toFixed(2)
})

watch(billType, () => {
  const first = categories.value[0]
  categoryId.value = first.id
  categoryName.value = first.name
})

function onKey(k) {
  if (k === 'C') {
    amountStr.value = '0'
    return
  }
  if (k === 'del') {
    amountStr.value = amountStr.value.length <= 1 ? '0' : amountStr.value.slice(0, -1)
    return
  }
  if (k === '.') {
    if (!amountStr.value.includes('.')) amountStr.value += '.'
    return
  }
  if (amountStr.value === '0') amountStr.value = k
  else if (amountStr.value.replace('.', '').length < 9) amountStr.value += k
}

function pickCategory() {
  uni.showActionSheet({
    itemList: categories.value.map((c) => c.name),
    success: (res) => {
      const c = categories.value[res.tapIndex]
      categoryId.value = c.id
      categoryName.value = c.name
    }
  })
}

function onManualSave() {
  const amount = Number(amountStr.value)
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入金额', icon: 'none' })
    return
  }
  addBill({
    type: billType.value,
    amount,
    categoryId: categoryId.value,
    categoryName: categoryName.value,
    note: note.value || categoryName.value,
    source: 'manual'
  })
  amountStr.value = '0'
  note.value = ''
  uni.showToast({ title: '已记账', icon: 'success' })
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
  if (!result || !result.ok) result = parseBookkeepingText(text, source)
  if (!result.ok) {
    uni.showToast({ title: result.error || '识别失败', icon: 'none' })
    return
  }
  pendingList.value = result.records.map((r) => ({ ...r }))
  showConfirm.value = true
}

function onAiSend() {
  const text = aiText.value.trim()
  if (!text) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  handleParse(text, 'text')
}

function confirmSave() {
  if (!pendingList.value.length) return
  pendingList.value.forEach((item) => addBill(item))
  const n = pendingList.value.length
  showConfirm.value = false
  pendingList.value = []
  aiText.value = ''
  voiceHint.value = ''
  uni.showToast({ title: `已保存 ${n} 笔`, icon: 'success' })
}

async function onVoiceStart() {
  voiceHint.value = ''
  isRecording.value = true
  await startVoiceRecognize({
    onError: (err) => {
      if (err?.message === 'RECORD_DENIED') voiceHint.value = '未获得麦克风权限'
      else if (err?.message === 'VOICE_UNAVAILABLE') voiceHint.value = '语音插件未启用，可用文字'
    }
  })
}

function onVoiceEnd() {
  if (!isRecording.value) return
  isRecording.value = false
  if (!isVoiceAvailable()) {
    voiceHint.value = voiceHint.value || '语音不可用，请用文字或切到手动'
    return
  }
  stopVoiceRecognize({
    onResult: (text) => {
      if (!text) {
        uni.showToast({ title: '没听清，请重试', icon: 'none' })
        return
      }
      aiText.value = text
      handleParse(text, 'voice')
    },
    onError: () => {
      voiceHint.value = '识别失败，可改用文字或手动输入'
    }
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20rpx 24rpx 40rpx;
}
.tabs,
.type-tabs {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}
.tab,
.type {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  color: #8a8a8a;
}
.tab.active,
.type.on {
  color: #1aad19;
  font-weight: 600;
  border-bottom: 4rpx solid #1aad19;
}
.ai-box,
.manual-box {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
}
.voice-btn {
  height: 88rpx;
  border-radius: 12rpx;
  background: #f7f7f7;
  border: 1rpx solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: #353535;
}
.voice-btn.active {
  background: #c6c6c6;
}
.hint {
  display: block;
  margin-top: 12rpx;
  text-align: center;
  font-size: 22rpx;
  color: #8a8a8a;
}
.input-wrap {
  margin-top: 24rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 20rpx;
}
.textarea {
  width: 100%;
  min-height: 140rpx;
  font-size: 28rpx;
}
.ph {
  color: #b2b2b2;
}
.ai-send {
  margin-top: 24rpx;
  height: 84rpx;
  border-radius: 12rpx;
  background: #b2b2b2;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
.ai-send.ready {
  background: #1aad19;
}
.amount-row {
  padding: 20rpx 0 28rpx;
  border-bottom: 2rpx solid #1aad19;
}
.amount {
  font-size: 64rpx;
  font-weight: 700;
  color: #1aad19;
}
.amount.expense {
  color: #4a90e2;
}
.amount.income {
  color: #fa5151;
}
.field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.label {
  font-size: 28rpx;
  color: #8a8a8a;
}
.value {
  font-size: 28rpx;
  color: #1a1a1a;
}
.note-input {
  text-align: right;
  font-size: 28rpx;
  flex: 1;
  margin-left: 24rpx;
}
.keypad {
  margin-top: 24rpx;
  display: flex;
  gap: 12rpx;
}
.keys {
  flex: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.key {
  width: calc((100% - 24rpx) / 3);
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #1a1a1a;
}
.side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.side-key {
  width: 100%;
  flex: 1;
}
.confirm {
  background: #1aad19;
  color: #fff;
  flex: 2;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 36rpx 36rpx calc(36rpx + env(safe-area-inset-bottom));
  max-height: 70vh;
}
.sheet-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.sheet-list {
  max-height: 40vh;
}
.item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.item-cat {
  display: block;
  font-size: 28rpx;
  color: #1a1a1a;
}
.item-note {
  display: block;
  font-size: 22rpx;
  color: #8a8a8a;
}
.item-right {
  text-align: right;
}
.item-amt.expense {
  color: #4a90e2;
}
.item-amt.income {
  color: #fa5151;
}
.item-del {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #b2b2b2;
}
.sheet-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.btn {
  flex: 1;
  height: 84rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn.ghost {
  background: #f5f5f5;
}
.btn.primary {
  background: #1aad19;
  color: #fff;
}
</style>
