<template>
  <view class="page">
    <view class="hero">
      <view class="logo">智</view>
      <text class="brand">智记</text>
      <text class="slogan">微信登录后开始智能记账</text>
    </view>

    <view class="card">
      <view class="avatar-wrap">
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image v-if="avatarUrl" class="avatar" :src="avatarUrl" mode="aspectFill" />
          <view v-else class="avatar placeholder">头像</view>
        </button>
      </view>
      <view class="nick-row">
        <text class="label">昵称</text>
        <input
          class="nick-input"
          type="nickname"
          v-model="nickName"
          placeholder="点击填写微信昵称"
          placeholder-class="ph"
        />
      </view>
    </view>

    <view class="login-btn" :class="{ loading }" @click="onLogin">
      {{ loading ? '登录中…' : '微信一键登录' }}
    </view>
    <text class="tip">登录仅用于同步身份标识，账单默认保存在本地</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { isLoggedIn, saveUser, wxLogin } from '../../utils/user.js'

const nickName = ref('')
const avatarUrl = ref('')
const loading = ref(false)

function onChooseAvatar(e) {
  avatarUrl.value = (e.detail && e.detail.avatarUrl) || ''
}

async function onLogin() {
  if (loading.value) return
  loading.value = true
  try {
    const loginRes = await wxLogin()
    saveUser({
      nickName: nickName.value.trim() || '微信用户',
      avatarUrl: avatarUrl.value,
      code: loginRes.code
    })
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 400)
  } catch (e) {
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => {
  if (isLoggedIn()) {
    uni.switchTab({ url: '/pages/index/index' })
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 80rpx 48rpx 48rpx;
  box-sizing: border-box;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 64rpx;
}
.logo {
  width: 128rpx;
  height: 128rpx;
  border-radius: 32rpx;
  background: #1aad19;
  color: #fff;
  font-size: 64rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand {
  margin-top: 24rpx;
  font-size: 48rpx;
  font-weight: 700;
  color: #1a1a1a;
}
.slogan {
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #8a8a8a;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 32rpx;
}
.avatar-wrap {
  display: flex;
  justify-content: center;
}
.avatar-btn {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: 1;
}
.avatar-btn::after {
  border: none;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #eef9f4;
}
.avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1aad19;
  font-size: 28rpx;
}
.nick-row {
  margin-top: 36rpx;
  display: flex;
  align-items: center;
  padding: 8rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.label {
  width: 100rpx;
  font-size: 28rpx;
  color: #8a8a8a;
}
.nick-input {
  flex: 1;
  font-size: 30rpx;
  color: #1a1a1a;
}
.ph {
  color: #b2b2b2;
}
.login-btn {
  margin-top: 48rpx;
  height: 96rpx;
  border-radius: 16rpx;
  background: #1aad19;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-btn.loading {
  opacity: 0.7;
}
.tip {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #b2b2b2;
  line-height: 1.5;
}
</style>
