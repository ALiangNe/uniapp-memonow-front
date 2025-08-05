<template>
  <view class="detail-container">
    <!-- 背景装饰 -->
    <view class="background-decoration">
      <view class="decoration-circle circle-1"></view>
      <view class="decoration-circle circle-2"></view>
      <view class="decoration-circle circle-3"></view>
      <view class="decoration-circle circle-4"></view>
    </view>

    <!-- 详情卡片 -->
    <view class="detail-card">
      <!-- 顶部装饰条 -->
      <view class="card-header">
        <view class="header-decoration">
          <view class="decoration-dot dot-1"></view>
          <view class="decoration-dot dot-2"></view>
          <view class="decoration-dot dot-3"></view>
        </view>
        <view class="close-btn" @click="goBack">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <!-- 标题区域 -->
      <view class="title-section">
        <view class="title-header">
          <view class="title-icon">📝</view>
          <text class="section-label">标题</text>
        </view>
        <view class="title-content">
          <text class="memo-title">{{ memo.title || '无标题' }}</text>
        </view>
      </view>

      <!-- 内容区域 -->
      <view class="content-section">
        <view class="content-header">
          <view class="content-icon">📄</view>
          <text class="section-label">内容</text>
          <view class="content-stats">
            <text class="word-count">{{ getWordCount(memo.content) }} 字</text>
          </view>
        </view>
        <view class="content-wrapper">
          <text class="memo-content">{{ memo.content || '暂无内容' }}</text>
        </view>
      </view>

      <!-- 标签区域 -->
      <view class="tags-section" v-if="memo.tags && memo.tags.length > 0">
        <view class="tags-header">
          <view class="tags-icon">🏷️</view>
          <text class="section-label">标签</text>
        </view>
        <view class="tags-list">
          <view
            class="tag-item"
            v-for="tag in memo.tags"
            :key="tag"
          >
            {{ tag }}
          </view>
        </view>
      </view>

      <!-- 时间信息 -->
      <view class="time-section">
        <view class="time-header">
          <view class="time-icon">⏰</view>
          <text class="section-label">时间信息</text>
        </view>
        <view class="time-list">
          <view class="time-item">
            <view class="time-item-icon">📅</view>
            <view class="time-item-content">
              <text class="time-label">创建时间</text>
              <text class="time-value">{{ formatTime(memo.createTime) }}</text>
            </view>
          </view>
          <view class="time-item">
            <view class="time-item-icon">🔄</view>
            <view class="time-item-content">
              <text class="time-label">更新时间</text>
              <text class="time-value">{{ formatTime(memo.updateTime) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="action-buttons">
      <button
        class="action-btn edit-btn"
        :class="{ loading: editLoading }"
        @click="goToEdit"
        :disabled="editLoading || deleteLoading"
      >
        <view class="btn-content">
          <text class="btn-icon">{{ editLoading ? '⏳' : '✏️' }}</text>
          <text class="btn-text">{{ editLoading ? '加载中...' : '编辑' }}</text>
        </view>
      </button>
      <button
        class="action-btn delete-btn"
        :class="{ loading: deleteLoading }"
        @click="deleteMemo"
        :disabled="editLoading || deleteLoading"
      >
        <view class="btn-content">
          <text class="btn-icon">{{ deleteLoading ? '⏳' : '🗑️' }}</text>
          <text class="btn-text">{{ deleteLoading ? '删除中...' : '删除' }}</text>
        </view>
      </button>
    </view>
  </view>
</template>

<script>
import authManager from '@/utils/auth.js';
import memoAPI from '@/utils/memo-api.js';

export default {
  data() {
    return {
      memoId: null,
      memo: {
        id: null,
        title: '',
        content: '',
        createTime: '',
        updateTime: ''
      },
      loading: false,
      editLoading: false,
      deleteLoading: false
    }
  },

  onLoad(options) {
    console.log('详情页面加载');

    // 检查登录状态
    if (!authManager.checkLoginStatus()) {
      console.log('用户未登录，跳转到介绍页');
      uni.reLaunch({
        url: '/pages/intro/intro'
      });
      return;
    }

    // 获取传递的备忘录ID
    this.memoId = options.id;
    this.loadMemoDetail();
  },

  methods: {
    // 加载备忘录详情
    async loadMemoDetail() {
      if (this.loading) return;

      this.loading = true;

      // 显示加载提示
      uni.showLoading({
        title: '加载中...'
      });

      try {
        const response = await memoAPI.getDetail(this.memoId);
        if (response && response.data) {
          this.memo = response.data;
          console.log('加载备忘录详情成功:', response.data);
        } else {
          uni.showToast({
            title: '备忘录不存在',
            icon: 'none'
          });
          this.goBack();
        }
      } catch (error) {
        console.error('加载备忘录详情失败:', error);

        // 如果是认证错误，跳转到介绍页
        if (error.message && error.message.includes('请先登录')) {
          uni.reLaunch({
            url: '/pages/intro/intro'
          });
          return;
        }

        uni.showToast({
          title: error.message || '加载失败，请重试',
          icon: 'none'
        });
        this.goBack();
      } finally {
        this.loading = false;
        uni.hideLoading();
      }
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 跳转到编辑页面
    goToEdit() {
      if (this.editLoading || this.deleteLoading) return;

      this.editLoading = true;

      // 模拟短暂加载，提升用户体验
      setTimeout(() => {
        uni.navigateTo({
          url: `/pages/edit/edit?id=${this.memoId}`,
          success: () => {
            this.editLoading = false;
          },
          fail: () => {
            this.editLoading = false;
            uni.showToast({
              title: '跳转失败',
              icon: 'none'
            });
          }
        });
      }, 300);
    },
    
    // 删除备忘录
    deleteMemo() {
      if (this.editLoading || this.deleteLoading) return;

      // 使用setTimeout确保模态框能正确显示在最顶层
      setTimeout(() => {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这条备忘录吗？删除后无法恢复。',
          confirmText: '确定删除',
          cancelText: '取消',
          confirmColor: '#ff4757',
          success: async (res) => {
            if (res.confirm) {
              // 点击确定后立即返回列表页面
              uni.navigateBack({
                delta: 1,
                success: () => {
                  // 返回成功后立即刷新列表
                  uni.$emit('refreshMemoList');

                  // 显示删除中的提示
                  uni.showLoading({
                    title: '删除中...',
                    mask: true
                  });

                  // 在后台执行删除操作
                  this.performDelete();
                },
                fail: () => {
                  // 如果navigateBack失败，尝试直接跳转到首页
                  uni.reLaunch({
                    url: '/pages/index/index'
                  });
                  // 在后台执行删除操作
                  this.performDelete();
                }
              });
            }
          },
          fail: (err) => {
            console.error('显示删除确认框失败:', err);
            uni.showToast({
              title: '操作失败，请重试',
              icon: 'none'
            });
          }
        });
      }, 50);
    },

    // 执行删除操作（后台执行）
    async performDelete() {
      try {
        const response = await memoAPI.delete(this.memoId);

        // 隐藏加载提示
        uni.hideLoading();

        if (response) {
          console.log('删除备忘录成功');

          // 删除成功，再次刷新列表确保数据同步
          uni.$emit('refreshMemoList');

          // 显示成功提示
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          });
        }
      } catch (error) {
        console.error('删除备忘录失败:', error);

        // 隐藏加载提示
        uni.hideLoading();

        // 如果是认证错误，跳转到介绍页
        if (error.message && error.message.includes('请先登录')) {
          uni.reLaunch({
            url: '/pages/intro/intro'
          });
          return;
        }

        // 删除失败，显示错误提示
        uni.showToast({
          title: error.message || '删除失败，请重试',
          icon: 'none',
          duration: 2000
        });

        // 刷新列表以恢复数据显示
        uni.$emit('refreshMemoList');

        // 显示错误提示
        uni.showToast({
          title: '网络错误，删除失败',
          icon: 'none',
          duration: 2000
        });

        // 刷新列表以恢复数据显示
        uni.$emit('refreshMemoList');
      }
    },

    // 获取字数统计
    getWordCount(content) {
      if (!content) return 0;
      // 移除空白字符后计算长度
      return content.replace(/\s/g, '').length;
    },

    // 格式化时间
    formatTime(timeStr) {
      try {
        // 解析时间
        let date = new Date(timeStr);
        const now = new Date();

        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          console.error('无效的时间格式:', timeStr);
          return '时间格式错误';
        }

        // 如果API返回的是UTC时间但服务器时区有问题，手动调整
        // 检查时差是否接近8小时（可能的时区问题）
        const diff = now.getTime() - date.getTime();
        const hoursDiff = diff / (60 * 60 * 1000);

        // 如果时差在7-9小时之间，可能是时区问题，尝试调整
        if (hoursDiff >= 7 && hoursDiff <= 9) {
          console.log('详情页检测到可能的时区问题，调整时间:', timeStr);
          // 将时间向前调整8小时（UTC+8）
          date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        }

        // 返回格式化的本地时间
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

      } catch (error) {
        console.error('时间格式化错误:', error, '原始时间:', timeStr);
        return '时间解析失败';
      }
    }
  }
}
</script>

