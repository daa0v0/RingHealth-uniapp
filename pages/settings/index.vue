<template>
  <view class="safe-page info-page" :class="{ dark: isDarkMode }">
    <view class="topbar">
      <image class="back-icon" src="/static/images/common/ic_back.webp" mode="aspectFit" @tap="back"></image>
      <text class="top-title">通用设置</text>
      <view class="placeholder"></view>
    </view>

    <view class="group-card">
      <view class="cell">
        <view>
          <text class="label">蓝牙状态</text>
          <text class="desc">用于连接智能戒指与基座设备</text>
        </view>
        <switch color="#a7795e" :checked="true" disabled />
      </view>
      <view class="cell border">
        <view>
          <text class="label">消息通知</text>
          <text class="desc">控制应用提醒与设备消息同步</text>
        </view>
        <switch color="#a7795e" :checked="true" />
      </view>
      <view class="cell border">
        <view>
          <text class="label">深色模式</text>
          <text class="desc">{{ isDarkMode ? '当前为深色模式' : '当前为浅色模式' }}</text>
        </view>
        <switch color="#a7795e" :checked="isDarkMode" @change="toggleDarkMode" />
      </view>
      <view class="cell">
        <view>
          <text class="label">缓存清理</text>
          <text class="desc">删除本地演示缓存与日志记录</text>
        </view>
        <text class="action-text" @tap="clearCache">清理</text>
      </view>
    </view>
  </view>
</template>

<script>
const THEME_KEY = 'starbase_theme'

export default {
  data() {
    return {
      isDarkMode: uni.getStorageSync(THEME_KEY) === 'dark'
    }
  },
  onShow() {
    this.isDarkMode = uni.getStorageSync(THEME_KEY) === 'dark'
  },
  methods: {
    back() {
      uni.navigateBack()
    },
    toggleDarkMode(event) {
      this.isDarkMode = event.detail.value
      uni.setStorageSync(THEME_KEY, this.isDarkMode ? 'dark' : 'light')
      uni.$emit('theme-change', this.isDarkMode ? 'dark' : 'light')
    },
    clearCache() {
      uni.showToast({ title: '已清理缓存', icon: 'none' })
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
.info-page.dark {
  background: #141414;
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
.dark .top-title,
.dark .label {
  color: #f2f2f2;
}
.dark .group-card {
  background: #232323;
  box-shadow: none;
}
.dark .desc {
  color: #aaa39d;
}
.dark .cell.border {
  border-bottom-color: #333333;
}
</style>
