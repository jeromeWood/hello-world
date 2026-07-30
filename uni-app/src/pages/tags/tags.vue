<template>
  <view class="page">
    <view class="group">
      <view class="row" @click="goList('expense')">
        <view class="left">
          <view class="icon expense">支</view>
          <view class="texts">
            <text class="title">支出分类</text>
            <text class="desc">查看支出分类统计，或自定义支出分类</text>
          </view>
        </view>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="goList('income')">
        <view class="left">
          <view class="icon income">收</view>
          <view class="texts">
            <text class="title">收入分类</text>
            <text class="desc">查看收入分类统计，或自定义收入分类</text>
          </view>
        </view>
        <text class="arrow">></text>
      </view>
    </view>

    <view class="group">
      <view class="row" @click="goList('account')">
        <view class="left">
          <view class="icon account">账</view>
          <view class="texts">
            <text class="title">账户</text>
            <text class="desc">查看账户统计，或管理账户</text>
          </view>
        </view>
        <text class="arrow">></text>
      </view>
    </view>

    <view class="group">
      <view class="row" @click="goList('merchant')">
        <view class="left">
          <view class="icon merchant">商</view>
          <view class="texts">
            <text class="title">商家</text>
            <text class="desc">查看商家统计，或管理商家</text>
          </view>
        </view>
        <text class="arrow">></text>
      </view>
      <view class="row" @click="goList('project')">
        <view class="left">
          <view class="icon project">项</view>
          <view class="texts">
            <text class="title">项目</text>
            <text class="desc">查看项目统计，或管理项目</text>
          </view>
        </view>
        <text class="arrow">></text>
      </view>
    </view>
  </view>
</template>

<script setup>
function goList(type) {
  uni.navigateTo({ url: `/pages/tags/list?type=${type}` })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
}
.group {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.row:last-child {
  border-bottom: none;
}
.left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.icon.expense {
  background: #eef9f4;
  color: #1aad19;
}
.icon.income {
  background: #fff1f0;
  color: #fa5151;
}
.icon.account {
  background: #e8f1ff;
  color: #4a90e2;
}
.icon.merchant {
  background: #fff7e8;
  color: #fa9d3b;
}
.icon.project {
  background: #f3e8ff;
  color: #8e6cc9;
}
.texts {
  flex: 1;
  min-width: 0;
}
.title {
  display: block;
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 500;
}
.desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8a8a8a;
  line-height: 1.4;
}
.arrow {
  color: #c0c0c0;
  margin-left: 12rpx;
  font-size: 28rpx;
}
</style>
