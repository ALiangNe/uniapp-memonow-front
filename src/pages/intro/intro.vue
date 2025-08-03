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



    <!-- 登录按钮区域 -->
    <view class="action-section">
      <!-- 微信登录按钮 -->
      <button class="wechat-login-btn" @click="handleWechatLogin" :disabled="isLogging">
        <text class="btn-icon">👤</text>
        <text class="btn-text">{{ isLogging ? '登录中...' : '微信快速登录' }}</text>
      </button>

      <view class="tips">
        <text class="tips-text">安全登录，数据隔离</text>
      </view>
    </view>
  </view>
</template>

<script>
import authManager from '@/utils/auth.js';

export default {
  data() {
    return {
      isLogging: false
    };
  },

  onLoad() {
    console.log('引导页加载');

    // 检查用户是否已经登录
    if (authManager.checkLoginStatus()) {
      console.log('用户已登录，直接跳转到首页');
      // 延迟一下让用户看到引导页
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index/index'
        });
      }, 1000);
    }
  },

  methods: {
    /**
     * 微信登录
     */
    async handleWechatLogin() {
      if (this.isLogging) return;

      try {
        this.isLogging = true;
        console.log('开始微信登录...');

        uni.showLoading({
          title: '登录中...',
          mask: true
        });

        const result = await authManager.wechatLogin();

        if (result) {
          console.log('登录成功:', result);
          uni.hideLoading();

          uni.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          });

          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            });
          }, 1500);
        } else {
          throw new Error('登录失败');
        }
      } catch (error) {
        console.error('微信登录失败:', error);
        uni.hideLoading();

        uni.showModal({
          title: '登录失败',
          content: error.message || '登录过程中出现错误，请重试',
          showCancel: false,
          confirmText: '确定'
        });
      } finally {
        this.isLogging = false;
      }
    },


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



/* 登录按钮区域 */
.action-section {
  margin-top: 30rpx;
  text-align: center;
}

/* 微信登录按钮 */
.wechat-login-btn {
  width: 70%;
  max-width: 450rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  border-radius: 50rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(7, 193, 96, 0.3);
  margin: 0 auto 25rpx auto;
  transition: all 0.3s ease;
}

.wechat-login-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 5rpx 15rpx rgba(7, 193, 96, 0.3);
}

.wechat-login-btn[disabled] {
  opacity: 0.6;
  transform: none;
}



.btn-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-left: 12rpx;
}

.btn-icon {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.tips {
  margin-top: 25rpx;
}

.tips-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}
</style>
