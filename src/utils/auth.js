/**
 * 用户认证管理类
 * 处理微信登录、用户信息存储、API请求等
 */
class AuthManager {
  constructor() {
    this.userId = null;
    this.userInfo = null;
    this.baseUrl = 'https://plasmwcfgsbv.sealosbja.site';
  }

  /**
   * 微信小程序登录
   */
  async wechatLogin() {
    try {
      console.log('开始微信登录流程...');
      
      // 1. 获取微信登录code
      const loginRes = await this.wxLogin();
      if (!loginRes.code) {
        throw new Error('获取微信登录凭证失败');
      }
      console.log('获取微信code成功:', loginRes.code);

      // 2. 尝试获取用户信息（可选）
      let userInfo = {};
      try {
        const userInfoRes = await this.wxGetUserProfile();
        userInfo = {
          nickname: userInfoRes.userInfo.nickName,
          avatarUrl: userInfoRes.userInfo.avatarUrl
        };
        console.log('获取用户信息成功:', userInfo);
      } catch (error) {
        console.log('用户拒绝授权用户信息，使用默认信息');
        userInfo = {
          nickname: '微信用户',
          avatarUrl: ''
        };
      }

      // 3. 调用后端登录接口
      const response = await this.request({
        url: '/api/auth/wechat-login',
        method: 'POST',
        data: {
          code: loginRes.code,
          ...userInfo
        },
        needAuth: false // 登录接口不需要User-Id
      });

      // 4. 保存用户信息
      this.userId = response.data.userId;
      this.userInfo = response.data;
      
      uni.setStorageSync('userId', this.userId);
      uni.setStorageSync('userInfo', this.userInfo);
      
      console.log('微信登录成功:', this.userInfo);
      return response.data;
    } catch (error) {
      console.error('微信登录失败:', error);
      throw error;
    }
  }

  /**
   * 测试登录（开发环境使用）
   */
  async testLogin() {
    try {
      console.log('开始测试登录...');
      
      const response = await this.request({
        url: '/api/auth/test-login',
        method: 'POST',
        data: {
          userType: 'h5',
          nickname: '测试用户',
          avatarUrl: ''
        },
        needAuth: false
      });

      this.userId = response.data.userId;
      this.userInfo = response.data;
      
      uni.setStorageSync('userId', this.userId);
      uni.setStorageSync('userInfo', this.userInfo);
      
      console.log('测试登录成功:', this.userInfo);
      return response.data;
    } catch (error) {
      console.error('测试登录失败:', error);
      throw error;
    }
  }

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const userId = uni.getStorageSync('userId');
    const userInfo = uni.getStorageSync('userInfo');

    if (userId && userInfo) {
      this.userId = userId;
      this.userInfo = userInfo;
      console.log('用户已登录:', this.userId);
      return true;
    }
    
    console.log('用户未登录');
    return false;
  }

  /**
   * 退出登录
   */
  logout() {
    console.log('用户退出登录');
    this.userId = null;
    this.userInfo = null;
    uni.removeStorageSync('userId');
    uni.removeStorageSync('userInfo');
  }

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * 获取用户ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * 微信登录Promise封装
   */
  wxLogin() {
    return new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject
      });
    });
  }

  /**
   * 微信获取用户信息Promise封装
   */
  wxGetUserProfile() {
    return new Promise((resolve, reject) => {
      uni.getUserProfile({
        desc: '用于完善用户资料',
        success: resolve,
        fail: reject
      });
    });
  }

  /**
   * 统一请求方法
   */
  async request(options) {
    const { url, method = 'GET', data, header = {}, needAuth = true } = options;
    
    return new Promise((resolve, reject) => {
      // 构建请求头
      const requestHeader = {
        'Content-Type': 'application/json',
        ...header
      };

      // 如果需要认证，添加User-Id
      if (needAuth && this.userId) {
        requestHeader['User-Id'] = this.userId;
      }

      console.log(`发起${method}请求:`, `${this.baseUrl}${url}`, {
        data,
        header: requestHeader
      });

      uni.request({
        url: `${this.baseUrl}${url}`,
        method,
        data,
        header: requestHeader,
        success: (res) => {
          console.log('请求响应:', res.data);
          
          if (res.data.code === 200 || res.data.code === 201) {
            resolve(res.data);
          } else {
            const error = new Error(res.data.message || '请求失败');
            error.code = res.data.code;
            error.data = res.data.data;
            reject(error);
          }
        },
        fail: (error) => {
          console.error('请求失败:', error);
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      });
    });
  }

  /**
   * 处理认证错误
   */
  handleAuthError(error) {
    if (error.message && error.message.includes('缺少用户身份标识')) {
      console.log('用户身份验证失败，需要重新登录');
      this.logout();
      return true; // 表示是认证错误
    }
    return false;
  }
}

// 创建全局实例
const authManager = new AuthManager();

export default authManager;
