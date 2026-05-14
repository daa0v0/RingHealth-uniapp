<template>
  <view class="tab-shell">
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: active === 'product' }" @tap="switchTo('/pages/product/index')">
        <image class="tab-icon" :src="active === 'product' ? icons.productActive : icons.product" mode="aspectFit"></image>
        <text class="label">产品</text>
      </view>

      <view class="tab-item center-item" :class="{ active: active === 'base' }" @tap="switchTo('/pages/base/index')">
        <view class="center-pill">
          <image class="center-icon" src="/static/images/device/icon_pedestal.webp" mode="aspectFit"></image>
        </view>
        <text class="label">基座</text>
      </view>

      <view class="tab-item" :class="{ active: active === 'mine' }" @tap="switchTo('/pages/mine/index')">
        <image class="tab-icon" :src="active === 'mine' ? icons.mineActive : icons.mine" mode="aspectFit"></image>
        <text class="label">我的</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    active: {
      type: String,
      default: 'base'
    }
  },
  data() {
    return {
      icons: {
        product: '/static/images/main/nav_product.webp',
        productActive: '/static/images/main/nav_product_active.webp',
        mine: '/static/images/main/nav_profile.webp',
        mineActive: '/static/images/main/nav_profile_active.webp'
      }
    }
  },
  methods: {
    switchTo(url) {
      uni.reLaunch({ url })
    }
  }
}
</script>

<style scoped>
.tab-shell {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.98);
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -10rpx 30rpx rgba(108, 87, 70, 0.08);
}

.tab-bar {
  min-height: 118rpx;
  padding: 14rpx 0 18rpx;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #b4aea8;
}

.tab-item.active {
  color: #9f7f68;
}

.tab-icon {
  width: 46rpx;
  height: 46rpx;
}

.center-item {
  transform: translateY(-12rpx);
}

.center-pill {
  width: 98rpx;
  height: 98rpx;
  border-radius: 50%;
  background: linear-gradient(180deg, #e4d4c7 0%, #cfb8a7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 26rpx rgba(164, 128, 103, 0.22);
}

.center-icon {
  width: 54rpx;
  height: 54rpx;
}

.label {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1;
}

.center-item .label {
  margin-top: 10rpx;
}
</style>