<style scoped>
/* 容器样式 */
.detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(124, 142, 240, 0.1) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  overflow-y: auto;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(124, 142, 240, 0.1));
  animation: float 8s ease-in-out infinite;
}

.circle-1 {
  width: 200rpx;
  height: 200rpx;
  top: 10%;
  right: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150rpx;
  height: 150rpx;
  top: 60%;
  left: 5%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100rpx;
  height: 100rpx;
  top: 30%;
  left: 15%;
  animation-delay: 4s;
}

.circle-4 {
  width: 120rpx;
  height: 120rpx;
  bottom: 20%;
  right: 20%;
  animation-delay: 6s;
}

/* 兼容微信小程序 */
/* #ifdef MP-WEIXIN */
page {
  background-color: transparent !important;
}
/* #endif */

/* 详情卡片 */
.detail-card {
  width: 100%;
  max-width: 680rpx;
  background: white;
  border-radius: 24rpx;
  padding: 0;
  position: relative;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
}

/* 卡片头部 */
.card-header {
  position: relative;
  padding: 30rpx 30rpx 20rpx;
  background: linear-gradient(135deg, #667eea 0%, #7c8ef0 100%);
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-decoration {
  display: flex;
  gap: 8rpx;
  align-items: center;
}

.decoration-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
}

.dot-1 { animation: pulse 2s ease-in-out infinite; }
.dot-2 { animation: pulse 2s ease-in-out infinite 0.5s; }
.dot-3 { animation: pulse 2s ease-in-out infinite 1s; }

/* 关闭按钮 */
.close-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10rpx);
}

