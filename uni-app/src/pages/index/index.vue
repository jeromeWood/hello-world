<template>
  <view class="page-shell flex flex-col">
    <!-- 顶部：日期 + 欢迎语 -->
    <view class="px-8 pt-6 pb-4">
      <text class="block text-[26rpx] text-soft-mute tracking-wide">
        {{ dateLabel }}
      </text>
      <text class="mt-2 block text-[44rpx] font-semibold text-ink-900 leading-tight">
        {{ greeting }}，开始记账吧
      </text>
      <text class="mt-3 block text-[28rpx] text-ink-500 leading-relaxed">
        长按说话或输入文字，AI 帮你自动识别金额与分类
      </text>
    </view>

    <!-- 中间主操作区 -->
    <view class="flex-1 flex flex-col justify-center px-8 pb-8">
      <!-- 仿微信语音：长按录音按钮 -->
      <view
        class="voice-btn"
        :class="{ 'voice-btn-active': isRecording }"
        @touchstart.prevent="onVoiceStart"
        @touchend.prevent="onVoiceEnd"
        @touchcancel.prevent="onVoiceEnd"
      >
        {{ isRecording ? '松开发送' : '按住 说话' }}
      </view>

      <!-- 录音态提示（静态展示用） -->
      <view
        v-if="isRecording"
        class="mt-4 flex items-center justify-center"
      >
        <view class="flex items-end gap-1 h-8">
          <view
            v-for="n in 5"
            :key="n"
            class="w-1 rounded-full bg-brand-500 animate-pulse"
            :style="{ height: `${12 + n * 4}rpx`, animationDelay: `${n * 80}ms` }"
          />
        </view>
        <text class="ml-3 text-[24rpx] text-brand-600">正在聆听…</text>
      </view>

      <!-- 文本输入框 -->
      <view class="mt-8">
        <view
          class="rounded-voice bg-white border border-soft-line px-4 py-3"
        >
          <textarea
            v-model="inputText"
            class="w-full text-[30rpx] text-ink-900 leading-relaxed"
            style="min-height: 160rpx; width: 100%"
            placeholder="也可以直接输入，例如：午饭花了 32 元"
            placeholder-class="text-soft-mute"
            :maxlength="200"
            :auto-height="true"
            :show-confirm-bar="false"
          />
        </view>

        <view class="mt-4 flex justify-end">
          <view
            class="rounded-voice px-8 py-3 text-[28rpx] text-white"
            :class="inputText.trim() ? 'bg-brand-500' : 'bg-soft-mute'"
          >
            发送
          </view>
        </view>
      </view>
    </view>

    <!-- 底部占位，避免内容被原生 tabBar 遮挡 -->
    <view class="h-4" />
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
