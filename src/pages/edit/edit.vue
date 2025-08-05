<template>
  <view class="edit-container">
    <!-- 顶部装饰区域 -->
    <view class="header-section">
      <view class="header-decoration">
        <view class="decoration-circle circle-1"></view>
        <view class="decoration-circle circle-2"></view>
        <view class="decoration-circle circle-3"></view>
      </view>
      <view class="header-content">
        <view class="header-icon">✏️</view>
        <text class="header-title">编辑备忘录</text>
        <text class="header-subtitle">修改你的想法和内容</text>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <form @submit="updateMemo">
        <!-- 标题输入 -->
        <view class="input-group">
          <view class="label-container">
            <view class="label-icon">📝</view>
            <text class="label">标题</text>
            <view class="char-count">{{ memo.title.length }}/50</view>
          </view>
          <view class="input-wrapper">
            <input
              class="title-input"
              v-model="memo.title"
              placeholder="给你的备忘录起个标题吧..."
              maxlength="50"
              @focus="onTitleFocus"
              @blur="onTitleBlur"
            />
          </view>
        </view>

        <!-- 内容输入 -->
        <view class="input-group">
          <view class="label-container">
            <view class="label-icon">📄</view>
            <text class="label">内容</text>
            <view class="char-count">{{ memo.content.length }}/1000</view>
          </view>
          <view class="textarea-wrapper">
            <textarea
              class="content-textarea"
              v-model="memo.content"
              placeholder="在这里写下你的想法、计划或任何重要的事情..."
              maxlength="1000"
              auto-height
              @focus="onContentFocus"
              @blur="onContentBlur"
            />
          </view>
        </view>

        <!-- 快捷标签 -->
        <view class="tags-section">
          <view class="label-container">
            <view class="label-icon">🏷️</view>
            <text class="label">快捷标签</text>
          </view>
          <view class="quick-tags">
            <view
              class="tag-item"
              :class="{ active: selectedTags.includes(tag) }"
              v-for="tag in quickTags"
              :key="tag"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </view>
          </view>
        </view>

        <!-- 修改提示 -->
        <view class="change-indicator" v-if="hasChanges">
          <view class="indicator-icon">⚠️</view>
          <text class="indicator-text">内容已修改，记得保存哦</text>
        </view>

        <!-- 操作按钮 -->
        <view class="button-group">
          <button
            class="action-btn cancel-btn"
            @click="goBack"
            :disabled="updating"
          >
            <view class="btn-content">
              <text class="btn-icon">❌</text>
              <text class="btn-text">取消</text>
            </view>
          </button>
          <button
            class="action-btn save-btn"
            @click="updateMemo"
            :disabled="updating || !canSave"
            :class="{ saving: updating }"
          >
            <view class="btn-content">
              <text class="btn-icon">{{ updating ? '⏳' : '💾' }}</text>
              <text class="btn-text">{{ updating ? '保存中...' : '保存' }}</text>
            </view>
          </button>
        </view>
      </form>
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
        title: '',
        content: ''
      },
      originalMemo: {
        title: '',
        content: ''
      },
      updating: false,
      loading: false,
      selectedTags: [],
      originalTags: [],
      quickTags: ['工作', '学习', '生活', '重要', '紧急', '想法', '计划', '提醒'],
      titleFocused: false,
      contentFocused: false
    }
  },

  computed: {
    canSave() {
      return this.memo.title.trim().length > 0 || this.memo.content.trim().length > 0;
    },

    hasChanges() {
      return this.memo.title !== this.originalMemo.title ||
             this.memo.content !== this.originalMemo.content ||
             JSON.stringify(this.selectedTags.sort()) !== JSON.stringify(this.originalTags.sort());
    }
  },
  
  onLoad(options) {
    console.log('编辑页面加载');

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
    // 标签切换
    toggleTag(tag) {
      const index = this.selectedTags.indexOf(tag);
      if (index > -1) {
        this.selectedTags.splice(index, 1);
      } else {
        this.selectedTags.push(tag);
      }
    },

    // 标题输入框焦点事件
    onTitleFocus() {
      this.titleFocused = true;
    },

    onTitleBlur() {
      this.titleFocused = false;
    },

    // 内容输入框焦点事件
    onContentFocus() {
      this.contentFocused = true;
    },

    onContentBlur() {
      this.contentFocused = false;
    },

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
          this.memo = {
            title: response.data.title,
            content: response.data.content
          };

          // 加载标签数据
          this.selectedTags = response.data.tags ? [...response.data.tags] : [];

          console.log('加载编辑数据成功:', response.data);

          // 保存原始数据，用于检测是否有修改
          this.originalMemo = {
            title: response.data.title,
            content: response.data.content
          };
          this.originalTags = response.data.tags ? [...response.data.tags] : [];
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
    
    // 更新备忘录
    async updateMemo() {
      if (this.updating) return;

      // 检查是否有修改
      if (!this.hasChanges) {
        uni.showToast({
          title: '内容未修改',
          icon: 'none'
        });
        return;
      }

      // 前端基本验证
      if (!this.canSave) {
        uni.showToast({
          title: '请输入标题或内容',
          icon: 'none'
        });
        return;
      }

      this.updating = true;
      
      // 显示更新中提示
      uni.showLoading({
        title: '更新中...'
      });

      try {
        const response = await memoAPI.update(this.memoId, {
          title: this.memo.title.trim(),
          content: this.memo.content.trim(),
          priority: 0,
          status: 0,
          tags: this.selectedTags
        });

        if (response && response.data) {
          console.log('更新备忘录成功:', response.data);

          // 更新原始数据，避免返回时提示未保存
          this.originalMemo = {
            title: response.data.title,
            content: response.data.content
          };
          this.originalTags = response.data.tags ? [...response.data.tags] : [];

          // 修改成功后直接返回列表页面（跳过详情页）
          uni.navigateBack({
            delta: 2, // 返回两级：编辑页 -> 详情页 -> 列表页
            success: () => {
              // 通知列表页刷新数据
              uni.$emit('refreshMemoList');

              // 显示成功提示
              uni.showToast({
                title: '修改成功',
                icon: 'success',
                duration: 1500
              });
            },
            fail: () => {
              // 如果返回两级失败，尝试直接跳转到首页
              uni.reLaunch({
                url: '/pages/index/index'
              });

              // 显示成功提示
              uni.showToast({
                title: '修改成功',
                icon: 'success',
                duration: 1500
              });
            }
          });
        }
      } catch (error) {
        console.error('更新备忘录失败:', error);

        // 如果是认证错误，跳转到介绍页
        if (error.message && error.message.includes('请先登录')) {
          uni.reLaunch({
            url: '/pages/intro/intro'
          });
          return;
        }

        uni.showToast({
          title: error.message || '更新失败，请重试',
          icon: 'none'
        });
      } finally {
        this.updating = false;
        uni.hideLoading();
      }
    },
    
    // 返回上一页
    goBack() {
      // 检查是否有未保存的修改
      if (this.hasChanges) {
        uni.showModal({
          title: '提示',
          content: '有未保存的修改，确定要离开吗？',
          confirmText: '确定离开',
          cancelText: '继续编辑',
          confirmColor: '#ff4757',
          success: (res) => {
            if (res.confirm) {
              uni.navigateBack();
            }
          }
        });
      } else {
        uni.navigateBack();
      }
    }
  }
}
</script>

