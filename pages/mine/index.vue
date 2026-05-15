<template>
  <view class="safe-page mine-page" :class="{ dark: isDarkMode }">
    <view class="hero">
      <image class="hero-bg" src="/static/images/profile/bg_profile.webp" mode="aspectFill"></image>
      <view class="hero-mask">
        <view class="profile-row">
          <view class="avatar-wrap" @tap="changeAvatar">
            <image class="avatar-circle" :src="profile.avatar" mode="aspectFill"></image>
            <view class="camera-dot">
              <image class="camera-icon" src="/static/images/profile/ic_camera.webp" mode="aspectFit"></image>
            </view>
          </view>
          <view class="user-main">
            <view class="name-row" @tap="editUsername">
              <text class="username">{{ profile.username }}</text>
              <image class="edit-icon" src="/static/images/profile/ic_edit.webp" mode="aspectFit"></image>
            </view>
            <text class="subtext">欢迎来到星枢智能设备中心</text>
          </view>
        </view>
      </view>
    </view>

    <view class="content">
      <view class="section-card" @tap="goDevice">
        <image class="menu-image" src="/static/images/profile/icon_mine_device.webp" mode="aspectFit"></image>
        <view class="menu-content">
          <text class="menu-title">我的设备</text>
          <text class="menu-desc">查看已绑定设备、扫描附近设备</text>
        </view>
        <image class="arrow-icon" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit"></image>
      </view>

      <view class="group-card">
        <view v-for="(item, index) in settings" :key="item.text" class="cell" :class="{ border: index < settings.length - 1 }" @tap="goSubPage(item.path)">
          <image class="menu-image" :src="item.icon" mode="aspectFit"></image>
          <view class="menu-content">
            <text class="menu-title">{{ item.text }}</text>
            <text class="menu-desc">{{ item.desc }}</text>
          </view>
          <image class="arrow-icon" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit"></image>
        </view>
      </view>

      <view class="group-card small-gap">
        <view class="cell border" @tap="goSubPage('/pages/about/index')">
          <image class="menu-image" src="/static/images/profile/icon_about.webp" mode="aspectFit"></image>
          <view class="menu-content">
            <text class="menu-title">关于星枢</text>
            <text class="menu-desc">版本信息、品牌说明与支持</text>
          </view>
          <image class="arrow-icon" src="/static/images/common/icon_arrow_right.webp" mode="aspectFit"></image>
        </view>

        <view class="cell logout-cell" @tap="logout">
          <image class="menu-image" src="/static/images/profile/icon_logout.webp" mode="aspectFit"></image>
          <view class="menu-content">
            <text class="menu-title">退出登录</text>
            <text class="menu-desc">清除本地登录状态并返回登录页</text>
          </view>
        </view>
      </view>
    </view>

    <BottomTab active="mine" />
  </view>
</template>

<script>
import BottomTab from '../../components/BottomTab.vue'

const STORAGE_KEY = 'starbase_logged_in'
const PROFILE_KEY = 'starbase_profile'
const THEME_KEY = 'starbase_theme'
const DEFAULT_PROFILE = {
  username: '用户71499086',
  avatar: '/static/images/profile/icon_avatar.webp'
}

