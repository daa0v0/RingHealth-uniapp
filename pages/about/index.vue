<template>
  <view class="safe-page info-page">
    <view class="topbar">
      <image class="back-icon" src="/static/images/common/ic_back.webp" mode="aspectFit" @tap="back"></image>
      <text class="top-title">关于星枢</text>
      <view class="placeholder"></view>
    </view>

    <view class="hero-card">
      <image class="logo" src="/static/images/profile/icon_about.webp" mode="aspectFit"></image>
      <text class="app-name">星枢</text>
      <text class="version">Version 1.0.0</text>
      <text class="desc">星枢是一款围绕智能戒指、基座与健康数据打造的设备管理应用。</text>
    </view>

    <view class="group-card">
      <view class="cell">
        <text class="label">品牌介绍</text>
        <text class="value multiline">专注智能穿戴、健康监测与设备联动体验。</text>
      </view>
      <view class="cell border">
        <text class="label">技术支持</text>
        <text class="value">support@starbase.app</text>
      </view>
      <view class="cell">
        <text class="label">官方网站</text>
        <text class="value">www.starbase.app</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    back() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.info-page {
  min-height: 100vh;
  background: #f6f6f8;
  padding: calc(var(--status-bar-height) + 20rpx) 24rpx 40rpx;
}
.topbar {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.back-icon,
.placeholder {
  width: 36rpx;
  height: 36rpx;
}
.top-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
}
.hero-card,
.group-card {
  margin-top: 22rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 12rpx 28rpx rgba(102, 81, 67, 0.08);
}
.hero-card {
  padding: 40rpx 32rpx;
  text-align: center;
}
.logo {
  width: 108rpx;
  height: 108rpx;
  margin: 0 auto;
}
.app-name {
  display: block;
  margin-top: 18rpx;
  font-size: 38rpx;
  font-weight: 700;
}
.version {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #a18672;
}
.desc {
  display: block;
  margin-top: 18rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #808080;
}
.group-card {
  overflow: hidden;
}
.cell {
  padding: 28rpx 24rpx;
}
.cell.border {
  border-bottom: 1rpx solid #f0ece7;
}
.label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #282828;
}
.value {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8f8a84;
}
.multiline {
  line-height: 1.7;
}
</style>
