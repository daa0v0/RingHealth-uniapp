<template>
  <view class="safe-page product-page">
    <scroll-view scroll-y class="page-scroll" show-scrollbar="false">
      <view class="content">
        <text class="page-title">产品</text>

        <view v-for="item in products" :key="item.title" class="product-card">
          <image class="cover" :src="item.cover" mode="aspectFill"></image>
          <view class="info">
            <text class="title">{{ item.title }}</text>
            <text class="time">{{ item.time }}</text>
            <view class="desc-row">
              <text class="desc">{{ item.desc }}</text>
              <view class="more-btn" @tap="handleMore(item)">
                <text class="more-text">了解更多</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <BottomTab active="product" />
  </view>
</template>

<script>
import BottomTab from '../../components/BottomTab.vue'

export default {
  components: { BottomTab },
  data() {
    return {
      products: [
        {
          title: '测试',
          time: '2024-05-30 02:14:41',
          desc: '测试内容测试内容测试内容测试内容',
          cover: '/static/images/home/demo_product1.webp'
        },
        {
          title: '测试2',
          time: '2024-05-30 02:14:41',
          desc: '测试内容测试内容测试内容测试内容',
          cover: '/static/images/home/demo_product2.webp'
        },
        // {
        //   title: '测试3',
        //   time: '2024-05-30 02:14:41',
        //   desc: '测试内容测试内容测试内容测试内容',
        //   cover: '/static/images/home/demo_product3.webp'
        // }
      ]
    }
  },
  methods: {
    handleMore(item) {
      uni.showToast({
        title: `${item.title} 敬请期待`,
        icon: 'none'
      })
    }
  }
}
</script>

<style scoped>
.product-page {
  height: 100vh;
  background: #f7f6f3;
}

.page-scroll {
  height: 100%;
}

.content {
  padding: calc(var(--status-bar-height) + 28rpx) 22rpx 170rpx;
}

.page-title {
  display: block;
  margin-bottom: 18rpx;
  font-size: 22rpx;
  line-height: 1.2;
  color: #333333;
}

.product-card {
  margin-bottom: 26rpx;
  border-radius: 18rpx;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 10rpx 26rpx rgba(51, 51, 51, 0.06);
}

.cover {
  width: 100%;
  height: 368rpx;
  display: block;
  background: #e8e8e8;
}

.info {
  padding: 20rpx 22rpx 22rpx;
}

.title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #222222;
}

.time {
  display: block;
  margin-top: 10rpx;
  font-size: 20rpx;
  color: #b8b8b8;
}

.desc-row {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.desc {
  flex: 1;
  padding-right: 16rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: #b3b3b3;
}

.more-btn {
  flex-shrink: 0;
  min-width: 112rpx;
  height: 46rpx;
  padding: 0 18rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #f4c978 0%, #efb54d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-text {
  font-size: 20rpx;
  line-height: 1;
  color: #ffffff;
}
</style>
