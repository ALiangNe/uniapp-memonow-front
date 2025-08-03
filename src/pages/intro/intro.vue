<template>
  <view class="intro-container">
    <!-- 头部区域 -->
    <view class="header-section">
      <view class="logo-area">
        <text class="logo-icon">📝</text>
        <text class="app-name">快捷备忘录</text>
      </view>
      <text class="app-slogan">记录生活，管理思绪</text>
    </view>

    <!-- 产品介绍图片区域 -->
    <view class="image-section">
      <view class="feature-image">
        <view class="mockup-phone">
          <view class="phone-screen">
            <view class="mock-header">
              <text class="mock-title">📝 我的备忘录</text>
            </view>
            <view class="mock-list">
              <view class="mock-item">
                <text class="mock-item-title">工作计划</text>
                <text class="mock-item-time">2分钟前</text>
              </view>
              <view class="mock-item">
                <text class="mock-item-title">购物清单</text>
                <text class="mock-item-time">1小时前</text>
              </view>
              <view class="mock-item">
                <text class="mock-item-title">学习笔记</text>
                <text class="mock-item-time">已修改</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>



    <!-- 开始使用按钮 -->
    <view class="action-section">
      <button class="start-btn" @click="goToMemoList">
        <text class="btn-text">开始使用</text>
        <text class="btn-icon">→</text>
      </button>

      <view class="tips">
        <text class="tips-text">点击开始使用，立即体验快捷备忘录</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    // 跳转到备忘录列表页面
    goToMemoList() {
      uni.navigateTo({
        url: '/pages/index/index'
      });
    }
  }
}
</script>

<style scoped>
.intro-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  display: flex;
  flex-direction: column;
}

/* 头部区域 */
.header-section {
  text-align: center;
  margin-bottom: 60rpx;
  padding-top: 80rpx;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.logo-icon {
  font-size: 120rpx;
  margin-right: 30rpx;
}

.app-name {
  font-size: 64rpx;
  font-weight: bold;
  color: #fff;
}

.app-slogan {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
}

/* 图片区域 */
.image-section {
  margin-bottom: 60rpx;
  display: flex;
  justify-content: center;
}

.feature-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.mockup-phone {
  width: 360rpx;
  height: 640rpx;
  background: #333;
  border-radius: 50rpx;
  padding: 25rpx;
  box-shadow: 0 25rpx 50rpx rgba(0, 0, 0, 0.3);
  position: relative;
}

.mockup-phone::before {
  content: '';
  position: absolute;
  top: 15rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 10rpx;
  background: #666;
  border-radius: 5rpx;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 35rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mock-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 25rpx 25rpx;
  color: #fff;
}

.mock-title {
  font-size: 32rpx;
  font-weight: bold;
}

.mock-list {
  flex: 1;
  padding: 25rpx;
}

.mock-item {
  background: #f8f9fa;
  padding: 25rpx;
  border-radius: 15rpx;
  margin-bottom: 15rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mock-item-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.mock-item-time {
  font-size: 24rpx;
  color: #999;
}



/* 开始使用按钮 */
.action-section {
  margin-top:30rpx;
  text-align: center;
}

.start-btn {
  width: 60%;
  max-width: 400rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border-radius: 50rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(255, 107, 107, 0.3);
  margin: 0 auto 20rpx auto;
  transition: all 0.3s ease;
}

.start-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 5rpx 15rpx rgba(255, 107, 107, 0.3);
}

.btn-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-right: 12rpx;
}

.btn-icon {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.tips {
  margin-top: 20rpx;
}

.tips-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>
