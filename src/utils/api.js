// API工具类 - 统一管理所有接口调用
const BASE_URL = 'https://plasmwcfgsbv.sealosbja.site/api';

/**
 * 统一的API响应处理函数
 * @param {Object} res - uni.request的响应对象
 * @returns {Object|null} - 成功时返回data，失败时返回null
 */
function handleApiResponse(res) {
  const { code, message, data } = res.data;
  
  switch(code) {
    case 200:
    case 201:
      // 成功处理
      return data;
    case 400:
      // 参数错误
      uni.showToast({
        title: message || '参数错误',
        icon: 'none',
        duration: 2000
      });
      break;
    case 404:
      // 资源不存在
      uni.showToast({
        title: message || '数据不存在',
        icon: 'none',
        duration: 2000
      });
      break;
    case 500:
      // 服务器错误
      uni.showToast({
        title: '服务器错误，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      break;
    default:
      uni.showToast({
        title: message || '未知错误',
        icon: 'none',
        duration: 2000
      });
  }
  return null;
}

/**
 * 统一的网络错误处理
 */
function handleNetworkError(err) {
  console.error('网络请求失败:', err);
  uni.showToast({
    title: '网络连接失败，请检查网络',
    icon: 'none',
    duration: 2000
  });
}

/**
 * 备忘录API类
 */
class MemoAPI {
  
  /**
   * 获取备忘录列表
   * @returns {Promise<Array|null>} 备忘录列表
   */
  static async getMemos() {
    return new Promise((resolve) => {
      uni.request({
        url: `${BASE_URL}/memos`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          const data = handleApiResponse(res);
          resolve(data);
        },
        fail: (err) => {
          handleNetworkError(err);
          resolve(null);
        }
      });
    });
  }

  /**
   * 获取备忘录详情
   * @param {number} id - 备忘录ID
   * @returns {Promise<Object|null>} 备忘录详情
   */
  static async getMemoDetail(id) {
    if (!id) {
      uni.showToast({
        title: '备忘录ID不能为空',
        icon: 'none'
      });
      return null;
    }

    return new Promise((resolve) => {
      uni.request({
        url: `${BASE_URL}/memos/${id}`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          const data = handleApiResponse(res);
          resolve(data);
        },
        fail: (err) => {
          handleNetworkError(err);
          resolve(null);
        }
      });
    });
  }

  /**
   * 创建备忘录
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @returns {Promise<Object|null>} 创建的备忘录
   */
  static async createMemo(title, content) {
    if (!title || !title.trim()) {
      uni.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return null;
    }

    if (!content || !content.trim()) {
      uni.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return null;
    }

    if (title.length > 50) {
      uni.showToast({
        title: '标题不能超过50个字符',
        icon: 'none'
      });
      return null;
    }

    if (content.length > 1000) {
      uni.showToast({
        title: '内容不能超过1000个字符',
        icon: 'none'
      });
      return null;
    }

    return new Promise((resolve) => {
      uni.request({
        url: `${BASE_URL}/memos`,
        method: 'POST',
        data: {
          title: title.trim(),
          content: content.trim()
        },
        timeout: 10000,
        success: (res) => {
          const data = handleApiResponse(res);
          if (data) {
            uni.showToast({
              title: '创建成功',
              icon: 'success'
            });
          }
          resolve(data);
        },
        fail: (err) => {
          handleNetworkError(err);
          resolve(null);
        }
      });
    });
  }

  /**
   * 更新备忘录
   * @param {number} id - 备忘录ID
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @returns {Promise<Object|null>} 更新后的备忘录
   */
  static async updateMemo(id, title, content) {
    if (!id) {
      uni.showToast({
        title: '备忘录ID不能为空',
        icon: 'none'
      });
      return null;
    }

    if (!title || !title.trim()) {
      uni.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return null;
    }

    if (!content || !content.trim()) {
      uni.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return null;
    }

    if (title.length > 50) {
      uni.showToast({
        title: '标题不能超过50个字符',
        icon: 'none'
      });
      return null;
    }

    if (content.length > 1000) {
      uni.showToast({
        title: '内容不能超过1000个字符',
        icon: 'none'
      });
      return null;
    }

    return new Promise((resolve) => {
      uni.request({
        url: `${BASE_URL}/memos/${id}`,
        method: 'PUT',
        data: {
          title: title.trim(),
          content: content.trim()
        },
        timeout: 10000,
        success: (res) => {
          const data = handleApiResponse(res);
          if (data) {
            uni.showToast({
              title: '更新成功',
              icon: 'success'
            });
          }
          resolve(data);
        },
        fail: (err) => {
          handleNetworkError(err);
          resolve(null);
        }
      });
    });
  }

  /**
   * 删除备忘录
   * @param {number} id - 备忘录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async deleteMemo(id) {
    if (!id) {
      uni.showToast({
        title: '备忘录ID不能为空',
        icon: 'none'
      });
      return false;
    }

    return new Promise((resolve) => {
      uni.request({
        url: `${BASE_URL}/memos/${id}`,
        method: 'DELETE',
        timeout: 10000,
        success: (res) => {
          const data = handleApiResponse(res);
          if (data !== null) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
            resolve(true);
          } else {
            resolve(false);
          }
        },
        fail: (err) => {
          handleNetworkError(err);
          resolve(false);
        }
      });
    });
  }
}

export default MemoAPI;
