<template>
  <scroll-view scroll-y class="safe-page ring-page" show-scrollbar="false">
    <view class="hero-card">
      <view class="hero-top">
        <image class="back-icon" src="/static/images/common/ic_back.webp" mode="aspectFit" @tap="back"></image>
        <view class="device-wrap">
          <text class="title">{{ deviceName }}</text>
          <text class="sub">{{ connected ? '已连接，可进行设备控制' : '未连接设备' }}</text>
        </view>
        <button class="disconnect" hover-class="none" @tap="disconnect">断开</button>
      </view>

      <view class="hero-main">
        <image class="ring-hero" src="/static/images/device/icon_ring.webp" mode="aspectFit"></image>
        <view class="device-summary">
          <text class="summary-item">MAC：{{ device ? device.bleMac : '--' }}</text>
          <text class="summary-item">SDK：{{ deviceInfo.sdkVersion }}</text>
          <text class="summary-item">电量：{{ deviceInfo.power }}%</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">健康概览</text>
      <view class="health-grid">
        <view v-for="item in healthCards" :key="item.key" class="health-card">
          <text class="health-label">{{ item.label }}</text>
          <view class="health-value-row">
            <text class="health-value">{{ item.value || '--' }}</text>
            <text class="health-unit">{{ item.unit }}</text>
          </view>
        </view>
      </view>
      <text v-if="health.syncSummary" class="section-tip">{{ health.syncSummary }}</text>
    </view>

    <view class="section">
      <text class="section-title">快捷功能</text>
      <view class="action-grid">
        <view v-for="item in basicActions" :key="item.action" class="action" @tap="runAction(item.action)">
          <text class="action-icon">{{ item.icon }}</text>
          <text class="action-text">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">实时检测</text>
      <view v-for="item in realtimeMonitors" :key="item.key" class="switch-card" :class="{ disabled: !isSupported(item.supportKey) }">
        <view>
          <text class="switch-title">{{ item.name }}</text>
          <text class="switch-desc">{{ isSupported(item.supportKey) ? item.desc : '当前设备不支持' }}</text>
        </view>
        <switch :checked="monitoring[item.key]" :disabled="!isSupported(item.supportKey)" color="#a7795e" @change="toggleRealtime(item.key, $event)" />
      </view>
    </view>

    <view class="section">
      <text class="section-title">全天监听</text>
      <view v-for="item in timedMonitors" :key="item.key" class="timed-card" :class="{ disabled: !isSupported(item.supportKey) }">
        <view class="timed-head">
          <view>
            <text class="switch-title">{{ item.name }}</text>
            <text class="switch-desc">{{ item.desc }}</text>
          </view>
          <switch :checked="settings.timedMonitor[item.key].enabled" :disabled="!isSupported(item.supportKey)" color="#a7795e" @change="toggleTimed(item.key, $event)" />
        </view>
        <view class="timed-foot">
          <text>间隔 {{ settings.timedMonitor[item.key].duration }} 分钟</text>
          <button class="mini-btn" hover-class="none" :disabled="!isSupported(item.supportKey)" @tap="cycleDuration(item.key)">切换间隔</button>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">设备设置</text>
      <view class="setting-list">
        <view class="setting-item">
          <view>
            <text class="setting-title">24 小时制</text>
            <text class="setting-desc">当前 {{ settings.timeFormat }} 小时制</text>
          </view>
          <switch :checked="settings.timeFormat === 24" color="#a7795e" @change="toggleTimeFormat" />
        </view>

        <view class="setting-item">
          <view>
            <text class="setting-title">抬腕亮屏</text>
            <text class="setting-desc">{{ settings.raiseScreenStart }} - {{ settings.raiseScreenEnd }}</text>
          </view>
          <switch :checked="settings.raiseScreen" color="#a7795e" @change="toggleRaiseScreen" />
        </view>

        <view class="setting-item">
          <view>
            <text class="setting-title">屏幕睡眠</text>
            <text class="setting-desc">{{ settings.screenSleepStart }} - {{ settings.screenSleepEnd }}</text>
          </view>
          <switch :checked="settings.screenSleep" color="#a7795e" @change="toggleScreenSleep" />
        </view>

        <view class="setting-item" @tap="runAction('screenTime')">
          <view>
            <text class="setting-title">亮屏时长</text>
            <text class="setting-desc">{{ settings.screenTime }} 秒</text>
          </view>
          <image class="arrow-icon" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit"></image>
        </view>

        <view class="setting-item" @tap="runAction('wearHand')">
          <view>
            <text class="setting-title">佩戴方向</text>
            <text class="setting-desc">{{ settings.wearHand === 'left' ? '左手' : '右手' }}</text>
          </view>
          <image class="arrow-icon" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit"></image>
        </view>

        <view class="setting-item" @tap="runAction('ledLevel')">
          <view>
            <text class="setting-title">LED 亮度</text>
            <text class="setting-desc">{{ settings.ledLevel.enabled ? 'Level ' + settings.ledLevel.level : '关闭' }}</text>
          </view>
          <image class="arrow-icon" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit"></image>
        </view>

        <view class="setting-item">
          <view>
            <text class="setting-title">视频控制</text>
            <text class="setting-desc">短视频控制开关</text>
          </view>
          <switch :checked="settings.videoHid" color="#a7795e" @change="toggleVideoHid" />
        </view>

        <view class="setting-item" @tap="runAction('vibration')">
          <view>
            <text class="setting-title">震动设置</text>
            <text class="setting-desc">等级 {{ settings.vibration.level }}，次数 {{ settings.vibration.count }}</text>
          </view>
          <image class="arrow-icon" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit"></image>
        </view>

        <view class="setting-item">
          <view>
            <text class="setting-title">赞念开关</text>
            <text class="setting-desc">Muslim 定制功能</text>
          </view>
          <switch :checked="settings.muslimReminder" color="#a7795e" @change="toggleMuslimReminder" />
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">提醒与推送</text>
      <view class="action-grid">
        <view v-for="item in reminderActions" :key="item.action" class="action" @tap="runAction(item.action)">
          <text class="action-icon">{{ item.icon }}</text>
          <text class="action-text">{{ item.text }}</text>
        </view>
      </view>

      <view class="alarm-panel">
        <view class="alarm-head">
          <text class="switch-title">闹钟列表</text>
          <button class="mini-btn" hover-class="none" @tap="runAction('addAlarm')">新增演示闹钟</button>
        </view>
        <view v-if="settings.alarms.length">
          <view v-for="item in settings.alarms" :key="item.alarmId + '-' + item.startHour + '-' + item.startMin" class="alarm-item">
            <view>
              <text class="setting-title">{{ pad(item.startHour) }}:{{ pad(item.startMin) }}</text>
              <text class="setting-desc">{{ item.repeat }} / {{ item.isOpen ? '开启' : '关闭' }}</text>
            </view>
          </view>
          <button class="wide-btn danger" hover-class="none" @tap="runAction('clearAlarm')">删除全部闹钟</button>
        </view>
        <text v-else class="section-tip">当前没有闹钟</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">运动 / OTA / 扩展</text>
      <view class="action-grid">
        <view v-for="item in extraActions" :key="item.action" class="action" @tap="runAction(item.action)">
          <text class="action-icon">{{ item.icon }}</text>
          <text class="action-text">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">功能配置表</text>
      <view class="support-grid">
        <view v-for="item in supportItems" :key="item.key" class="support-chip" :class="{ on: support[item.key] }">
          {{ item.label }}
        </view>
      </view>
    </view>

    <view class="section logs">
      <text class="section-title">运行日志</text>
      <view v-for="(log, index) in logs" :key="log.id || (log.time + log.message + index)" class="log-item">
        <text class="log-time">{{ log.time }}</text>
        <text class="log-msg">{{ log.message }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script>
import ringSdk from '../../utils/ring-sdk.js'

export default {
  data() {
    return {
      connected: false,
      device: null,
      support: {},
      settings: {
        timedMonitor: {
          hr: { enabled: false, duration: 60 },
          bo: { enabled: false, duration: 60 },
          hrv: { enabled: false, duration: 60 },
          stress: { enabled: false, duration: 60 },
          bloodSugar: { enabled: false, duration: 60 }
        },
        alarms: [],
        ledLevel: {},
        vibration: {}
      },
      health: {},
      monitoring: {},
      deviceInfo: {},
      logs: [],
      unsubscribe: null,
      basicActions: [
        { action: 'sdkVersion', text: 'SDK 版本', icon: 'ⓘ' },
        { action: 'userInfo', text: '设置用户信息', icon: '◫' },
        { action: 'firmware', text: '固件信息', icon: '⌘' },
        { action: 'power', text: '获取电量', icon: '▰' },
        { action: 'findDevice', text: '查找设备', icon: '◎' },
        { action: 'verifyHr', text: '立即检测心率', icon: '♥' },
        { action: 'syncAll', text: '同步全部健康', icon: '↻' },
        { action: 'syncSteps', text: '同步今日步数', icon: '⋯' },
        { action: 'takePhoto', text: '拍照控制', icon: '◉' }
      ],
      reminderActions: [
        { action: 'hrAlarm', text: '心率报警 140', icon: '♥' },
        { action: 'boAlarm', text: '血氧报警 90', icon: '◌' },
        { action: 'pushMessage', text: '消息推送测试', icon: '✉' },
        { action: 'getAlarm', text: '获取闹钟', icon: '⏰' }
      ],
      extraActions: [
        { action: 'sportStart', text: '开始运动', icon: '▶' },
        { action: 'sportStop', text: '结束运动', icon: '■' },
        { action: 'sportPush', text: '运动通知', icon: '⇄' },
        { action: 'ota', text: 'OTA 入口', icon: '⬆' },
        { action: 'shutdown', text: '关机', icon: '⏻' },
        { action: 'factoryReset', text: '恢复出厂', icon: '↺' }
      ],
      supportItems: [
        { key: 'isAlarm', label: '闹钟' },
        { key: 'isBrightScreenTime', label: '亮屏时长' },
        { key: 'isRaiseBrightScreen', label: '抬腕亮屏' },
        { key: 'isSupportHrReminder', label: '心率报警' },
        { key: 'isSupportBoReminder', label: '血氧报警' },
        { key: 'isPushMsgEnableSwitch', label: '消息推送' },
        { key: 'isLEDLight', label: 'LED' },
        { key: 'isWearDir', label: '佩戴方向' },
        { key: 'isHrv', label: 'HRV' },
        { key: 'isPressure', label: '压力' },
        { key: 'isBloodSugar', label: '血糖' },
        { key: 'isNewSport', label: '多运动' }
      ]
    }
  },
  computed: {
    deviceName() {
      return this.device ? this.device.bleName : 'SY02'
    },
    healthCards() {
      return [
        { key: 'steps', label: '步数', value: this.health.steps, unit: 'steps' },
        { key: 'hr', label: '心率', value: this.health.hr, unit: 'BPM' },
        { key: 'bo', label: '血氧', value: this.health.bo, unit: '%' },
        { key: 'hrv', label: 'HRV', value: this.health.hrv, unit: 'ms' },
        { key: 'stress', label: '压力', value: this.health.stress, unit: '' },
        { key: 'bloodSugar', label: '血糖', value: this.health.bloodSugar, unit: 'mmol/L' }
      ]
    },
    realtimeMonitors() {
      return [
        { key: 'hr', name: '心率实时检测', desc: '对应 controlHealthDataJL HR', supportKey: 'isHr' },
        { key: 'bo', name: '血氧实时检测', desc: '对应 controlHealthDataJL BO', supportKey: 'isBloodOxy' },
        { key: 'hrv', name: 'HRV 实时检测', desc: '对应 controlHealthDataJL HRV', supportKey: 'isHrv' },
        { key: 'stress', name: '压力实时检测', desc: '对应 controlHealthDataJL PRESSURE', supportKey: 'isPressure' },
        { key: 'bloodSugar', name: '血糖实时检测', desc: '对应 controlHealthDataJL BLOODSUGAR', supportKey: 'isBloodSugar' }
      ]
    },
    timedMonitors() {
      return [
        { key: 'hr', name: '心率全天监听', desc: '支持 30 / 60 分钟', supportKey: 'isHr' },
        { key: 'bo', name: '血氧全天监听', desc: '固定 60 分钟', supportKey: 'isBloodOxy' },
        { key: 'hrv', name: 'HRV 全天监听', desc: '固定 60 分钟', supportKey: 'isHrv' },
        { key: 'stress', name: '压力全天监听', desc: '固定 60 分钟', supportKey: 'isPressure' },
        { key: 'bloodSugar', name: '血糖全天监听', desc: '固定 60 分钟', supportKey: 'isBloodSugar' }
      ]
    }
  },
  onLoad() {
    this.unsubscribe = ringSdk.subscribe((state) => {
      this.connected = state.connected
      this.device = state.device
      this.support = state.support || {}
      this.settings = state.settings || this.settings
      this.health = state.health || {}
      this.monitoring = state.monitoring || {}
      this.deviceInfo = state.deviceInfo || {}
      this.logs = state.logs || []
    })
  },
  onUnload() {
    if (this.unsubscribe) this.unsubscribe()
  },
  methods: {
    back() {
      uni.navigateBack({ fail: () => uni.navigateTo({ url: '/pages/device/index' }) })
    },
    disconnect() {
      ringSdk.disconnect()
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/device/index' }) })
    },
    isSupported(key) {
      return !!this.support[key]
    },
    pad(num) {
      return String(num).padStart(2, '0')
    },
    async toggleRealtime(key, event) {
      try {
        await ringSdk.controlHealth(key, event.detail.value)
      } catch (error) {}
    },
    async toggleTimed(key, event) {
      const duration = this.settings.timedMonitor[key].duration
      try {
        await ringSdk.setTimedMonitor(key, event.detail.value, duration)
      } catch (error) {}
    },
    async cycleDuration(key) {
      const current = this.settings.timedMonitor[key].duration
      const duration = key === 'hr' ? (current === 30 ? 60 : 30) : 60
      await ringSdk.setTimedMonitor(key, this.settings.timedMonitor[key].enabled, duration)
      uni.showToast({ title: `间隔 ${duration} 分钟`, icon: 'none' })
    },
    async toggleTimeFormat(event) {
      await ringSdk.setTimeFormat(event.detail.value ? 24 : 12)
    },
    async toggleRaiseScreen(event) {
      await ringSdk.setRaiseScreen(event.detail.value)
    },
    async toggleScreenSleep(event) {
      await ringSdk.setScreenSleep(event.detail.value)
    },
    async toggleVideoHid(event) {
      await ringSdk.setVideoHid(event.detail.value)
    },
    async toggleMuslimReminder(event) {
      await ringSdk.setMuslimReminder(event.detail.value)
    },
    async runAction(action) {
      const nextWearRight = this.settings.wearHand !== 'right'
      const nextLedLevel = this.settings.ledLevel.level === 3 ? 1 : this.settings.ledLevel.level + 1
      const nextVibrationCount = this.settings.vibration.count >= 3 ? 1 : this.settings.vibration.count + 1
      const nextScreenTime = this.settings.screenTime >= 30 ? 5 : this.settings.screenTime + 5
      const actions = {
        sdkVersion: () => ringSdk.getSDKVersion(),
        userInfo: () => ringSdk.setUserInfo({ gender: 1, age: 20, height: 170.5, weight: 80, measureUnit: 0 }),
        firmware: () => ringSdk.getFirmware(),
        power: () => ringSdk.getPower(),
        findDevice: () => ringSdk.findDevice(),
        verifyHr: () => ringSdk.verifyHeartRateTransfer(),
        syncAll: () => ringSdk.syncHealthData('all'),
        syncSteps: () => ringSdk.syncHealthData('today_step'),
        takePhoto: () => ringSdk.controlTakePhoto(!this.monitoring.takePhoto),
        hrAlarm: () => ringSdk.setHrAlarm(true, 140, 255),
        boAlarm: () => ringSdk.setBoAlarm(true, 90),
        pushMessage: () => ringSdk.pushMessage({ appId: 'com.starbase.app', title: '星枢', content: 'SDK 消息推送测试' }),
        getAlarm: () => ringSdk.getAlarms(),
        addAlarm: () => {
          const list = [...this.settings.alarms]
          list.push({ alarmId: list.length, startHour: 8 + list.length, startMin: 0, isOpen: true, repeat: '单次' })
          return ringSdk.setAlarmList(list)
        },
        clearAlarm: () => ringSdk.deleteAllAlarms(),
        screenTime: () => ringSdk.setScreenTime(nextScreenTime),
        wearHand: () => ringSdk.setWearHand(nextWearRight),
        ledLevel: () => ringSdk.setLedLevel(true, nextLedLevel),
        vibration: () => ringSdk.setVibration(this.settings.vibration.level, nextVibrationCount),
        sportStart: () => ringSdk.controlSport('begin'),
        sportStop: () => ringSdk.controlSport('finish'),
        sportPush: () => ringSdk.setSportPush(!this.monitoring.sportPush),
        ota: () => ringSdk.startOta(),
        shutdown: () => ringSdk.powerOff('shutdown'),
        factoryReset: () => ringSdk.powerOff('recovery')
      }
      if (!actions[action]) return
      try {
        const result = await actions[action]()
        if (action === 'verifyHr' && result?.value) {
          uni.showToast({ title: `心率 ${result.value} BPM`, icon: 'success' })
        } else {
          uni.showToast({ title: '操作完成', icon: 'success' })
        }
      } catch (error) {
        uni.showToast({ title: error?.message || '操作失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.ring-page {
  height: 100vh;
  background: #f6f6f8;
  padding: 24rpx 20rpx 56rpx;
}

.hero-card {
  padding: 24rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #ffffff, #fff4e4);
  box-shadow: 0 10rpx 28rpx rgba(80, 64, 52, 0.08);
}

.hero-top {
  display: flex;
  align-items: center;
}

.back-icon {
  width: 36rpx;
  height: 36rpx;
}

.device-wrap {
  flex: 1;
  margin-left: 18rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 900;
}

.sub {
  display: block;
  margin-top: 6rpx;
  color: #a7795e;
  font-size: 24rpx;
}

.disconnect {
  min-width: 112rpx;
  height: 60rpx;
  padding: 0 20rpx;
  border: 0;
  border-radius: 30rpx;
  background: #fff;
  color: #a7795e;
  line-height: 60rpx;
  font-size: 24rpx;
}

.disconnect::after,
.mini-btn::after,
.wide-btn::after {
  border: 0;
}

.hero-main {
  display: flex;
  align-items: center;
  margin-top: 22rpx;
}

.ring-hero {
  width: 126rpx;
  height: 126rpx;
}

.device-summary {
  flex: 1;
  margin-left: 22rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.summary-item {
  color: #7b7b7b;
  font-size: 22rpx;
}

.section {
  margin-top: 28rpx;
}

.section-title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 32rpx;
  font-weight: 900;
}

.section-tip {
  display: block;
  margin-top: 12rpx;
  color: #9d7d63;
  font-size: 22rpx;
}

.health-grid,
.action-grid,
.support-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.health-card {
  width: calc((100% - 16rpx) / 2);
  min-height: 152rpx;
  padding: 22rpx;
  border-radius: 20rpx;
  background: linear-gradient(145deg, #fff, #fff7ec);
  box-shadow: 0 8rpx 28rpx rgba(80, 64, 52, 0.06);
}

.health-label {
  display: block;
  color: #8f8f8f;
  font-size: 24rpx;
}

.health-value-row {
  display: flex;
  align-items: flex-end;
  margin-top: 16rpx;
}

.health-value {
  font-size: 46rpx;
  font-weight: 900;
  color: #2d2d2d;
}

.health-unit {
  margin-left: 8rpx;
  color: #b28465;
  font-size: 22rpx;
}

.action {
  width: calc((100% - 16rpx) / 2);
  min-height: 96rpx;
  padding: 0 18rpx;
  border-radius: 18rpx;
  background: #fff;
  color: #333;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 28rpx rgba(80, 64, 52, 0.05);
}

.action-icon {
  margin-right: 14rpx;
  color: #a7795e;
  font-size: 32rpx;
}

.action-text {
  font-size: 26rpx;
}

.switch-card,
.timed-card,
.setting-item,
.alarm-item {
  margin-bottom: 12rpx;
  padding: 20rpx 22rpx;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(80, 64, 52, 0.05);
}

.switch-card,
.setting-item {
  min-height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timed-head,
.alarm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.timed-foot {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #9a9a9a;
  font-size: 22rpx;
}

.switch-title,
.setting-title {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
}

.switch-desc,
.setting-desc {
  display: block;
  margin-top: 8rpx;
  color: #999;
  font-size: 22rpx;
  line-height: 1.5;
}

.disabled {
  opacity: 0.45;
}

.arrow-icon {
  width: 18rpx;
  height: 18rpx;
  opacity: 0.7;
}

.mini-btn,
.wide-btn {
  padding: 0 18rpx;
  border: 0;
  border-radius: 16rpx;
  background: #f3d29d;
  color: #fff;
  font-size: 22rpx;
}

.mini-btn {
  height: 56rpx;
  line-height: 56rpx;
}

.wide-btn {
  width: 100%;
  height: 74rpx;
  margin-top: 16rpx;
  line-height: 74rpx;
}

.danger {
  background: #e5a1a1;
}

.alarm-panel {
  margin-top: 14rpx;
}

.support-chip {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #ececec;
  color: #888;
  font-size: 22rpx;
}

.support-chip.on {
  background: #fff1d8;
  color: #b77a29;
}

.logs {
  padding-bottom: 30rpx;
}

.log-item {
  padding: 14rpx 0;
  border-bottom: 1rpx solid #e8e8e8;
  display: flex;
  gap: 12rpx;
}

.log-time {
  width: 96rpx;
  color: #b28465;
  font-size: 22rpx;
}

.log-msg {
  flex: 1;
  color: #666;
  font-size: 22rpx;
  line-height: 1.5;
}
</style>