export default {
  components: { BottomTab },
  data() {
    return {
      profile: { ...DEFAULT_PROFILE, ...(uni.getStorageSync(PROFILE_KEY) || {}) },
      isDarkMode: uni.getStorageSync(THEME_KEY) === 'dark',
      settings: [
        {
          text: '账户与安全',
          desc: '手机号、验证码与账户保护设置',
          icon: '/static/images/profile/icon_secret.webp',
          path: '/pages/account/index'
        },
        {
          text: '通用设置',
          desc: '通知、蓝牙、显示与基础偏好',
          icon: '/static/images/profile/icon_setting.webp',
          path: '/pages/settings/index'
        },
        {
          text: '隐私说明',
          desc: '隐私政策、用户协议与权限说明',
          icon: '/static/images/profile/icon_privacy.webp',
          path: '/pages/privacy/index'
        }
      ]
    }
  },
  onShow() {
    this.profile = { ...DEFAULT_PROFILE, ...(uni.getStorageSync(PROFILE_KEY) || {}) }
    this.isDarkMode = uni.getStorageSync(THEME_KEY) === 'dark'
  },
  mounted() {
    uni.$on('theme-change', this.handleThemeChange)
  },
  beforeDestroy() {
    uni.$off('theme-change', this.handleThemeChange)
  },
  methods: {
    handleThemeChange(theme) {
      this.isDarkMode = theme === 'dark'
    },
    saveProfile() {
      uni.setStorageSync(PROFILE_KEY, this.profile)
    },
    editUsername() {
      uni.showModal({
        title: '修改用户名',
        editable: true,
        placeholderText: '请输入新的用户名',
        content: this.profile.username,
        success: (res) => {
          if (!res.confirm) return
          const username = (res.content || '').trim()
          if (!username) {
            uni.showToast({ title: '用户名不能为空', icon: 'none' })
            return
          }
          this.profile.username = username
          this.saveProfile()
          uni.showToast({ title: '已保存', icon: 'none' })
        }
      })
    },
    changeAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const avatar = res.tempFilePaths && res.tempFilePaths[0]
          if (!avatar) return
          this.profile.avatar = avatar
          this.saveProfile()
          uni.showToast({ title: '头像已更新', icon: 'none' })
        }
      })
    },
    goDevice() {
      uni.navigateTo({ url: '/pages/device/index' })
    },
    goSubPage(path) {
      uni.navigateTo({ url: path })
    },
    logout() {
      uni.removeStorageSync(STORAGE_KEY)
      uni.showToast({ title: '已退出登录', icon: 'none' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/login/index' })
      }, 250)
    }
  }
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: #f6f5f2;
  padding-bottom: 160rpx;
}

.hero {
  position: relative;
  height: 392rpx;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-mask {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: calc(var(--status-bar-height) + 36rpx) 32rpx 0;
  background: linear-gradient(180deg, rgba(78, 47, 22, 0.12) 0%, rgba(255, 255, 255, 0) 100%);
}

.profile-row {
  display: flex;
  align-items: center;
}

.avatar-wrap {
  position: relative;
  width: 118rpx;
  height: 118rpx;
}

.avatar-circle {
  width: 118rpx;
  height: 118rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8rpx 20rpx rgba(103, 73, 53, 0.14);
}

.camera-dot {
  position: absolute;
  right: 0;
  bottom: 6rpx;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-icon {
  width: 22rpx;
  height: 22rpx;
}

.user-main {
  flex: 1;
  margin-left: 22rpx;
}

.name-row {
  display: flex;
  align-items: center;
}

.username {
  max-width: 380rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-icon {
  width: 28rpx;
  height: 28rpx;
  margin-left: 16rpx;
}

.subtext {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.88);
}

.content {
  position: relative;
  z-index: 2;
  margin-top: -36rpx;
  padding: 0 24rpx;
}

.section-card,
.group-card {
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 28rpx rgba(102, 81, 67, 0.08);
}

.section-card,
.cell {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
}
.section-card {
  min-height: 110rpx;
}

.group-card {
  margin-top: 24rpx;
  overflow: hidden;
}

.small-gap {
  margin-top: 28rpx;
}

.cell.border {
  border-bottom: 1rpx solid #f0ece7;
}

.menu-image {
  width: 76rpx;
  height: 76rpx;
  flex-shrink: 0;
}

.menu-content {
  flex: 1;
  margin-left: 20rpx;
}

.menu-title {
  display: block;
  font-size: 30rpx;
  color: #282828;
  font-weight: 600;
}

.menu-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.4;
  color: #9c978f;
}

.arrow-icon {
  width: 22rpx;
  height: 22rpx;
  margin-left: 16rpx;
  opacity: 0.7;
}

.logout-cell .menu-title {
  color: #7a5c56;
}
.dark.mine-page {
  background: #141414;
}
.dark .section-card,
.dark .group-card {
  background: #232323;
  box-shadow: none;
}
.dark .menu-title {
  color: #f2f2f2;
}
.dark .menu-desc {
  color: #aaa39d;
}
.dark .cell.border {
  border-bottom-color: #333333;
}
.dark .logout-cell .menu-title {
  color: #e8c3bb;
}
</style>
