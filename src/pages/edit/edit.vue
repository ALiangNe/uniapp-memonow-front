<template>
  <view class="edit-container">
    <form @submit="updateMemo">
      <!-- 标题输入 -->
      <view class="input-group">
        <text class="label">标题</text>
        <input 
          class="title-input" 
          v-model="memo.title" 
          placeholder="请输入备忘录标题"
          maxlength="50"
        />
        <text class="char-count">{{ memo.title.length }}/50</text>
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
        <text class="char-count">{{ memo.content.length }}/1000</text>
      </view>
      
      <!-- 操作按钮 -->
      <view class="button-group">
        <button class="cancel-btn" @click="goBack">取消</button>
        <button class="save-btn" @click="updateMemo" :disabled="updating">
          {{ updating ? '保存中...' : '保存' }}
        </button>
      </view>
    </form>
  </view>
</template>

<script>
import MemoAPI from '@/utils/api.js';

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
      loading: false
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
          this.memo = {
            title: data.title,
            content: data.content
          };
          // 保存原始数据，用于检测是否有修改
          this.originalMemo = {
            title: data.title,
            content: data.content
          };
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
      if (this.memo.title === this.originalMemo.title && 
          this.memo.content === this.originalMemo.content) {
        uni.showToast({
          title: '内容未修改',
          icon: 'none'
        });
        return;
      }
      
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

      this.updating = true;
      
      // 显示更新中提示
      uni.showLoading({
        title: '更新中...'
      });

      try {
        const data = await MemoAPI.updateMemo(this.memoId, this.memo.title, this.memo.content);
        if (data) {
          // 更新原始数据，避免返回时提示未保存
          this.originalMemo = {
            title: data.title,
            content: data.content
          };

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
      } finally {
        this.updating = false;
        uni.hideLoading();
      }
    },
    
    // 返回上一页
    goBack() {
      // 检查是否有未保存的修改
      if (this.memo.title !== this.originalMemo.title || 
          this.memo.content !== this.originalMemo.content) {
        uni.showModal({
          title: '提示',
          content: '有未保存的修改，确定要离开吗？',
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
.edit-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.input-group {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  position: relative;
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

.char-count {
  position: absolute;
  bottom: 15rpx;
  right: 20rpx;
  font-size: 24rpx;
  color: #999;
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

.save-btn:disabled {
  background-color: #ccc;
  color: #999;
}

.cancel-btn:active,
.save-btn:active:not(:disabled) {
  opacity: 0.8;
}
</style>
