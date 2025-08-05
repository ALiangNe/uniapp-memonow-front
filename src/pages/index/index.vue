<template>
  <view class="container">
    <!-- 顶部装饰区域 -->
    <view class="header-section">
      <view class="header-decoration">
        <view class="decoration-circle circle-1"></view>
        <view class="decoration-circle circle-2"></view>
        <view class="decoration-circle circle-3"></view>
      </view>
      <view class="header-content">
        <view class="header-icon">📝</view>
        <text class="header-title">我的备忘录</text>
        <text class="header-subtitle">记录生活的每一个瞬间</text>
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search-container">
      <view class="search-box">
        <view class="search-icon">🔍</view>
        <input
          class="search-input"
          type="text"
          placeholder="搜索备忘录标题或内容..."
          v-model="searchKeyword"
          @input="onSearchInput"
          @confirm="onSearchConfirm"
          confirm-type="search"
        />
        <view
          class="clear-icon"
          v-if="searchKeyword"
          @click="clearSearch"
        >✕</view>
      </view>
    </view>

    <!-- 备忘录网格布局 -->
    <view class="memo-grid">
      <!-- 空状态 -->
      <view v-if="filteredMemos.length === 0 && !searchKeyword" class="empty-state">
        <view class="empty-icon">📝</view>
        <text class="empty-text">暂无备忘录</text>
        <text class="empty-tip">点击右下角 ✨ 号添加第一个备忘录</text>
      </view>

      <!-- 搜索无结果状态 -->
      <view v-else-if="filteredMemos.length === 0 && searchKeyword" class="empty-state">
        <view class="empty-icon">🔍</view>
        <text class="empty-text">未找到相关备忘录</text>
        <text class="empty-tip">尝试使用其他关键词搜索</text>
      </view>

      <!-- 备忘录卡片网格 -->
      <view v-else class="grid-container">
        <view
          class="memo-card"
          v-for="memo in filteredMemos"
          :key="memo.id"
          @click="goToDetail(memo.id)"
        >
          <view class="card-header">
            <view class="card-title-container">
              <view class="card-icon">📄</view>
              <text class="card-title">{{ memo.title }}</text>
            </view>
          </view>
          <view class="card-content">
            <text class="card-text">{{ memo.content }}</text>
          </view>
          <view class="card-footer">
            <view class="time-info">
              <view class="time-container">
                <view class="time-icon">🕒</view>
                <text class="update-time">{{ formatTime(memo.updateTime) }}</text>
              </view>
              <view class="status-container">
                <text class="time-label" v-if="memo.createTime !== memo.updateTime">
                  <view class="edit-icon">✏️</view>
                  已修改
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 用户信息按钮 -->
    <view class="floating-user-btn" @click="goToProfile">
      <text class="user-icon">👤</text>
    </view>

    <!-- 悬浮添加按钮 -->
    <view class="floating-add-btn" @click="goToAdd">
      <text class="add-icon">✨</text>
    </view>
  </view>
</template>

<script>
import authManager from '@/utils/auth.js';
import memoAPI from '@/utils/memo-api.js';

export default {
  data() {
    return {
      memos: [],
      loading: false,
      userInfo: null,
      searchKeyword: '', // 搜索关键词
      searchTimer: null // 搜索防抖定时器
    }
  },

  computed: {
    // 过滤后的备忘录列表
    filteredMemos() {
      if (!this.searchKeyword.trim()) {
        return this.memos;
      }

      const keyword = this.searchKeyword.toLowerCase().trim();
      return this.memos.filter(memo => {
        const title = (memo.title || '').toLowerCase();
        const content = (memo.content || '').toLowerCase();
        const tags = (memo.tags || []).join(' ').toLowerCase();

        return title.includes(keyword) ||
               content.includes(keyword) ||
               tags.includes(keyword);
      });
    }
  },

  onLoad() {
    console.log('首页加载');

    // 检查登录状态
    if (!authManager.checkLoginStatus()) {
      console.log('用户未登录，跳转到介绍页');
      uni.reLaunch({
        url: '/pages/intro/intro'
      });
      return;
    }

    // 获取用户信息
    this.userInfo = authManager.getUserInfo();
    console.log('当前用户:', this.userInfo);

    // 页面加载时从API获取数据
    this.loadMemos();

    // 监听刷新事件
    uni.$on('refreshMemoList', () => {
      this.loadMemos();
    });
  },

  onShow() {
    // 检查登录状态
    if (!authManager.checkLoginStatus()) {
      uni.reLaunch({
        url: '/pages/intro/intro'
      });
      return;
    }

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
        const response = await memoAPI.getList();
        if (response && response.data) {
          this.memos = response.data;
          console.log('加载备忘录成功:', response.data.length, '条');

          // 调试：打印第一个备忘录的时间信息
          if (response.data.length > 0) {
            const firstMemo = response.data[0];
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

    // 跳转到用户信息页面
    goToProfile() {
      uni.navigateTo({
        url: '/pages/profile/profile'
      });
    },

    // 跳转到详情页面
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    },

    // 搜索输入事件（防抖处理）
    onSearchInput(e) {
      const value = e.detail.value;
      this.searchKeyword = value;

      // 清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }

      // 设置新的定时器，300ms后执行搜索
      this.searchTimer = setTimeout(() => {
        this.performSearch();
      }, 300);
    },

    // 搜索确认事件
    onSearchConfirm(e) {
      this.searchKeyword = e.detail.value;
      this.performSearch();
    },

    // 执行搜索
    performSearch() {
      const keyword = this.searchKeyword.trim();

      if (keyword) {
        console.log('搜索关键词:', keyword);
        console.log('搜索结果数量:', this.filteredMemos.length);

        // 可以在这里添加搜索统计或其他逻辑
        if (this.filteredMemos.length === 0) {
          uni.showToast({
            title: '未找到相关备忘录',
            icon: 'none',
            duration: 1500
          });
        }
      }
    },

    // 清空搜索
    clearSearch() {
      this.searchKeyword = '';

      // 清除定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }

      console.log('清空搜索，显示所有备忘录');
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
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
  padding: 0;
}

/* 顶部装饰区域 */
.header-section {
  position: relative;
  padding: 60rpx 40rpx 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 0 50rpx 50rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 120rpx;
  height: 120rpx;
  top: 20rpx;
  right: 60rpx;
  animation-delay: 0s;
}

.circle-2 {
  width: 80rpx;
  height: 80rpx;
  top: 120rpx;
  right: 200rpx;
  animation-delay: 2s;
}

.circle-3 {
  width: 60rpx;
  height: 60rpx;
  top: 60rpx;
  left: 80rpx;
  animation-delay: 4s;
}

.header-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.header-icon {
  font-size: 60rpx;
  margin-bottom: 20rpx;
  animation: bounce 2s ease-in-out infinite;
}

.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: white;
  margin-bottom: 10rpx;
}

.header-subtitle {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 浮动动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20rpx) rotate(180deg);
  }
}

