<template>
  <view class="safe-page device-page">
    <view class="topbar">
      <image class="back-icon" src="/static/images/common/ic_back.webp" mode="aspectFit" @tap="back"></image>
      <image class="add-icon" src="/static/images/device/icon_add.webp" mode="aspectFit" @tap="scanDevices"></image>
    </view>

    <text class="page-title">我的设备</text>
    <text class="page-desc">初始化 SDK、授权蓝牙权限并扫描附近设备</text>

    <view class="status-card">
      <view class="status-row">
        <text class="status-label">SDK</text>
        <text class="status-value" :class="state.initialized ? 'ok' : 'wait'">{{ state.initialized ? '已初始化' : '未初始化' }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">权限</text>
        <text class="status-value" :class="state.permissionGranted ? 'ok' : 'wait'">{{ state.permissionGranted ? '已授权' : '待授权' }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">连接</text>
        <text class="status-value" :class="state.connected ? 'ok' : 'wait'">{{ state.connected ? '已连接' : '未连接' }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">功能表</text>
        <text class="status-value" :class="state.supportReady ? 'ok' : 'wait'">{{ state.supportReady ? '已就绪' : '未返回' }}</text>
      </view>
    </view>

    <view v-if="boundDevice" class="bound-card">
      <view class="bound-head">
        <image class="bound-avatar" src="/static/images/device/icon_ring.webp" mode="aspectFit"></image>
        <view>
          <text class="bound-title">已绑定设备</text>
          <text class="bound-name">{{ boundDevice.bleName }}</text>
          <text class="bound-mac">{{ boundDevice.bleMac }}</text>
        </view>
      </view>
      <view class="bound-actions">
        <button class="mini-btn warm" hover-class="none" @tap="reconnectBound">重连</button>
        <button class="mini-btn plain" hover-class="none" @tap="unbindDevice">解绑</button>
      </view>
    </view>

    <view v-if="currentDevice" class="device-card connected" @tap="openDetail">
      <image class="device-cover" src="/static/images/device/icon_ring.webp" mode="aspectFit"></image>
      <view class="device-main">
        <text class="device-name">{{ currentDevice.bleName || 'SY02' }}</text>
        <text class="device-meta">{{ connected ? '已连接，可进入设备页' : '未连接' }}</text>
      </view>
      <image class="arrow-icon" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit"></image>
    </view>

    <view v-else class="empty">
      <image class="empty-image" src="/static/images/device/icon_pedestal.webp" mode="aspectFit"></image>
      <text class="empty-title">还没有连接设备</text>
      <text class="empty-desc">点击右上角添加，按流程搜索并连接智能戒指。</text>
    </view>

    <view class="scan-panel">
      <view class="scan-head">
        <text class="scan-title">附近设备</text>
        <button class="scan-btn" hover-class="none" @tap="scanDevices">{{ scanning ? '扫描中' : '开始扫描' }}</button>
      </view>

      <view v-for="item in devices" :key="item.bleMac" class="scan-item" @tap="connect(item)">
        <image class="scan-icon" src="/static/images/device/icon_ring.webp" mode="aspectFit"></image>
        <view class="scan-info">
          <text class="scan-name">{{ item.bleName }}</text>
          <text class="scan-mac">{{ item.bleMac }} · RSSI {{ item.bleRssi }}</text>
        </view>
        <text class="connect-text">连接</text>
      </view>
    </view>

    <view v-if="connecting" class="mask">
      <view class="loading-card">正在连接设备并等待功能表返回...</view>
    </view>
  </view>
</template>

<script>
import ringSdk from '../../utils/ring-sdk.js'

export default {
  data() {
    return {
      devices: [],
      currentDevice: null,
      boundDevice: null,
      connected: false,
      scanning: false,
      connecting: false,
      state: {},
      unsubscribe: null
    }
  },
  async onLoad() {
    this.unsubscribe = ringSdk.subscribe((state) => {
      this.state = state
      this.devices = state.devices
      this.currentDevice = state.device
      this.boundDevice = state.boundDevice
      this.connected = state.connected
      this.scanning = state.scanning
      this.connecting = state.connecting
    })
    try {
      await ringSdk.init()
    } catch (error) {}
  },
  onUnload() {
    if (this.unsubscribe) this.unsubscribe()
  },
  methods: {
    back() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/mine/index' }) })
    },
    async scanDevices() {
      try {
        await ringSdk.startScan()
      } catch (error) {
        uni.showToast({ title: error?.message || '请先授权蓝牙权限', icon: 'none' })
      }
    },
    async connect(device) {
      try {
        await ringSdk.connect(device)
        uni.showToast({ title: '连接成功', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error?.errMsg || error?.message || '连接失败', icon: 'none' })
      }
    },
    async reconnectBound() {
      try {
        await ringSdk.reconnectBoundDevice()
        uni.showToast({ title: '重连成功', icon: 'success' })
      } catch (error) {}
    },
    unbindDevice() {
      ringSdk.unbindDevice()
      uni.showToast({ title: '已解绑', icon: 'none' })
    },
    openDetail() {
      uni.navigateTo({ url: '/pages/ring/index' })
    }
  }
}
</script>

<style scoped>
.device-page {
  min-height: 100vh;
  background: #f6f6f8;
  padding: 28rpx 24rpx 80rpx;
}

.topbar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-icon,
.add-icon {
  width: 40rpx;
  height: 40rpx;
}

.page-title {
  display: block;
  margin-top: 20rpx;
  font-size: 44rpx;
  font-weight: 700;
  color: #1f1f1f;
}

.page-desc {
  display: block;
  margin-top: 10rpx;
  color: #9a9a9a;
  line-height: 1.5;
  font-size: 24rpx;
}

.status-card,
.bound-card,
.empty,
.scan-item,
.device-card {
  box-shadow: 0 8rpx 28rpx rgba(80, 64, 52, 0.06);
}

.status-card {
  margin-top: 22rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #fff;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}

.status-label {
  color: #4e4e4e;
  font-size: 28rpx;
}

.status-value {
  font-size: 28rpx;
  font-weight: 700;
}

.status-value.ok {
  color: #2bb673;
}

.status-value.wait {
  color: #b28465;
}

.bound-card {
  margin-top: 22rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(145deg, #fff8ef, #ffffff);
}

.bound-head {
  display: flex;
  align-items: center;
}

.bound-avatar {
  width: 92rpx;
  height: 92rpx;
  margin-right: 20rpx;
}

.bound-title {
  display: block;
  color: #8e6f5c;
  font-size: 24rpx;
}

.bound-name {
  display: block;
  margin-top: 10rpx;
  font-size: 34rpx;
  font-weight: 800;
}

.bound-mac {
  display: block;
  margin-top: 6rpx;
  color: #969696;
  font-size: 22rpx;
}

.bound-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.mini-btn {
  min-width: 120rpx;
  height: 64rpx;
  padding: 0 24rpx;
  border: 0;
  border-radius: 32rpx;
  line-height: 64rpx;
  font-size: 24rpx;
}

.mini-btn::after {
  border: 0;
}

.mini-btn.warm {
  background: #a7795e;
  color: #fff;
}

.mini-btn.plain {
  background: #f3f3f3;
  color: #666;
}

.device-card {
  margin-top: 22rpx;
  width: 100%;
  min-height: 178rpx;
  border-radius: 24rpx;
  background: #ffffff;
  padding: 24rpx;
  display: flex;
  align-items: center;
}

.device-cover {
  width: 106rpx;
  height: 106rpx;
}

.device-main {
  flex: 1;
  margin-left: 22rpx;
}

.device-name {
  display: block;
  font-size: 32rpx;
  font-weight: 800;
  color: #161616;
}

.device-meta {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #b28465;
}

.arrow-icon {
  width: 20rpx;
  height: 20rpx;
  opacity: 0.7;
}

.empty {
  margin-top: 22rpx;
  padding: 40rpx 26rpx;
  border-radius: 24rpx;
  background: #fff;
  text-align: center;
}

.empty-image {
  width: 108rpx;
  height: 108rpx;
  margin: 0 auto;
  display: block;
}

.empty-title {
  display: block;
  margin-top: 20rpx;
  font-size: 32rpx;
  font-weight: 800;
}

.empty-desc {
  display: block;
  margin-top: 10rpx;
  color: #969696;
  line-height: 1.6;
  font-size: 24rpx;
}

.scan-panel {
  margin-top: 28rpx;
}

.scan-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.scan-title {
  font-size: 32rpx;
  font-weight: 800;
}

.scan-btn {
  min-width: 132rpx;
  height: 60rpx;
  padding: 0 24rpx;
  border: 0;
  border-radius: 30rpx;
  background: #efd09b;
  color: #fff;
  font-size: 24rpx;
  line-height: 60rpx;
}

.scan-btn::after {
  border: 0;
}

.scan-item {
  min-height: 96rpx;
  margin-bottom: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: #fff;
  display: flex;
  align-items: center;
}

.scan-icon {
  width: 64rpx;
  height: 64rpx;
}

.scan-info {
  flex: 1;
  margin-left: 14rpx;
}

.scan-name {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
}

.scan-mac {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999;
}

.connect-text {
  color: #a7795e;
  font-size: 26rpx;
  font-weight: 700;
}

.mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.18);
}

.loading-card {
  padding: 28rpx 32rpx;
  border-radius: 20rpx;
  background: #fff;
  color: #333;
  font-size: 26rpx;
}
</style>
