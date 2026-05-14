<template>
  <view class="safe-page login-page glass-bg">
    <view class="hero">
      <text class="brand">星枢</text>
    </view>

    <view class="form-area">
      <view class="form-card">
        <input
          v-model="phone"
          class="input"
          type="number"
          maxlength="11"
          placeholder="手机号"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-card code-card">
        <input
          v-model="code"
          class="input code-input"
          type="number"
          maxlength="7"
          placeholder="验证码"
          placeholder-class="placeholder"
        />
        <text class="send-code" @tap="handleSendCode">发送验证码</text>
      </view>

      <view class="agreement" @tap="toggleAgree">
        <view class="checkbox" :class="{ checked: agreed }">
          <view v-if="agreed" class="checkbox-inner"></view>
        </view>
        <text class="agreement-text">
          我已阅读并同意
          <text class="link">用户手册</text>
          和
          <text class="link">隐私政策</text>
        </text>
      </view>

      <button class="login-btn" :class="{ enabled: canSubmit }" hover-class="none" @tap="handleLogin">
        登录
      </button>

      <text class="tip">使用未注册的手机号将自动创建用户账户</text>
    </view>
  </view>
</template>

<script>
const VALID_PHONE = '18918344469'
const VALID_CODE = '8792912'
const STORAGE_KEY = 'starbase_logged_in'

export default {
  data() {
    return {
      phone: '',
      code: '',
      agreed: false
    }
  },
  computed: {
    canSubmit() {
      return this.agreed && this.phone.length > 0 && this.code.length > 0
    }
  },
  onShow() {
    const loggedIn = uni.getStorageSync(STORAGE_KEY)
    if (loggedIn) {
      uni.reLaunch({ url: '/pages/product/index' })
    }
  },
  methods: {
    toggleAgree() {
      this.agreed = !this.agreed
    },
    handleSendCode() {
      if (this.phone !== VALID_PHONE) {
        uni.showToast({
          title: '请输入指定手机号',
          icon: 'none'
        })
        return
      }

      uni.showToast({
        title: `固定验证码：${VALID_CODE}`,
        icon: 'none',
        duration: 2200
      })
    },
    handleLogin() {
      if (!this.agreed) {
        uni.showToast({
          title: '请先阅读并同意协议',
          icon: 'none'
        })
        return
      }

      if (this.phone !== VALID_PHONE) {
        uni.showToast({
          title: '手机号错误',
          icon: 'none'
        })
        return
      }

      if (this.code !== VALID_CODE) {
        uni.showToast({
          title: '验证码错误',
          icon: 'none'
        })
        return
      }

      uni.setStorageSync(STORAGE_KEY, true)
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        uni.reLaunch({ url: '/pages/product/index' })
      }, 300)
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: calc(var(--status-bar-height) + 120rpx) 48rpx 0;
}

.hero {
  display: flex;
  justify-content: center;
}

.brand {
  font-size: 84rpx;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 6rpx;
  color: #a07f68;
}

.form-area {
  margin-top: 182rpx;
}

.form-card {
  display: flex;
  align-items: center;
  width: 100%;
  height: 114rpx;
  padding: 0 34rpx;
  margin-bottom: 22rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10rpx 28rpx rgba(173, 142, 118, 0.12);
}

.input {
  flex: 1;
  height: 100%;
  font-size: 33rpx;
  color: #272727;
}

.placeholder {
  color: #232323;
}

.code-card {
  justify-content: space-between;
}

.code-input {
  padding-right: 24rpx;
}

.send-code {
  flex-shrink: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: #b58f74;
}

.agreement {
  display: flex;
  align-items: center;
  margin-top: 30rpx;
}

.checkbox {
  width: 34rpx;
  height: 34rpx;
  margin-right: 14rpx;
  border: 2rpx solid #d7bda8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.72);
}

.checkbox.checked {
  border-color: #cfaf98;
}

.checkbox-inner {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #cfaf98;
}

.agreement-text {
  font-size: 28rpx;
  color: #836c5b;
}

.link {
  color: #8f725f;
}

.login-btn {
  width: 100%;
  height: 100rpx;
  margin-top: 96rpx;
  border: 0;
  border-radius: 22rpx;
  background: #dcc8b8;
  color: #ffffff;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 100rpx;
  letter-spacing: 2rpx;
}

.login-btn::after {
  border: 0;
}

.login-btn.enabled {
  background: linear-gradient(180deg, #ddcabd 0%, #d7c0b1 100%);
  box-shadow: 0 14rpx 28rpx rgba(175, 143, 118, 0.14);
}

.tip {
  display: block;
  margin-top: 34rpx;
  text-align: center;
  font-size: 27rpx;
  color: #232323;
}
</style>
