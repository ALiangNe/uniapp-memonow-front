<script>
import authManager from '@/utils/auth.js';

export default {
  onLaunch: function () {
    console.log('App Launch');

    // 应用启动时检查登录状态
    const isLoggedIn = authManager.checkLoginStatus();
    console.log('应用启动，登录状态:', isLoggedIn);

    if (isLoggedIn) {
      const userInfo = authManager.getUserInfo();
      console.log('当前用户信息:', userInfo);
    }
  },
  onShow: function () {
    console.log('App Show');

    // 应用从后台切换到前台时检查登录状态
    const isLoggedIn = authManager.checkLoginStatus();
    if (!isLoggedIn) {
      console.log('应用切换到前台时发现用户未登录');
    }
  },
  onHide: function () {
    console.log('App Hide');
  },
}
</script>

<style>
/*每个页面公共css */
</style>
