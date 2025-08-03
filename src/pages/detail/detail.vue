<template>
  <view class="detail-container">
    <!-- 详情卡片 -->
    <view class="detail-card">
      <!-- 关闭按钮 -->
      <view class="close-btn" @click="goBack">
        <text class="close-icon">×</text>
      </view>
      
      <!-- 标题区域 -->
      <view class="title-section">
        <text class="memo-title">{{ memo.title }}</text>
      </view>
      
      <!-- 内容区域 -->
      <view class="content-section">
        <text class="memo-content">{{ memo.content }}</text>
      </view>
      
      <!-- 时间信息 -->
      <view class="time-section">
        <text class="time-label">创建时间：{{ formatTime(memo.createTime) }}</text>
        <text class="time-label">更新时间：{{ formatTime(memo.updateTime) }}</text>
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
        <text class="btn-icon">{{ editLoading ? '⏳' : '✏️' }}</text>
        <text class="btn-text">{{ editLoading ? '加载中...' : '修改' }}</text>
      </button>
      <button
        class="action-btn delete-btn"
        :class="{ loading: deleteLoading }"
        @click="deleteMemo"
        :disabled="editLoading || deleteLoading"
      >
        <text class="btn-icon">{{ deleteLoading ? '⏳' : '🗑️' }}</text>
        <text class="btn-text">{{ deleteLoading ? '删除中...' : '删除' }}</text>
      </button>
    </view>
  </view>
</template>

<script>
import MemoAPI from '@/utils/api.js';

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
        const data = await MemoAPI.getMemoDetail(this.memoId);
        if (data) {
          this.memo = data;
        } else {
          // API已经显示了错误提示，直接返回
          this.goBack();
        }
      } catch (error) {
        console.error('加载备忘录详情失败:', error);
        uni.showToast({
          title: '加载失败，请重试',
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
        const success = await MemoAPI.deleteMemo(this.memoId);

        // 隐藏加载提示
        uni.hideLoading();

        if (success) {
          // 删除成功，再次刷新列表确保数据同步
          uni.$emit('refreshMemoList');

          // 显示成功提示
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          });
        } else {
          // 删除失败，显示错误提示
          uni.showToast({
            title: '删除失败，请重试',
            icon: 'none',
            duration: 2000
          });

          // 刷新列表以恢复数据显示
          uni.$emit('refreshMemoList');
        }
      } catch (error) {
        console.error('删除备忘录失败:', error);

        // 隐藏加载提示
        uni.hideLoading();

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

    // 格式化时间
    formatTime(timeStr) {
      try {
        // 解析时间
        let date = new Date(timeStr);
        const now = new Date();

        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          console.error('无效的时间格式:', timeStr);
          return timeStr;
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
        return timeStr;
      }
    }
  }
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
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
  max-width: 650rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 50rpx 40rpx 40rpx;
  position: relative;
  max-height: 75vh;
  overflow-y: auto;
  box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.3);
  border: 3rpx solid #ddd;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 25rpx;
  right: 25rpx;
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background-color: #f8f8f8;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.close-btn:active {
  background-color: #e8e8e8;
  transform: scale(0.95);
}

.close-icon {
  font-size: 40rpx;
  color: #666;
  font-weight: bold;
  line-height: 1;
}

/* 标题区域 */
.title-section {
  margin-bottom: 40rpx;
  padding-right: 100rpx; /* 为关闭按钮留出空间 */
  border-bottom: 2rpx solid #f0f0f0;
  padding-bottom: 30rpx;
}

.memo-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.3;
  word-break: break-all;
}

/* 内容区域 */
.content-section {
  margin-bottom: 40rpx;
  flex: 1;
}

.memo-content {
  font-size: 30rpx;
  color: #555;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  text-align: justify;
}

/* 时间信息 */
.time-section {
  border-top: 1rpx solid #e5e5e5;
  padding-top: 20rpx;
  margin-bottom: 20rpx;
}

.time-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

/* 底部操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
  padding: 0 20rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.action-btn:active::before {
  transform: translateX(100%);
}

.edit-btn {
  background: linear-gradient(135deg, #007aff 0%, #0056d3 100%);
  color: #fff;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #0056d3 0%, #003d99 100%);
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #ff4757 0%, #d63031 100%);
  color: #fff;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #d63031 0%, #b71c1c 100%);
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 20rpx rgba(255, 71, 87, 0.3);
}

.action-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.btn-icon {
  font-size: 32rpx;
  line-height: 1;
  transition: transform 0.3s ease;
}

.btn-text {
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1;
  transition: transform 0.3s ease;
}

.action-btn:hover .btn-icon {
  transform: scale(1.1);
}

.action-btn:hover .btn-text {
  transform: translateX(2rpx);
}

.action-btn:active .btn-icon {
  transform: scale(0.95);
}

.action-btn:active .btn-text {
  transform: translateX(0);
}

/* 添加按钮加载状态和禁用状态 */
.action-btn.loading,
.action-btn:disabled {
  pointer-events: none;
  opacity: 0.7;
  transform: none !important;
}

.action-btn.loading .btn-icon {
  animation: rotate 1s linear infinite;
}

.action-btn:disabled {
  background: #ccc !important;
  color: #999 !important;
  box-shadow: none !important;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
