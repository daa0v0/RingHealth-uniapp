<template>
  <view class="safe-page info-page">
    <view class="topbar">
      <image class="back-icon" src="/static/images/common/ic_back.webp" mode="aspectFit" @tap="back"></image>
      <text class="top-title">账户与安全</text>
      <view class="placeholder"></view>
    </view>

    <view class="group-card">
      <view class="cell border">
        <view>
          <text class="label">手机号</text>
          <text class="desc">18918344469</text>
        </view>
        <text class="action-text">已绑定</text>
      </view>
      <view class="cell border">
        <view>
          <text class="label">登录方式</text>
          <text class="desc">验证码登录</text>
        </view>
        <text class="action-text">固定演示</text>
      </view>
      <view class="cell border">
        <view>
          <text class="label">登录设备</text>
          <text class="desc">当前设备已登录</text>
        </view>
        <text class="action-text">安全</text>
      </view>
      <view class="cell">
        <view>
          <text class="label">重置演示账号</text>
          <text class="desc">清理本地登录状态并重新进入登录页</text>
        </view>
        <text class="action-text" @tap="resetLogin">重置</text>
      </view>
    </view>
  </view>
</template>

<script>
const STORAGE_KEY = 'starbase_logged_in'

export default {
  methods: {
    back() {
      uni.navigateBack()
    },
    resetLogin() {
      uni.removeStorageSync(STORAGE_KEY)
      uni.showToast({ title: '已重置登录状态', icon: 'none' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/login/index' })
      }, 300)
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
.group-card {
  margin-top: 22rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 28rpx rgba(102, 81, 67, 0.08);
}
.cell {
  min-height: 108rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8f8a84;
}
.action-text {
  color: #a7795e;
  font-size: 26rpx;
  font-weight: 600;
}
</style>