.close-btn:active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.close-icon {
  font-size: 28rpx;
  color: white;
  font-weight: 600;
  line-height: 1;
}

/* 滚动内容区域 */
.detail-card {
  overflow-y: auto;
}

.detail-card::-webkit-scrollbar {
  width: 4rpx;
}

.detail-card::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2rpx;
}

.detail-card::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2rpx;
}

.detail-card::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 通用区域样式 */
.title-section,
.content-section,
.tags-section,
.time-section {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.time-section {
  border-bottom: none;
}

/* 区域头部样式 */
.title-header,
.content-header,
.tags-header,
.time-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.title-icon,
.content-icon,
.tags-icon,
.time-icon {
  font-size: 24rpx;
  margin-right: 12rpx;
}

.section-label {
  flex: 1;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
}

/* 标题区域 */
.title-content {
  padding: 20rpx;
  background: #f8f9ff;
  border-radius: 12rpx;
  border-left: 4rpx solid #667eea;
}

.memo-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  word-break: break-all;
}

/* 内容区域 */
.content-stats {
  display: flex;
  align-items: center;
}

.word-count {
  font-size: 22rpx;
  color: #999;
  background: #f0f0f0;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.content-wrapper {
  padding: 20rpx;
  background: #f8f9ff;
  border-radius: 12rpx;
  border-left: 4rpx solid #7c8ef0;
  min-height: 120rpx;
}

.memo-content {
  font-size: 28rpx;
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 标签区域 */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  background: linear-gradient(135deg, #667eea, #7c8ef0);
  color: white;
  font-size: 22rpx;
  font-weight: 500;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

/* 时间信息 */
.time-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.time-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: #f8f9ff;
  border-radius: 12rpx;
  border-left: 4rpx solid #a8b5ff;
}

.time-item-icon {
  font-size: 24rpx;
  margin-right: 16rpx;
  width: 40rpx;
  text-align: center;
}

.time-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.time-label {
  font-size: 22rpx;
  color: #999;
  font-weight: 500;
}

.time-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
}

/* 底部操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
  padding: 0 40rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 20rpx;
  border: none;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 100%;
  position: relative;
  z-index: 2;
}

.btn-icon {
  font-size: 28rpx;
  line-height: 1;
}

.btn-text {
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1;
}

/* 编辑按钮 */
.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #7c8ef0 100%);
  color: white;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.4);
}

.edit-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.5);
}

.edit-btn .btn-text,
.edit-btn .btn-icon {
  color: white !important;
}

/* 删除按钮 */
.delete-btn {
  background: linear-gradient(135deg, #ff4757 0%, #d63031 100%);
  color: white;
  box-shadow: 0 4rpx 16rpx rgba(255, 71, 87, 0.4);
}

.delete-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(255, 71, 87, 0.5);
}

.delete-btn .btn-text,
.delete-btn .btn-icon {
  color: white !important;
}

/* 按钮加载状态和禁用状态 */
.action-btn.loading,
.action-btn:disabled {
  pointer-events: none;
  opacity: 0.7;
  transform: none !important;
}

.action-btn.loading .btn-icon {
  animation: spin 1s linear infinite;
}

.action-btn:disabled {
  background: #cccccc !important;
  color: #999999 !important;
  box-shadow: none !important;
}

.action-btn:disabled .btn-text,
.action-btn:disabled .btn-icon {
  color: #999999 !important;
}

/* 动画效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式适配 */
@media (max-width: 750rpx) {
  .detail-container {
    padding: 40rpx 30rpx;
  }

  .detail-card {
    max-width: 100%;
  }

  .action-buttons {
    padding: 0 30rpx;
  }

  .title-section,
  .content-section,
  .tags-section,
  .time-section {
    padding: 25rpx;
  }
}
</style>
