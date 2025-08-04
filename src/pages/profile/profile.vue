<template>
  <view class="profile-container">
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

        <text class="user-type">{{ getUserTypeText(userInfo.userType) }}</text>
      </view>
      
      <view class="info-section">
        <view class="info-item">
          <text class="info-label">用户ID</text>
          <text class="info-value">{{ userInfo.userId }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">注册时间</text>
          <text class="info-value">{{ formatTime(userInfo.createdTime) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">最后活跃</text>
          <text class="info-value">{{ formatTime(userInfo.lastActiveTime) }}</text>
        </view>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-card">
      <text class="card-title">数据统计</text>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-number">{{ stats.totalMemos || 0 }}</text>
          <text class="stat-label">总备忘录</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.completedMemos || 0 }}</text>
          <text class="stat-label">已完成</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.pendingMemos || 0 }}</text>
          <text class="stat-label">待完成</text>
        </view>
        <view class="stat-item">
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
        <text class="btn-icon">🚪</text>
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
     * 获取用户类型文本
     */
    getUserTypeText(userType) {
      const typeMap = {
        'wx': '微信用户',
        'h5': 'H5用户',
        'app': 'App用户',
        'other': '其他用户'
      };
      return typeMap[userType] || '未知用户';
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
}

.user-card {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
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
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #f0f0f0;
  display: block;
}

.avatar-edit-hint {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: #667eea;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid white;
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

.user-type {
  display: block;
  font-size: 24rpx;
  color: #999;
  background: #f0f0f0;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  display: inline-block;
}

.info-section {
  
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  max-width: 400rpx;
  text-align: right;
  word-break: break-all;
}

.stats-card {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
}

.stat-item {
  text-align: center;
  padding: 30rpx;
  background: #f8f9fa;
  border-radius: 15rpx;
}

.stat-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.action-section {
  
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
  font-weight: bold;
  transition: all 0.3s ease;
}

.refresh-btn {
  background: white;
  color: #667eea;
  box-shadow: 0 5rpx 15rpx rgba(102, 126, 234, 0.2);
}

.refresh-btn:not(:disabled):active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.2);
}

.logout-btn {
  background: #ff4757;
  color: white;
  box-shadow: 0 5rpx 15rpx rgba(255, 71, 87, 0.3);
}

.logout-btn:active {
  transform: scale(0.98);
  background: #ff3742;
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