<style scoped>
/* 容器样式 */
.edit-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, #e8f0fe 100%);
  position: relative;
  overflow-x: hidden;
}

/* 顶部装饰区域 */
.header-section {
  position: relative;
  padding: 60rpx 40rpx 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #7c8ef0 100%);
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

/* 表单区域 */
.form-section {
  padding: 0 40rpx 40rpx;
}

.input-group {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.input-group:hover {
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
  transform: translateY(-2rpx);
}

/* 标签容器 */
.label-container {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.label-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.label {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-primary);
  font-weight: 600;
}

.char-count {
  font-size: 22rpx;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

/* 输入框样式 */
.input-wrapper,
.textarea-wrapper {
  position: relative;
  border-radius: 12rpx;
  background: var(--bg-tertiary);
  padding: 20rpx;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within,
.textarea-wrapper:focus-within {
  background: #f0f8ff;
  box-shadow: 0 0 0 2rpx var(--primary-color);
}

.title-input {
  width: 100%;
  font-size: 28rpx;
  color: var(--text-primary);
  border: none;
  outline: none;
  background: transparent;
  line-height: 1.5;
}

.title-input::placeholder {
  color: var(--text-placeholder);
}

.content-textarea {
  width: 100%;
  min-height: 200rpx;
  font-size: 26rpx;
  color: var(--text-primary);
  border: none;
  outline: none;
  background: transparent;
  line-height: 1.6;
  resize: none;
}

.content-textarea::placeholder {
  color: var(--text-placeholder);
}

/* 标签区域 */
.tags-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  background: #f5f5f5 !important;
  color: #333333 !important;
  font-size: 24rpx;
  font-weight: 500;
  padding: 12rpx 20rpx;
  border-radius: 20rpx;
  border: 2rpx solid #e0e0e0 !important;
  transition: all 0.3s ease;
  cursor: pointer;
}

/* 确保未选中标签的文字颜色 */
.tag-item text {
  color: #333333 !important;
}

.tag-item:active {
  transform: scale(0.95);
}

.tag-item.active {
  background: linear-gradient(135deg, #667eea, #7c8ef0) !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  border: 2rpx solid #667eea !important;
  transform: scale(1.05);
}

/* 确保选中标签的文字颜色 */
.tag-item.active text {
  color: #ffffff !important;
}

/* 修改提示 */
.change-indicator {
  background: linear-gradient(135deg, #ffa726, #ff9800);
  color: white;
  border-radius: 20rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 167, 38, 0.3);
  animation: pulse-warning 2s ease-in-out infinite;
}

.indicator-icon {
  font-size: 24rpx;
}

.indicator-text {
  font-size: 26rpx;
  font-weight: 500;
  color: white;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
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

/* 取消按钮 */
.cancel-btn {
  background: #f5f5f5 !important;
  color: #666666 !important;
  border: 2rpx solid #e0e0e0 !important;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08) !important;
}

.cancel-btn:active {
  transform: scale(0.95);
  background: #eeeeee !important;
}

/* 确保取消按钮内所有文字都是深色 */
.cancel-btn .btn-text,
.cancel-btn .btn-icon {
  color: #666666 !important;
}

.cancel-btn text {
  color: #666666 !important;
}

.cancel-btn view {
  color: #666666 !important;
}

/* 保存按钮 */
.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #7c8ef0 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.4) !important;
}

.save-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.5) !important;
}

.save-btn .btn-text,
.save-btn .btn-icon {
  color: #ffffff !important;
}

/* 确保保存按钮内所有文字都是白色 */
.save-btn text {
  color: #ffffff !important;
}

.save-btn view {
  color: #ffffff !important;
}

.save-btn:disabled {
  background: #cccccc !important;
  color: #999999 !important;
  box-shadow: none !important;
  cursor: not-allowed;
}

.save-btn:disabled .btn-text,
.save-btn:disabled .btn-icon {
  color: #999999 !important;
}

.save-btn:disabled text {
  color: #999999 !important;
}

.save-btn:disabled view {
  color: #999999 !important;
}

.save-btn.saving {
  pointer-events: none;
}

.save-btn.saving .btn-icon {
  animation: spin 1s linear infinite;
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse-warning {
  0%, 100% {
    box-shadow: 0 4rpx 16rpx rgba(255, 167, 38, 0.3);
  }
  50% {
    box-shadow: 0 6rpx 20rpx rgba(255, 167, 38, 0.5);
  }
}

/* 响应式适配 */
@media (max-width: 750rpx) {
  .header-section {
    padding: 40rpx 30rpx 30rpx;
  }

  .form-section {
    padding: 0 30rpx 30rpx;
  }

  .button-group {
    padding: 0 30rpx;
  }

  .input-group {
    padding: 25rpx;
  }
}
</style>
