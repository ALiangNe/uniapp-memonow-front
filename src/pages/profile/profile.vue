<template>
  <view class="profile-container">
    <!-- 顶部装饰区域 -->
    <view class="header-section">
      <view class="header-decoration">
        <view class="decoration-circle circle-1"></view>
        <view class="decoration-circle circle-2"></view>
        <view class="decoration-circle circle-3"></view>
      </view>
      <view class="header-content">
        <view class="header-icon">👤</view>
        <text class="header-title">个人中心</text>
        <text class="header-subtitle">管理你的账户信息</text>
      </view>
    </view>

    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar-section">
        <!-- 头像选择按钮 -->
        <button
          class="avatar-wrapper"
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
          :disabled="isUpdating"
        >
          <image
            class="avatar"
            :src="currentAvatarUrl || '/static/default-avatar.svg'"
            mode="aspectFill"
          ></image>
          <view class="avatar-edit-hint">
            <text class="edit-icon">📷</text>
          </view>
        </button>

        <!-- 昵称编辑表单 -->
        <form @submit="onSubmitNickname">
          <view class="nickname-section">
            <input
              class="nickname-input"
              type="nickname"
              :value="currentNickname"
              @input="onNicknameInput"
              @blur="onNicknameBlur"
              placeholder="请输入昵称"
              maxlength="20"
              :disabled="isUpdating"
            />
            <button
              class="save-nickname-btn"
              form-type="submit"
              :disabled="!hasNicknameChanged || isUpdating"
              v-if="hasNicknameChanged"
            >
              保存
            </button>
          </view>
        </form>
      </view>
      
      <view class="info-section">
        <view class="info-item">
          <view class="info-label-container">
            <view class="info-icon">🆔</view>
            <text class="info-label">用户ID</text>
          </view>
          <text class="info-value user-id-value" @click="copyUserId">{{ formatUserId(userInfo.userId) }}</text>
        </view>
        <view class="info-item">
          <view class="info-label-container">
            <view class="info-icon">📅</view>
            <text class="info-label">注册时间</text>
          </view>
          <text class="info-value">{{ formatTime(userInfo.createdTime) }}</text>
        </view>
        <view class="info-item">
          <view class="info-label-container">
            <view class="info-icon">⏰</view>
            <text class="info-label">最后活跃</text>
          </view>
          <text class="info-value">{{ formatTime(userInfo.lastActiveTime) }}</text>
        </view>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-card">
      <view class="card-title-container">
        <view class="card-title-icon">📊</view>
        <text class="card-title">数据统计</text>
      </view>
      <view class="stats-grid">
        <view class="stat-item total">
          <view class="stat-icon">📝</view>
          <text class="stat-number">{{ stats.totalMemos || 0 }}</text>
          <text class="stat-label">总备忘录</text>
        </view>
        <view class="stat-item completed">
          <view class="stat-icon">✅</view>
          <text class="stat-number">{{ stats.completedMemos || 0 }}</text>
          <text class="stat-label">已完成</text>
        </view>
        <view class="stat-item pending">
          <view class="stat-icon">⏳</view>
          <text class="stat-number">{{ stats.pendingMemos || 0 }}</text>
          <text class="stat-label">待完成</text>
        </view>
        <view class="stat-item urgent">
          <view class="stat-icon">🔥</view>
          <text class="stat-number">{{ stats.urgentMemos || 0 }}</text>
          <text class="stat-label">紧急</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button class="action-btn refresh-btn" @click="refreshData" :disabled="loading">
        <text class="btn-icon">🔄</text>
        <text class="btn-text">{{ loading ? '刷新中...' : '刷新数据' }}</text>
      </button>

      <button class="action-btn logout-btn" @click="handleLogout">
        <text class="btn-icon">👋</text>
        <text class="btn-text">退出登录</text>
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
      userInfo: {},
      stats: {},
      loading: false,
      // 头像和昵称编辑相关
      currentAvatarUrl: '',
      currentNickname: '',
      originalNickname: '',
      hasNicknameChanged: false,
      isUpdating: false,
      // 默认头像URL
      defaultAvatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
    };
  },

  onLoad() {
    console.log('用户信息页面加载');
    
    // 检查登录状态
    if (!authManager.checkLoginStatus()) {
      console.log('用户未登录，跳转到介绍页');
      uni.reLaunch({
        url: '/pages/intro/intro'
      });
      return;
    }

    this.loadUserData();
  },

  onShow() {
    // 页面显示时刷新数据
    if (authManager.checkLoginStatus()) {
      this.loadUserData();
    }
  },

  methods: {
    /**
     * 加载用户数据
     */
    async loadUserData() {
      try {
        // 先从本地获取基本信息，避免页面空白
        this.userInfo = authManager.getUserInfo() || {};
        this.initializeEditableData();

        // 从服务器获取最新的用户信息（包括最新的活跃时间）
        const response = await memoAPI.getUserProfile();
        if (response && response.data) {
          this.userInfo = response.data;
          // 更新本地存储
          uni.setStorageSync('userInfo', response.data);
          authManager.userInfo = response.data;
          // 重新初始化编辑数据
          this.initializeEditableData();
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 如果获取失败，使用本地存储的信息
        this.userInfo = authManager.getUserInfo() || {};
        this.initializeEditableData();

        if (error.message && error.message.includes('请先登录')) {
          uni.reLaunch({
            url: '/pages/intro/intro'
          });
          return;
        }
      }

      // 加载统计数据
      await this.loadStats();
    },

    /**
     * 初始化可编辑数据
     */
    initializeEditableData() {
      this.currentAvatarUrl = this.userInfo.avatarUrl || '';
      this.currentNickname = this.userInfo.nickname || '';
      this.originalNickname = this.userInfo.nickname || '';
      this.hasNicknameChanged = false;
    },

    /**
     * 加载统计数据
     */
    async loadStats() {
      try {
        const response = await memoAPI.getUserStats();
        if (response && response.data) {
          this.stats = response.data;
          console.log('加载统计数据成功:', response.data);
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
        
        if (error.message && error.message.includes('请先登录')) {
          uni.reLaunch({
            url: '/pages/intro/intro'
          });
          return;
        }
        
        // 不显示错误提示，使用默认值
        this.stats = {
          totalMemos: 0,
          completedMemos: 0,
          pendingMemos: 0,
          urgentMemos: 0
        };
      }
    },

    /**
     * 刷新数据
     */
    async refreshData() {
      if (this.loading) return;

      this.loading = true;
      
      try {
        // 重新获取用户信息
        const response = await memoAPI.getUserProfile();
        if (response && response.data) {
          this.userInfo = response.data;
          // 更新本地存储
          uni.setStorageSync('userInfo', response.data);
          authManager.userInfo = response.data;
        }
        
        // 重新加载统计数据
        await this.loadStats();
        
        uni.showToast({
          title: '刷新成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('刷新数据失败:', error);
        
        if (error.message && error.message.includes('请先登录')) {
          uni.reLaunch({
            url: '/pages/intro/intro'
          });
          return;
        }
        
        uni.showToast({
          title: error.message || '刷新失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 选择头像回调
     */
    async onChooseAvatar(e) {
      const { avatarUrl } = e.detail;
      console.log('用户选择了新头像:', avatarUrl);

      if (!avatarUrl) {
        console.log('头像选择被取消或失败');
        return;
      }

      try {
        this.isUpdating = true;
        uni.showLoading({
          title: '更新头像中...',
          mask: true
        });

        // 更新头像到服务器
        const response = await memoAPI.updateUserProfile({
          avatarUrl: avatarUrl,
          nickname: this.currentNickname
        });

        if (response && response.data) {
          // 更新本地数据
          this.currentAvatarUrl = avatarUrl;
          this.userInfo.avatarUrl = avatarUrl;

          // 更新本地存储和认证管理器
          uni.setStorageSync('userInfo', response.data);
          authManager.userInfo = response.data;

          uni.hideLoading();
          uni.showToast({
            title: '头像更新成功',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('更新头像失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: error.message || '头像更新失败',
          icon: 'none'
        });
      } finally {
        this.isUpdating = false;
      }
    },

    /**
     * 昵称输入事件
     */
    onNicknameInput(e) {
      const value = e.detail.value.trim();
      this.currentNickname = value;
      this.hasNicknameChanged = value !== this.originalNickname && value.length > 0;
    },

    /**
     * 昵称失焦事件
     */
    onNicknameBlur(e) {
      const value = e.detail.value.trim();
      this.currentNickname = value;
      this.hasNicknameChanged = value !== this.originalNickname && value.length > 0;
    },

    /**
     * 提交昵称表单
     */
    async onSubmitNickname(e) {
      const nickname = e.detail.value.nickname || this.currentNickname;

      if (!nickname || nickname.trim().length === 0) {
        uni.showToast({
          title: '昵称不能为空',
          icon: 'none'
        });
        return;
      }

      if (nickname === this.originalNickname) {
        this.hasNicknameChanged = false;
        return;
      }

      try {
        this.isUpdating = true;
        uni.showLoading({
          title: '更新昵称中...',
          mask: true
        });

        // 更新昵称到服务器
        const response = await memoAPI.updateUserProfile({
          nickname: nickname.trim(),
          avatarUrl: this.currentAvatarUrl
        });

        if (response && response.data) {
          // 更新本地数据
          this.currentNickname = nickname.trim();
          this.originalNickname = nickname.trim();
          this.userInfo.nickname = nickname.trim();
          this.hasNicknameChanged = false;

          // 更新本地存储和认证管理器
          uni.setStorageSync('userInfo', response.data);
          authManager.userInfo = response.data;

          uni.hideLoading();
          uni.showToast({
            title: '昵称更新成功',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('更新昵称失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: error.message || '昵称更新失败',
          icon: 'none'
        });
      } finally {
        this.isUpdating = false;
      }
    },

    /**
     * 退出登录
     */
    handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 执行退出登录
            authManager.logout();

            uni.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 1500
            });

            // 跳转到介绍页面
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/intro/intro'
              });
            }, 1500);
          }
        }
      });
    },





    /**
     * 格式化用户ID显示（首尾显示，中间省略）
     */
    formatUserId(userId) {
      if (!userId) return '';

      // 如果用户ID长度小于等于25个字符，直接显示
      if (userId.length <= 25) {
        return userId;
      }

      // 显示前10个字符 + ... + 后10个字符
      const start = userId.substring(0, 10);
      const end = userId.substring(userId.length - 10);
      return `${start}...${end}`;
    },

    /**
     * 复制用户ID
     */
    copyUserId() {
      const userId = this.userInfo.userId;
      if (!userId) {
        uni.showToast({
          title: '用户ID为空',
          icon: 'none'
        });
        return;
      }

      // 使用uni-app的复制API
      uni.setClipboardData({
        data: userId,
        success: () => {
          uni.showToast({
            title: '用户ID已复制',
            icon: 'success'
          });
        },
        fail: () => {
          uni.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 格式化时间
     */
    formatTime(timeStr) {
      if (!timeStr) return '未知';

      try {
        // 解析时间
        let date = new Date(timeStr);
        const now = new Date();

        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          console.error('无效的时间格式:', timeStr);
          return '格式错误';
        }

        // 如果API返回的是UTC时间但服务器时区有问题，手动调整
        // 检查时差是否接近8小时（可能的时区问题）
        const diff = now.getTime() - date.getTime();
        const hoursDiff = diff / (60 * 60 * 1000);

        // 如果时差在7-9小时之间，可能是时区问题，尝试调整
        if (hoursDiff >= 7 && hoursDiff <= 9) {
          console.log('个人信息页检测到可能的时区问题，调整时间:', timeStr);
          // 将时间向前调整8小时（UTC+8）
          date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        }

        // 重新计算时间差（使用调整后的时间）
        const adjustedDiff = now.getTime() - date.getTime();

        // 小于1分钟
        if (adjustedDiff < 60000) {
          return '刚刚';
        }

        // 小于1小时
        if (adjustedDiff < 3600000) {
          return Math.floor(adjustedDiff / 60000) + '分钟前';
        }

        // 小于1天
        if (adjustedDiff < 86400000) {
          return Math.floor(adjustedDiff / 3600000) + '小时前';
        }

        // 小于7天
        if (adjustedDiff < 604800000) {
          return Math.floor(adjustedDiff / 86400000) + '天前';
        }

        // 超过7天显示具体日期
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (error) {
        console.error('时间格式化失败:', error, '原始时间:', timeStr);
        return '格式错误';
      }
    }
  }
};
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
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

.user-card {
  background: white;
  border-radius: 25rpx;
  padding: 40rpx;
  margin: 0 30rpx 30rpx 30rpx;
  box-shadow: 0 8rpx 25rpx rgba(102, 126, 234, 0.15);
  border: 2rpx solid rgba(102, 126, 234, 0.08);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.avatar-section {
  text-align: center;
  margin-bottom: 40rpx;
  padding-bottom: 40rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

/* 头像选择按钮 */
.avatar-wrapper {
  position: relative;
  display: inline-block;
  background: transparent;
  border: none;
  padding: 0;
  margin-bottom: 20rpx;
}

.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  border: 4rpx solid rgba(102, 126, 234, 0.2);
  display: block;
  transition: all 0.3s ease;
}

.avatar-wrapper:active .avatar {
  transform: scale(0.95);
  border-color: rgba(102, 126, 234, 0.4);
}

.avatar-edit-hint {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 44rpx;
  height: 44rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid white;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.edit-icon {
  font-size: 20rpx;
  color: white;
}

/* 昵称编辑区域 */
.nickname-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  gap: 20rpx;
}

.nickname-input {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  border: none;
  background: transparent;
  min-width: 200rpx;
  padding: 10rpx 20rpx;
  border-radius: 10rpx;
  transition: all 0.3s ease;
}

.nickname-input:focus {
  background: #f8f9fa;
  outline: none;
}

.save-nickname-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  min-width: 80rpx;
  height: 40rpx;
  line-height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-nickname-btn:disabled {
  background: #ccc;
  color: #999;
}




.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item:hover {
  background: rgba(102, 126, 234, 0.02);
  margin: 0 -20rpx;
  padding: 24rpx 20rpx;
  border-radius: 12rpx;
}

.info-label-container {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.info-icon {
  font-size: 24rpx;
  width: 32rpx;
  text-align: center;
}

.info-label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  max-width: 400rpx;
  text-align: right;
  word-break: break-all;
  font-weight: 500;
}

.user-id-value {
  max-width: 550rpx;
  white-space: nowrap;
  word-break: normal;
  cursor: pointer;
  transition: color 0.2s ease;
}

.user-id-value:active {
  color: #007aff;
}

.stats-card {
  background: white;
  border-radius: 25rpx;
  padding: 40rpx;
  margin: 0 30rpx 30rpx 30rpx;
  box-shadow: 0 8rpx 25rpx rgba(102, 126, 234, 0.15);
  border: 2rpx solid rgba(102, 126, 234, 0.08);
  position: relative;
  overflow: hidden;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.card-title-container {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 30rpx;
}

.card-title-icon {
  font-size: 28rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.stat-item {
  text-align: center;
  padding: 30rpx 20rpx;
  border-radius: 20rpx;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  border-radius: 20rpx;
}

.stat-item.total {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border: 2rpx solid rgba(102, 126, 234, 0.2);
}

.stat-item.completed {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1));
  border: 2rpx solid rgba(76, 175, 80, 0.2);
}

.stat-item.pending {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 235, 59, 0.1));
  border: 2rpx solid rgba(255, 193, 7, 0.2);
}

.stat-item.urgent {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(255, 87, 34, 0.1));
  border: 2rpx solid rgba(244, 67, 54, 0.2);
}

.stat-item:active {
  transform: scale(0.95);
}

.stat-icon {
  font-size: 32rpx;
  margin-bottom: 12rpx;
  display: block;
}

.stat-number {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.stat-item.total .stat-number {
  color: #667eea;
}

.stat-item.completed .stat-number {
  color: #4caf50;
}

.stat-item.pending .stat-number {
  color: #ffc107;
}

.stat-item.urgent .stat-number {
  color: #f44336;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

.action-section {
  padding: 0 30rpx 30rpx 30rpx;
}

.action-btn {
  width: 100%;
  height: 100rpx;
  border-radius: 50rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.refresh-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
}

.refresh-btn:not(:disabled):active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.logout-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
  color: white;
  box-shadow: 0 8rpx 20rpx rgba(255, 107, 107, 0.3);
}

.logout-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);
}

.btn-icon {
  margin-right: 20rpx;
  font-size: 36rpx;
}

.btn-text {
  font-size: 32rpx;
}

.action-btn:disabled {
  opacity: 0.6;
  transform: none !important;
}


</style>
