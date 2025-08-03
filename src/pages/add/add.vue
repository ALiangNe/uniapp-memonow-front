<template>
  <view class="add-container">
    <form @submit="saveMemo">
      <!-- 标题输入 -->
      <view class="input-group">
        <text class="label">标题</text>
        <input 
          class="title-input" 
          v-model="memo.title" 
          placeholder="请输入备忘录标题"
          maxlength="50"
        />
      </view>
      
      <!-- 内容输入 -->
      <view class="input-group">
        <text class="label">内容</text>
        <textarea 
          class="content-textarea" 
          v-model="memo.content" 
          placeholder="请输入备忘录内容"
          maxlength="1000"
          auto-height
        />
      </view>
      
      <!-- 操作按钮 -->
      <view class="button-group">
        <button class="cancel-btn" @click="goBack">取消</button>
        <button class="save-btn" @click="saveMemo">保存</button>
      </view>
    </form>
  </view>
</template>

<script>
import MemoAPI from '@/utils/api.js';

export default {
  data() {
    return {
      memo: {
        title: '',
        content: ''
      },
      saving: false
    }
  },

  methods: {
    // 保存备忘录
    async saveMemo() {
      if (this.saving) return;

      // 前端基本验证（API类中也会验证）
      if (!this.memo.title.trim()) {
        uni.showToast({
          title: '请输入标题',
          icon: 'none'
        });
        return;
      }

      if (!this.memo.content.trim()) {
        uni.showToast({
          title: '请输入内容',
          icon: 'none'
        });
        return;
      }

      this.saving = true;

      // 显示保存中提示
      uni.showLoading({
        title: '保存中...'
      });

      try {
        const data = await MemoAPI.createMemo(this.memo.title, this.memo.content);
        if (data) {
          // 延迟返回，让用户看到成功提示
          setTimeout(() => {
            this.goBack();
          }, 1500);
        }
      } catch (error) {
        console.error('保存备忘录失败:', error);
      } finally {
        this.saving = false;
        uni.hideLoading();
      }
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    }
  }
}
</script>

<style scoped>
.add-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.input-group {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
  font-weight: bold;
}

.title-input {
  width: 100%;
  font-size: 28rpx;
  color: #333;
  border: none;
  outline: none;
  background: transparent;
}

.content-textarea {
  width: 100%;
  min-height: 300rpx;
  font-size: 28rpx;
  color: #333;
  border: none;
  outline: none;
  background: transparent;
  line-height: 1.6;
}

.button-group {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.cancel-btn,
.save-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #666;
}

.save-btn {
  background-color: #007aff;
  color: #fff;
}

.cancel-btn:active,
.save-btn:active {
  opacity: 0.8;
}
</style>
