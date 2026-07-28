<template>
  <view class="page">
    <text class="title">统计</text>
    <text class="desc">这里是统计页。若能看到这段文字，说明底部「统计」切换成功。</text>
    <view class="card">
      <text class="card-text">图表与 AI 建议稍后接入（占位）</text>
    </view>
  </view>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 48rpx 40rpx;
  background: #f7f8fa;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #1a1a1a;
}
.desc {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #b2b2b2;
  line-height: 1.5;
}
.card {
  margin-top: 40rpx;
  padding: 32rpx 28rpx;
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
}
.card-text {
  font-size: 30rpx;
  color: #353535;
}
</style>
