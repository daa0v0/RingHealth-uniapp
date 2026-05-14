<template>
  <view class="safe-page info-page">
    <view class="topbar">
      <image class="back-icon" src="/static/images/common/ic_back.webp" mode="aspectFit" @tap="back"></image>
      <text class="top-title">隐私说明</text>
      <view class="placeholder"></view>
    </view>

    <view class="content-card">
      <text class="section-title">隐私政策</text>
      <text class="paragraph">星枢会在设备连接、健康同步、消息通知等场景下使用必要权限，仅用于提供设备管理与健康数据展示服务。</text>

      <text class="section-title">权限说明</text>
      <text class="paragraph">1. 蓝牙权限：用于扫描、连接戒指与基座设备。</text>
      <text class="paragraph">2. 位置权限：部分 Android 版本下蓝牙扫描需要位置权限支持。</text>
      <text class="paragraph">3. 通知权限：用于接收应用提醒及设备消息同步。</text>

      <text class="section-title">数据用途</text>
      <text class="paragraph">健康数据仅用于用户本人查看、设备状态同步和功能演示，不会在未经授权情况下共享给第三方。</text>
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
.content-card {
  margin-top: 22rpx;
  padding: 30rpx 24rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 12rpx 28rpx rgba(102, 81, 67, 0.08);
}
.section-title {
  display: block;
  margin-top: 12rpx;
  margin-bottom: 14rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #282828;
}
.section-title:first-child {
  margin-top: 0;
}
.paragraph {
  display: block;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  line-height: 1.8;
  color: #7d7d7d;
}
</style>
