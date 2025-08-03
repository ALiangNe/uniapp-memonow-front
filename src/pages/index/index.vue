<template>
  <view class="container">
    <!-- 备忘录网格布局 -->
    <view class="memo-grid">
      <!-- 空状态 -->
      <view v-if="memos.length === 0" class="empty-state">
        <text class="empty-text">暂无备忘录</text>
        <text class="empty-tip">点击右下角 + 号添加第一个备忘录</text>
      </view>

      <!-- 备忘录卡片网格 -->
      <view v-else class="grid-container">
        <view
          class="memo-card"
          v-for="memo in memos"
          :key="memo.id"
          @click="goToDetail(memo.id)"
        >
          <view class="card-header">
            <text class="card-title">{{ memo.title }}</text>
          </view>
          <view class="card-content">
            <text class="card-text">{{ memo.content }}</text>
          </view>
          <view class="card-footer">
            <view class="time-info">
              <text class="update-time">{{ formatTime(memo.updateTime) }}</text>
              <text class="time-label" v-if="memo.createTime !== memo.updateTime">已修改</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 悬浮添加按钮 -->
    <view class="floating-add-btn" @click="goToAdd">
      <text class="add-icon">+</text>
    </view>
  </view>
</template>

<script>
import MemoAPI from '@/utils/api.js';

export default {
  data() {
    return {
      memos: [],
      loading: false
    }
  },

  onLoad() {
    // 页面加载时从API获取数据
    this.loadMemos();

    // 监听刷新事件
    uni.$on('refreshMemoList', () => {
      this.loadMemos();
    });
  },

  onShow() {
    // 页面显示时重新加载数据（从其他页面返回时刷新）
    this.loadMemos();
  },

  onUnload() {
    // 页面卸载时移除事件监听
    uni.$off('refreshMemoList');
  },

  methods: {
    // 加载备忘录数据
    async loadMemos() {
      if (this.loading) return;

      this.loading = true;

      // 显示加载提示
      uni.showLoading({
        title: '加载中...'
      });

      try {
        const data = await MemoAPI.getMemos();
        if (data) {
          this.memos = data;

          // 调试：打印第一个备忘录的时间信息
          if (data.length > 0) {
            const firstMemo = data[0];
            console.log('=== 时间调试信息 ===');
            console.log('原始updateTime:', firstMemo.updateTime);
            console.log('原始createTime:', firstMemo.createTime);
            console.log('解析后的updateTime:', new Date(firstMemo.updateTime));
            console.log('解析后的createTime:', new Date(firstMemo.createTime));
            console.log('当前本地时间:', new Date());
            console.log('时区偏移（分钟）:', new Date().getTimezoneOffset());
            console.log('===================');
          }
        }
      } catch (error) {
        console.error('加载备忘录失败:', error);
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        uni.hideLoading();
      }
    },

    // 跳转到添加页面
    goToAdd() {
      uni.navigateTo({
        url: '/pages/add/add'
      });
    },

    // 跳转到详情页面
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
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
        let diff = now.getTime() - date.getTime();
        const hoursDiff = diff / (60 * 60 * 1000);

        // 如果时差在7-9小时之间，可能是时区问题，尝试调整
        if (hoursDiff >= 7 && hoursDiff <= 9) {
          console.log('检测到可能的时区问题，尝试调整时间');
          // 将时间向前调整8小时（UTC+8）
          date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
          diff = now.getTime() - date.getTime();
        }

        // 调试信息
        console.log(`时间调试 - 原始: ${timeStr}, 调整后: ${date.toLocaleString('zh-CN')}, 当前: ${now.toLocaleString('zh-CN')}, 时差(分钟): ${Math.floor(diff / (60 * 1000))}`);

        // 如果时差为负数，说明是未来时间
        if (diff < 0) {
          return '刚刚';
        }

        // 1分钟内显示"刚刚"
        if (diff < 60 * 1000) {
          return '刚刚';
        }

        // 1小时内显示"X分钟前"
        if (diff < 60 * 60 * 1000) {
          const minutes = Math.floor(diff / (60 * 1000));
          return `${minutes}分钟前`;
        }

        // 24小时内显示"X小时前"
        if (diff < 24 * 60 * 60 * 1000) {
          const hours = Math.floor(diff / (60 * 60 * 1000));
          return `${hours}小时前`;
        }

        // 7天内显示"X天前"
        if (diff < 7 * 24 * 60 * 60 * 1000) {
          const days = Math.floor(diff / (24 * 60 * 60 * 1000));
          return `${days}天前`;
        }

        // 一年内显示月日
        if (date.getFullYear() === now.getFullYear()) {
          return date.toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit'
          });
        }

        // 超过一年显示年月日
        return date.toLocaleDateString('zh-CN');

      } catch (error) {
        console.error('时间格式化错误:', error, '原始时间:', timeStr);
        return timeStr;
      }
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
  padding: 20rpx;
}

/* 备忘录网格容器 */
.memo-grid {
  width: 100%;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 200rpx 0;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.empty-tip {
  display: block;
  font-size: 24rpx;
  color: #ccc;
}

/* 网格容器 */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding-bottom: 120rpx; /* 为悬浮按钮留出空间 */
}

/* 备忘录卡片样式 */
.memo-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  border: 2rpx solid #e5e5e5;
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.memo-card:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

/* 卡片头部 */
.card-header {
  margin-bottom: 16rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片内容 */
.card-content {
  flex: 1;
  margin-bottom: 16rpx;
}

.card-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片底部 */
.card-footer {
  margin-top: auto;
}

.time-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
}

.update-time {
  font-size: 20rpx;
  color: #999;
  flex: 1;
}

.time-label {
  font-size: 18rpx;
  color: #007aff;
  background-color: rgba(0, 122, 255, 0.1);
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  border: 1rpx solid rgba(0, 122, 255, 0.2);
}

/* 悬浮添加按钮 */
.floating-add-btn {
  position: fixed;
  right: 40rpx;
  bottom: 40rpx;
  width: 100rpx;
  height: 100rpx;
  background-color: #007aff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.3);
  z-index: 999;
  transition: all 0.3s ease;
}

.floating-add-btn:active {
  transform: scale(0.9);
}

.add-icon {
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
  line-height: 1;
}

/* 响应式调整 */
@media (max-width: 750rpx) {
  .grid-container {
    grid-template-columns: 1fr;
    gap: 16rpx;
  }

  .memo-card {
    min-height: 160rpx;
  }
}
</style>
