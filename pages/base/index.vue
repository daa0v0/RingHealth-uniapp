<template>
  <view class="safe-page base-page">
    <view class="hero">
      <view class="navline">
        <view class="left-title">
          <text class="device-title">{{ device ? device.bleName : '未选择设备' }}</text>
          <image class="swap-icon" src="/static/images/common/ic_toggle.webp" mode="aspectFit" @tap="selectDevice"></image>
        </view>
        <view class="right-state">
          <image class="state-icon" :src="connected ? '/static/images/device/ic_online.webp' : '/static/images/device/ic_offline.webp'" mode="aspectFit"></image>
          <text>{{ connected ? '在线' : '离线' }}</text>
          <image class="scan-icon" src="/static/images/common/ic_scan.webp" mode="aspectFit" @tap="selectDevice"></image>
        </view>
      </view>
      <image class="base-img" src="/static/images/device/icon_pedestal.webp" mode="aspectFit"></image>
    </view>

    <view class="panel">
      <view v-for="item in controls" :key="item.name" class="control" :class="{ disabled: item.needReady && !supportReady }">
        <view class="control-main" @tap="onControl(item)">
          <image class="control-icon" :src="item.icon" mode="aspectFit"></image>
          <text class="control-name">{{ item.name }}</text>
        </view>
        <image v-if="item.arrow" class="control-arrow" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit" @tap="onControl(item)"></image>
        <switch v-if="item.switch" class="switch" :checked="item.checked" color="#9b5b4b" @change="onSwitch(item, $event)" />
      </view>
    </view>

    <BottomTab active="base" />
  </view>
</template>

<script>
import BottomTab from '../../components/BottomTab.vue'
import ringSdk from '../../utils/ring-sdk.js'

export default {
  components: { BottomTab },
  data() {
    return {
      device: null,
      connected: false,
      supportReady: false,
      running: false,
      lighting: false,
      sandbox: false,
      unsubscribe: null
    }
  },
  computed: {
    controls() {
      return [
        { name: '开启', icon: '/static/images/device/icon_running.webp', action: 'power', needReady: true },
        { name: '网络', icon: '/static/images/device/icon_network.webp', arrow: true, action: 'network' },
        { name: '运行', icon: '/static/images/device/icon_running.webp', switch: true, checked: this.running, action: 'running', needReady: true },
        { name: '灯光', icon: '/static/images/device/icon_lighting.webp', switch: true, checked: this.lighting, action: 'lighting', needReady: true },
        { name: '沙盘', icon: '/static/images/device/icon_sandbox.webp', switch: true, checked: this.sandbox, action: 'sandbox', needReady: true }
      ]
    }
  },
  onLoad() {
    this.unsubscribe = ringSdk.subscribe((state) => {
      this.device = state.device
      this.connected = state.connected
      this.supportReady = state.supportReady
    })
  },
  onUnload() {
    if (this.unsubscribe) this.unsubscribe()
  },
  methods: {
    selectDevice() {
      uni.navigateTo({ url: '/pages/device/index' })
    },
    onControl(item) {
      if (item.needReady && !this.supportReady) {
        uni.showToast({ title: '请先连接设备并等待功能表返回', icon: 'none' })
        return
      }
      if (item.action === 'power') {
        if (!this.connected) {
          this.selectDevice()
          return
        }
        ringSdk.findDevice()
      }
      if (item.action === 'network') {
        uni.showToast({ title: this.connected ? '设备在线' : '设备离线', icon: 'none' })
      }
    },
    onSwitch(item, event) {
      if (item.needReady && !this.supportReady) {
        uni.showToast({ title: '请先连接设备并等待功能表返回', icon: 'none' })
        return
      }
      const value = event.detail.value
      if (item.action === 'running') {
        this.running = value
        if (this.connected) ringSdk.controlSport(value ? 'begin' : 'finish')
      }
      if (item.action === 'lighting') {
        this.lighting = value
        if (this.connected) ringSdk.setLedLevel(value, value ? 3 : 0)
      }
      if (item.action === 'sandbox') {
        this.sandbox = value
        uni.showToast({ title: value ? '沙盘已开启' : '沙盘已关闭', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.base-page {
  min-height: 100vh;
  background: #a97f68;
  padding-bottom: 124px;
}

.hero {
  min-height: 520rpx;
  padding: calc(var(--status-bar-height) + 24rpx) 30rpx 0;
  background: linear-gradient(180deg, #a77b63 0%, #b98c73 100%);
}

.navline {
  min-height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

.left-title {
  display: flex;
  align-items: center;
}

.device-title {
  font-size: 40rpx;
}

.swap-icon {
  width: 28rpx;
  height: 28rpx;
  margin-left: 14rpx;
  opacity: 0.9;
}

.right-state {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
}

.state-icon,
.scan-icon {
  width: 28rpx;
  height: 28rpx;
}

.scan-icon {
  margin-left: 12rpx;
}

.base-img {
  display: block;
  width: 320rpx;
  height: 320rpx;
  margin: 42rpx auto 0;
}

.panel {
  margin-top: -18rpx;
  min-height: 420px;
  padding: 40rpx 24rpx 150rpx;
  border-radius: 34rpx 34rpx 0 0;
  background: #f6f6f8;
}

.control {
  min-height: 110rpx;
  margin-bottom: 16rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control.disabled {
  opacity: 0.42;
}

.control-main {
  flex: 1;
  display: flex;
  align-items: center;
}

.control-icon {
  width: 52rpx;
  height: 52rpx;
}

.control-name {
  flex: 1;
  margin-left: 22rpx;
  font-size: 30rpx;
  color: #333333;
}

.control-arrow {
  width: 18rpx;
  height: 18rpx;
  opacity: 0.7;
}

.switch {
  transform: scale(0.85);
}
</style>
