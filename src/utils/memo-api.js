/**
 * 备忘录API封装类
 * 提供所有备忘录相关的API调用方法
 */
import authManager from './auth.js';

class MemoAPI {
  /**
   * 获取备忘录列表
   */
  async getList() {
    try {
      const response = await authManager.request({
        url: '/api/memos',
        method: 'GET'
      });
      return response;
    } catch (error) {
      if (authManager.handleAuthError(error)) {
        throw new Error('请先登录');
      }
      throw error;
    }
  }

  /**
   * 获取备忘录详情
   */
  async getDetail(id) {
    try {
      const response = await authManager.request({
        url: `/api/memos/${id}`,
        method: 'GET'
      });
      return response;
    } catch (error) {
      if (authManager.handleAuthError(error)) {
        throw new Error('请先登录');
      }
      throw error;
    }
  }

  /**
   * 创建备忘录
   */
  async create(data) {
    try {
      const response = await authManager.request({
        url: '/api/memos',
        method: 'POST',
        data
      });
      return response;
    } catch (error) {
      if (authManager.handleAuthError(error)) {
        throw new Error('请先登录');
      }
      throw error;
    }
  }

  /**
   * 更新备忘录
   */
  async update(id, data) {
    try {
      const response = await authManager.request({
        url: `/api/memos/${id}`,
        method: 'PUT',
        data
      });
      return response;
    } catch (error) {
      if (authManager.handleAuthError(error)) {
        throw new Error('请先登录');
      }
      throw error;
    }
  }

  /**
   * 删除备忘录
   */
  async delete(id) {
    try {
      const response = await authManager.request({
        url: `/api/memos/${id}`,
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      if (authManager.handleAuthError(error)) {
        throw new Error('请先登录');
      }
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserProfile() {
    try {
      const response = await authManager.request({
        url: '/api/users/profile',
        method: 'GET'
      });
      return response;
    } catch (error) {
      if (authManager.handleAuthError(error)) {
        throw new Error('请先登录');
      }
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats() {
    try {
      const response = await authManager.request({
        url: '/api/users/stats',
        method: 'GET'
      });
      return response;
    } catch (error) {
      if (authManager.handleAuthError(error)) {
        throw new Error('请先登录');
      }
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserProfile(data) {
    try {
      const response = await authManager.request({
        url: '/api/users/register',
        method: 'POST',
        data
      });
      return response;
    } catch (error) {
      if (authManager.handleAuthError(error)) {
        throw new Error('请先登录');
      }
      throw error;
    }
  }
}

// 创建全局实例
const memoAPI = new MemoAPI();

export default memoAPI;
