<template>
  <view class="splash" @click="enterNext">
    <image class="bg" src="/static/splash/ad.jpg" mode="aspectFill" />
    <view class="overlay">
      <text class="brand">智记</text>
      <text class="slogan">说话就能记账</text>
      <view class="cta">
        <text class="cta-text">{{ countdown > 0 ? `${countdown}s 后进入` : '点击进入' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { isLoggedIn } from '../../utils/user.js'

const countdown = ref(2)
let timer = null
let entered = false

function enterNext() {
  if (entered) return
  entered = true
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (isLoggedIn()) {
    uni.switchTab({
      url: '/pages/index/index',
      fail: () => uni.reLaunch({ url: '/pages/index/index' })
    })
  } else {
    uni.reLaunch({ url: '/pages/login/login' })
  }
}

onLoad(() => {
  timer = setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0
      enterNext()
      return
    }
    countdown.value -= 1
  }, 1000)
})

onUnload(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.splash {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #1a3a2a;
}

.bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 80rpx 48rpx calc(80rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 55%, rgba(0, 0, 0, 0.72) 100%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.brand {
  font-size: 72rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 4rpx;
}

.slogan {
  margin-top: 12rpx;
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.88);
}

.cta {
  margin-top: 40rpx;
  padding: 16rpx 36rpx;
  border-radius: 999rpx;
  background: rgba(26, 173, 25, 0.92);
}

.cta-text {
  font-size: 26rpx;
  color: #ffffff;
}
</style>