/* 弹跳动画 */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10rpx);
  }
  60% {
    transform: translateY(-5rpx);
  }
}

/* 搜索框样式 */
.search-container {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20rpx 30rpx 20rpx 30rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 50rpx;
  padding: 0 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.15);
  height: 80rpx;
  border: 2rpx solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.search-box:focus-within {
  box-shadow: 0 6rpx 25rpx rgba(102, 126, 234, 0.25);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-2rpx);
}

.search-icon {
  font-size: 32rpx;
  color: #999;
  margin-right: 20rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  height: 80rpx;
  line-height: 80rpx;
}

.search-input::placeholder {
  color: #999;
  font-size: 28rpx;
}

.clear-icon {
  font-size: 28rpx;
  color: #999;
  margin-left: 20rpx;
  padding: 10rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.clear-icon:active {
  background-color: #e0e0e0;
  transform: scale(0.95);
}

/* 备忘录网格容器 */
.memo-grid {
  width: 100%;
  padding: 0 20rpx 20rpx 20rpx;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
  background: white;
  border-radius: 30rpx;
  margin: 40rpx 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
  animation: bounce 2s ease-in-out infinite;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #666;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.empty-tip {
  display: block;
  font-size: 26rpx;
  color: #999;
  line-height: 1.5;
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
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.12);
  border: 2rpx solid rgba(102, 126, 234, 0.08);
  min-height: 220rpx;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.memo-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.memo-card:active {
  transform: translateY(-4rpx) scale(0.98);
  box-shadow: 0 8rpx 25rpx rgba(102, 126, 234, 0.2);
}

/* 卡片头部 */
.card-header {
  margin-bottom: 20rpx;
}

.card-title-container {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.card-icon {
  font-size: 24rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

/* 卡片内容 */
.card-content {
  flex: 1;
  margin-bottom: 20rpx;
}

.card-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片底部 */
.card-footer {
  margin-top: auto;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  padding-top: 16rpx;
}

.time-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.time-container {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}

.time-icon {
  font-size: 20rpx;
}

.update-time {
  font-size: 22rpx;
  color: #999;
}

.status-container {
  flex-shrink: 0;
}

.time-label {
  font-size: 20rpx;
  color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  border: 1rpx solid rgba(102, 126, 234, 0.2);
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.edit-icon {
  font-size: 16rpx;
}

/* 悬浮用户信息按钮 */
.floating-user-btn {
  position: fixed;
  left: 40rpx;
  bottom: 40rpx;
  width: 110rpx;
  height: 110rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.4);
  z-index: 999;
  transition: all 0.3s ease;
  animation: pulse-user 3s ease-in-out infinite;
}

.floating-user-btn:active {
  transform: scale(0.9);
}

.user-icon {
  font-size: 44rpx;
  color: #fff;
  line-height: 1;
}

/* 悬浮添加按钮 */
.floating-add-btn {
  position: fixed;
  right: 40rpx;
  bottom: 40rpx;
  width: 110rpx;
  height: 110rpx;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(255, 107, 107, 0.4);
  z-index: 999;
  transition: all 0.3s ease;
  animation: pulse-add 3s ease-in-out infinite;
}

.floating-add-btn:active {
  transform: scale(0.9);
}

.add-icon {
  font-size: 44rpx;
  color: #fff;
  font-weight: bold;
  line-height: 1;
}

/* 悬浮按钮脉冲动画 */
@keyframes pulse-user {
  0%, 100% {
    box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 15rpx 40rpx rgba(102, 126, 234, 0.6);
  }
}

@keyframes pulse-add {
  0%, 100% {
    box-shadow: 0 10rpx 30rpx rgba(255, 107, 107, 0.4);
  }
  50% {
    box-shadow: 0 15rpx 40rpx rgba(255, 107, 107, 0.6);
  }
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
