# 备忘录应用API接口对接文档 v2.0

## 基础信息
- **服务器地址**: `https://plasmwcfgsbv.sealosbja.site`
- **API基础路径**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **请求头**: `Content-Type: application/json`
- **版本**: 2.0.0 (支持多用户数据隔离)

## 🔒 用户身份验证
**重要**: 除了认证接口外，所有接口都需要在请求头中包含 `User-Id` 字段进行用户身份识别。

### User-Id 格式
- **微信用户**: `wx_{openid}` (如: `wx_o1234567890abcdef`)
- **H5用户**: `h5_{唯一标识}` (如: `h5_test_1234567890`)
- **APP用户**: `app_{唯一标识}` (如: `app_user_1234567890`)
- **其他用户**: `other_{唯一标识}` (如: `other_test_1234567890`)

## 统一响应格式
所有接口都遵循以下响应格式：
```json
{
  "code": 200,
  "message": "操作结果描述",
  "data": "具体数据或null"
}
```

## 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 接口分类
| 分类 | 说明 | 需要User-Id |
|------|------|-------------|
| **认证接口** | 用户登录、注册相关 | ❌ |
| **用户接口** | 用户信息管理 | ✅ |
| **备忘录接口** | 备忘录增删改查 | ✅ |

---

# 🔐 认证接口

## 1. 微信小程序登录

### 接口信息
- **URL**: `POST /api/auth/wechat-login`
- **描述**: 微信小程序用户登录，获取用户身份标识
- **需要User-Id**: ❌

### 请求参数
```json
{
  "code": "从wx.login()获取的临时登录凭证",
  "nickname": "用户昵称（可选）",
  "avatarUrl": "用户头像URL（可选）"
}
```

### 请求示例
```javascript
// uni-app/微信小程序
wx.login({
  success: (loginRes) => {
    wx.request({
      url: 'https://vgsarkerfnri.sealosbja.site/api/auth/wechat-login',
      method: 'POST',
      data: {
        code: loginRes.code,
        nickname: '用户昵称',
        avatarUrl: 'https://example.com/avatar.jpg'
      },
      success: (res) => {
        console.log(res.data);
        // 保存用户ID用于后续请求
        wx.setStorageSync('userId', res.data.data.userId);
      }
    });
  }
});
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "userId": "wx_o1234567890abcdef",
    "userType": "wx",
    "openid": "o1234567890abcdef",
    "nickname": "用户昵称",
    "avatarUrl": "https://example.com/avatar.jpg",
    "memoCount": 5,
    "createdTime": "2025-08-03T02:00:00.000Z",
    "lastActiveTime": "2025-08-03T02:00:00.000Z"
  }
}
```

### 失败响应 (400)
```json
{
  "code": 400,
  "message": "缺少微信登录凭证code",
  "data": {
    "help": "请在小程序端调用wx.login()获取code，然后传递给此接口"
  }
}
```

### 失败响应 (400) - code无效
```json
{
  "code": 400,
  "message": "微信登录凭证已过期或无效，请重新获取",
  "data": null
}
```

---

## 2. 测试登录

### 接口信息
- **URL**: `POST /api/auth/test-login`
- **描述**: 用于开发测试的登录接口，生成测试用户
- **需要User-Id**: ❌

### 请求参数
```json
{
  "userType": "用户类型（h5/app/other，默认h5）",
  "nickname": "用户昵称（可选）",
  "avatarUrl": "用户头像URL（可选）"
}
```

### 请求示例
```javascript
// 测试登录
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/auth/test-login',
  method: 'POST',
  data: {
    userType: 'h5',
    nickname: '测试用户',
    avatarUrl: 'https://example.com/avatar.jpg'
  },
  success: (res) => {
    console.log(res.data);
    wx.setStorageSync('userId', res.data.data.userId);
  }
});
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "测试登录成功",
  "data": {
    "userId": "h5_test_1754214517860_x8ii13",
    "userType": "h5",
    "openid": null,
    "nickname": "测试用户",
    "avatarUrl": "https://example.com/avatar.jpg",
    "memoCount": 0,
    "createdTime": "2025-08-03T02:00:00.000Z",
    "lastActiveTime": "2025-08-03T02:00:00.000Z"
  }
}
```

---

# 👤 用户接口

## 3. 用户注册/更新信息

### 接口信息
- **URL**: `POST /api/users/register`
- **描述**: 用户信息注册或更新（自动识别）
- **需要User-Id**: ✅

### 请求头
```
User-Id: wx_o1234567890abcdef
Content-Type: application/json
```

### 请求参数
```json
{
  "nickname": "用户昵称（可选）",
  "avatarUrl": "用户头像URL（可选）"
}
```

### 请求示例
```javascript
const userId = wx.getStorageSync('userId');
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/users/register',
  method: 'POST',
  header: {
    'User-Id': userId,
    'Content-Type': 'application/json'
  },
  data: {
    nickname: '新昵称',
    avatarUrl: 'https://example.com/new-avatar.jpg'
  },
  success: (res) => {
    console.log(res.data);
  }
});
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "用户信息更新成功",
  "data": {
    "userId": "wx_o1234567890abcdef",
    "userType": "wx",
    "openid": "o1234567890abcdef",
    "nickname": "新昵称",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "memoCount": 5,
    "createdTime": "2025-08-03T02:00:00.000Z",
    "lastActiveTime": "2025-08-03T02:05:00.000Z"
  }
}
```

---

## 4. 获取用户信息

### 接口信息
- **URL**: `GET /api/users/profile`
- **描述**: 获取当前用户的详细信息
- **需要User-Id**: ✅

### 请求示例
```javascript
const userId = wx.getStorageSync('userId');
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/users/profile',
  method: 'GET',
  header: {
    'User-Id': userId
  },
  success: (res) => {
    console.log(res.data);
  }
});
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": "wx_o1234567890abcdef",
    "userType": "wx",
    "openid": "o1234567890abcdef",
    "nickname": "用户昵称",
    "avatarUrl": "https://example.com/avatar.jpg",
    "memoCount": 5,
    "createdTime": "2025-08-03T02:00:00.000Z",
    "lastActiveTime": "2025-08-03T02:05:00.000Z"
  }
}
```

---

## 5. 获取用户统计信息

### 接口信息
- **URL**: `GET /api/users/stats`
- **描述**: 获取用户的备忘录统计信息
- **需要User-Id**: ✅

### 请求示例
```javascript
const userId = wx.getStorageSync('userId');
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/users/stats',
  method: 'GET',
  header: {
    'User-Id': userId
  },
  success: (res) => {
    console.log(res.data);
  }
});
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "totalMemos": 10,
    "completedMemos": 6,
    "pendingMemos": 4,
    "urgentMemos": 2
  }
}
```

---

# 📝 备忘录接口

## 6. 获取备忘录列表

### 接口信息
- **URL**: `GET /api/memos`
- **描述**: 获取当前用户的所有备忘录，按更新时间倒序排列
- **需要User-Id**: ✅

### 请求头
```
User-Id: wx_o1234567890abcdef
```

### 请求示例
```javascript
// uni-app/微信小程序
const userId = wx.getStorageSync('userId');
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/memos',
  method: 'GET',
  header: {
    'User-Id': userId
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
const userId = localStorage.getItem('userId');
fetch('https://vgsarkerfnri.sealosbja.site/api/memos', {
  headers: {
    'User-Id': userId
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "title": "学习uni-app开发",
      "content": "完成备忘录小程序的开发，包括前端界面设计和后端API接口开发。",
      "priority": 1,
      "status": 0,
      "tags": ["学习", "开发"],
      "createTime": "2025-08-03T02:00:00.000Z",
      "updateTime": "2025-08-03T02:05:00.000Z"
    },
    {
      "id": 2,
      "title": "购买生活用品",
      "content": "牙膏、洗发水、纸巾、洗衣液、沐浴露、洗面奶等日常用品。",
      "priority": 0,
      "status": 1,
      "tags": ["购物", "生活"],
      "createTime": "2025-08-03T01:30:00.000Z",
      "updateTime": "2025-08-03T02:00:00.000Z"
    }
  ]
}
```

### 失败响应 (400) - 缺少User-Id
```json
{
  "code": 400,
  "message": "缺少用户身份标识",
  "data": null
}
```

### 失败响应 (400) - User-Id格式错误
```json
{
  "code": 400,
  "message": "无效的用户标识格式",
  "data": null
}
```

---

## 7. 获取备忘录详情

### 接口信息
- **URL**: `GET /api/memos/{id}`
- **描述**: 根据ID获取当前用户的单个备忘录详细信息
- **需要User-Id**: ✅
- **路径参数**:
  - `id` (必填): 备忘录ID

### 请求头
```
User-Id: wx_o1234567890abcdef
```

### 请求示例
```javascript
// uni-app/微信小程序
const userId = wx.getStorageSync('userId');
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/memos/1',
  method: 'GET',
  header: {
    'User-Id': userId
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
const userId = localStorage.getItem('userId');
fetch('https://vgsarkerfnri.sealosbja.site/api/memos/1', {
  headers: {
    'User-Id': userId
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "学习uni-app开发",
    "content": "完成备忘录小程序的开发，包括前端界面设计和后端API接口开发。学习Vue3语法和uni-app框架特性。\n\n需要掌握的技术点：\n1. Vue3 Composition API\n2. uni-app 生命周期\n3. 小程序组件开发",
    "priority": 1,
    "status": 0,
    "tags": ["学习", "开发", "uni-app"],
    "createTime": "2025-08-03T02:00:00.000Z",
    "updateTime": "2025-08-03T02:05:00.000Z"
  }
}
```

### 失败响应 (404) - 备忘录不存在或不属于当前用户
```json
{
  "code": 404,
  "message": "备忘录不存在",
  "data": null
}
```

### 失败响应 (400)
```json
{
  "code": 400,
  "message": "无效的备忘录ID",
  "data": null
}
```

---

## 8. 创建备忘录

### 接口信息
- **URL**: `POST /api/memos`
- **描述**: 为当前用户创建新的备忘录
- **需要User-Id**: ✅

### 请求头
```
User-Id: wx_o1234567890abcdef
Content-Type: application/json
```

### 请求参数
```json
{
  "title": "备忘录标题（必填，1-200字符）",
  "content": "备忘录内容（必填，1-1000字符）",
  "priority": "优先级（可选，0-普通 1-重要 2-紧急，默认0）",
  "status": "状态（可选，0-未完成 1-已完成，默认0）",
  "tags": "标签数组（可选，如：[\"学习\", \"工作\"]）"
}
```

### 请求示例
```javascript
// uni-app/微信小程序
const userId = wx.getStorageSync('userId');
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/memos',
  method: 'POST',
  header: {
    'User-Id': userId,
    'Content-Type': 'application/json'
  },
  data: {
    title: '学习Vue3新特性',
    content: '深入学习Vue3的Composition API、响应式系统和新的生命周期钩子',
    priority: 1,
    status: 0,
    tags: ['学习', 'Vue3', '前端']
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
const userId = localStorage.getItem('userId');
fetch('https://vgsarkerfnri.sealosbja.site/api/memos', {
  method: 'POST',
  headers: {
    'User-Id': userId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '学习Vue3新特性',
    content: '深入学习Vue3的Composition API、响应式系统和新的生命周期钩子',
    priority: 1,
    status: 0,
    tags: ['学习', 'Vue3', '前端']
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### 成功响应 (201)
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 7,
    "title": "学习Vue3新特性",
    "content": "深入学习Vue3的Composition API、响应式系统和新的生命周期钩子",
    "priority": 1,
    "status": 0,
    "tags": ["学习", "Vue3", "前端"],
    "createTime": "2025-08-03T02:10:00.000Z",
    "updateTime": "2025-08-03T02:10:00.000Z"
  }
}
```

### 失败响应 (400)
```json
{
  "code": 400,
  "message": "参数错误",
  "data": {
    "errors": [
      "标题不能为空",
      "内容不能为空"
    ]
  }
}
```

---

## 9. 更新备忘录

### 接口信息
- **URL**: `PUT /api/memos/{id}`
- **描述**: 更新当前用户指定ID的备忘录信息
- **需要User-Id**: ✅
- **路径参数**:
  - `id` (必填): 备忘录ID

### 请求头
```
User-Id: wx_o1234567890abcdef
Content-Type: application/json
```

### 请求参数
```json
{
  "title": "备忘录标题（必填，1-200字符）",
  "content": "备忘录内容（必填，1-1000字符）",
  "priority": "优先级（可选，0-普通 1-重要 2-紧急）",
  "status": "状态（可选，0-未完成 1-已完成）",
  "tags": "标签数组（可选）"
}
```

### 请求示例
```javascript
// uni-app/微信小程序
const userId = wx.getStorageSync('userId');
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/memos/1',
  method: 'PUT',
  header: {
    'User-Id': userId,
    'Content-Type': 'application/json'
  },
  data: {
    title: '更新后的标题',
    content: '更新后的内容',
    priority: 2,
    status: 1,
    tags: ['已完成', '重要']
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
const userId = localStorage.getItem('userId');
fetch('https://vgsarkerfnri.sealosbja.site/api/memos/1', {
  method: 'PUT',
  headers: {
    'User-Id': userId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '更新后的标题',
    content: '更新后的内容',
    priority: 2,
    status: 1,
    tags: ['已完成', '重要']
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "title": "更新后的标题",
    "content": "更新后的内容",
    "priority": 2,
    "status": 1,
    "tags": ["已完成", "重要"],
    "createTime": "2025-08-03T02:00:00.000Z",
    "updateTime": "2025-08-03T02:15:00.000Z"
  }
}
```

### 失败响应 (404) - 备忘录不存在或不属于当前用户
```json
{
  "code": 404,
  "message": "备忘录不存在",
  "data": null
}
```

### 失败响应 (400)
```json
{
  "code": 400,
  "message": "参数错误",
  "data": {
    "errors": [
      "标题不能为空"
    ]
  }
}
```

---

## 10. 删除备忘录

### 接口信息
- **URL**: `DELETE /api/memos/{id}`
- **描述**: 删除当前用户指定ID的备忘录
- **需要User-Id**: ✅
- **路径参数**:
  - `id` (必填): 备忘录ID

### 请求头
```
User-Id: wx_o1234567890abcdef
```

### 请求示例
```javascript
// uni-app/微信小程序
const userId = wx.getStorageSync('userId');
wx.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/memos/1',
  method: 'DELETE',
  header: {
    'User-Id': userId
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
const userId = localStorage.getItem('userId');
fetch('https://vgsarkerfnri.sealosbja.site/api/memos/1', {
  method: 'DELETE',
  headers: {
    'User-Id': userId
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### 成功响应 (200)
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

### 失败响应 (404) - 备忘录不存在或不属于当前用户
```json
{
  "code": 404,
  "message": "备忘录不存在",
  "data": null
}
```

### 失败响应 (400)
```json
{
  "code": 400,
  "message": "无效的备忘录ID",
  "data": null
}
```

---

# 🛠️ 开发指南

## 数据字段说明

### 备忘录对象字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 备忘录唯一ID |
| `title` | string | 备忘录标题（1-200字符） |
| `content` | string | 备忘录内容（1-1000字符） |
| `priority` | number | 优先级：0-普通，1-重要，2-紧急 |
| `status` | number | 状态：0-未完成，1-已完成 |
| `tags` | array | 标签数组，如：["学习", "工作"] |
| `createTime` | string | 创建时间（ISO 8601格式） |
| `updateTime` | string | 更新时间（ISO 8601格式） |

### 用户对象字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | string | 用户唯一标识 |
| `userType` | string | 用户类型：wx/h5/app/other |
| `openid` | string | 微信openid（仅微信用户） |
| `nickname` | string | 用户昵称 |
| `avatarUrl` | string | 用户头像URL |
| `memoCount` | number | 备忘录总数 |
| `createdTime` | string | 注册时间 |
| `lastActiveTime` | string | 最后活跃时间 |

## 完整的前端集成示例

### 1. 微信小程序登录流程
```javascript
// utils/auth.js
class AuthManager {
  constructor() {
    this.userId = null;
    this.userInfo = null;
  }

  // 微信登录
  async wechatLogin() {
    try {
      // 1. 获取微信登录code
      const loginRes = await wx.login();
      if (!loginRes.code) {
        throw new Error('获取微信登录凭证失败');
      }

      // 2. 获取用户信息（可选）
      let userInfo = {};
      try {
        const userInfoRes = await wx.getUserProfile({
          desc: '用于完善用户资料'
        });
        userInfo = {
          nickname: userInfoRes.userInfo.nickName,
          avatarUrl: userInfoRes.userInfo.avatarUrl
        };
      } catch (error) {
        console.log('用户拒绝授权用户信息');
      }

      // 3. 调用后端登录接口
      const response = await this.request({
        url: '/api/auth/wechat-login',
        method: 'POST',
        data: {
          code: loginRes.code,
          ...userInfo
        }
      });

      // 4. 保存用户信息
      this.userId = response.data.userId;
      this.userInfo = response.data;
      wx.setStorageSync('userId', this.userId);
      wx.setStorageSync('userInfo', this.userInfo);

      return response.data;
    } catch (error) {
      console.error('微信登录失败:', error);
      throw error;
    }
  }

  // 检查登录状态
  checkLoginStatus() {
    const userId = wx.getStorageSync('userId');
    const userInfo = wx.getStorageSync('userInfo');

    if (userId && userInfo) {
      this.userId = userId;
      this.userInfo = userInfo;
      return true;
    }
    return false;
  }

  // 退出登录
  logout() {
    this.userId = null;
    this.userInfo = null;
    wx.removeStorageSync('userId');
    wx.removeStorageSync('userInfo');
  }

  // 统一请求方法
  async request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://vgsarkerfnri.sealosbja.site${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header: {
          'Content-Type': 'application/json',
          'User-Id': this.userId,
          ...options.header
        },
        success: (res) => {
          if (res.data.code === 200 || res.data.code === 201) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message));
          }
        },
        fail: reject
      });
    });
  }
}

// 创建全局实例
const authManager = new AuthManager();
module.exports = authManager;
```

### 2. 备忘录API封装
```javascript
// utils/memo-api.js
const authManager = require('./auth');

class MemoAPI {
  // 获取备忘录列表
  async getList() {
    return await authManager.request({
      url: '/api/memos',
      method: 'GET'
    });
  }

  // 获取备忘录详情
  async getDetail(id) {
    return await authManager.request({
      url: `/api/memos/${id}`,
      method: 'GET'
    });
  }

  // 创建备忘录
  async create(data) {
    return await authManager.request({
      url: '/api/memos',
      method: 'POST',
      data
    });
  }

  // 更新备忘录
  async update(id, data) {
    return await authManager.request({
      url: `/api/memos/${id}`,
      method: 'PUT',
      data
    });
  }

  // 删除备忘录
  async delete(id) {
    return await authManager.request({
      url: `/api/memos/${id}`,
      method: 'DELETE'
    });
  }

  // 获取用户统计
  async getUserStats() {
    return await authManager.request({
      url: '/api/users/stats',
      method: 'GET'
    });
  }
}

module.exports = new MemoAPI();
```

### 3. 页面使用示例
```javascript
// pages/memo/memo.js
const authManager = require('../../utils/auth');
const memoAPI = require('../../utils/memo-api');

Page({
  data: {
    memos: [],
    userStats: {},
    loading: false
  },

  async onLoad() {
    // 检查登录状态
    if (!authManager.checkLoginStatus()) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }

    await this.loadData();
  },

  // 加载数据
  async loadData() {
    try {
      this.setData({ loading: true });

      // 并行加载备忘录列表和用户统计
      const [memosRes, statsRes] = await Promise.all([
        memoAPI.getList(),
        memoAPI.getUserStats()
      ]);

      this.setData({
        memos: memosRes.data,
        userStats: statsRes.data,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      console.error('加载数据失败:', error);
    }
  },

  // 创建备忘录
  async createMemo() {
    try {
      const response = await memoAPI.create({
        title: '新备忘录',
        content: '备忘录内容',
        priority: 0,
        status: 0,
        tags: []
      });

      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });

      // 刷新列表
      await this.loadData();
    } catch (error) {
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    }
  },

  // 删除备忘录
  async deleteMemo(e) {
    const id = e.currentTarget.dataset.id;

    const result = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这个备忘录吗？'
    });

    if (result.confirm) {
      try {
        await memoAPI.delete(id);
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        await this.loadData();
      } catch (error) {
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }
    }
  }
});
```

## 错误处理建议

### 统一错误处理
```javascript
// utils/error-handler.js
class ErrorHandler {
  static handle(error, showToast = true) {
    let message = '操作失败';

    if (error.message) {
      if (error.message.includes('缺少用户身份标识')) {
        message = '请先登录';
        // 跳转到登录页
        wx.redirectTo({
          url: '/pages/login/login'
        });
        return;
      } else if (error.message.includes('网络')) {
        message = '网络连接失败，请检查网络';
      } else {
        message = error.message;
      }
    }

    if (showToast) {
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      });
    }

    console.error('API错误:', error);
    return message;
  }
}

module.exports = ErrorHandler;
```

## 🔍 调试和测试

### 微信开发者工具调试
1. 在网络面板查看API请求和响应
2. 检查请求头中的User-Id是否正确
3. 查看控制台的错误日志

### 接口测试工具
```bash
# 测试微信登录（需要真实的微信code）
curl -X POST https://vgsarkerfnri.sealosbja.site/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"真实的微信code","nickname":"测试用户"}'

# 测试登录
curl -X POST https://vgsarkerfnri.sealosbja.site/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"userType":"h5","nickname":"测试用户"}'

# 获取备忘录列表（需要先获取userId）
curl -H "User-Id: 从登录接口获取的userId" \
  https://vgsarkerfnri.sealosbja.site/api/memos
```

## ⚠️ 重要注意事项

### 1. 用户身份验证
- **必须携带User-Id**: 除认证接口外，所有接口都需要在请求头中包含User-Id
- **User-Id格式**: 必须符合 `{类型}_{标识}` 格式
- **数据隔离**: 每个用户只能访问自己的数据

### 2. 微信小程序特殊要求
- **域名配置**: 必须在微信后台配置服务器域名
- **HTTPS要求**: 生产环境必须使用HTTPS
- **code有效期**: 微信登录code只能使用一次，有效期5分钟

### 3. 数据格式和限制
- **时间格式**: 所有时间字段使用ISO 8601格式
- **字符限制**: 标题最大200字符，内容最大1000字符
- **标签格式**: tags字段为字符串数组
- **优先级**: 0-普通，1-重要，2-紧急
- **状态**: 0-未完成，1-已完成

### 4. 错误处理
- **统一响应格式**: 所有接口都返回 `{code, message, data}` 格式
- **状态码含义**: 200/201-成功，400-参数错误，404-不存在，500-服务器错误
- **网络超时**: 建议设置合理的请求超时时间
- **重试机制**: 对于网络错误建议实现重试机制

### 5. 性能优化建议
- **数据缓存**: 适当缓存用户信息和备忘录列表
- **分页加载**: 如果备忘录数量很多，考虑实现分页
- **图片优化**: 头像等图片建议压缩后上传
- **请求合并**: 避免频繁的API调用

## 🌐 部署信息

### 服务器地址
- **生产环境**: https://plasmwcfgsbv.sealosbja.site
- **API文档**: https://plasmwcfgsbv.sealosbja.site (返回API状态和接口列表)

### 微信小程序配置
在微信公众平台配置以下域名：
```
request合法域名: https://plasmwcfgsbv.sealosbja.site
```

## 📞 技术支持

### 常见问题
1. **Q: 提示"缺少用户身份标识"**
   A: 检查请求头是否包含User-Id字段

2. **Q: 提示"备忘录不存在"**
   A: 可能是访问了其他用户的备忘录，检查User-Id是否正确

3. **Q: 微信登录失败**
   A: 检查微信AppID和AppSecret配置，确认code是否有效

4. **Q: 网络请求失败**
   A: 检查域名配置，确认网络连接正常

---

## 📋 快速开始检查清单

### 前端开发准备
- [ ] 配置微信小程序服务器域名
- [ ] 实现微信登录流程
- [ ] 保存用户ID到本地存储
- [ ] 在所有API请求中添加User-Id请求头
- [ ] 实现统一的错误处理
- [ ] 测试各个接口功能

### 接口测试验证
- [ ] 微信登录接口正常
- [ ] 用户信息获取正常
- [ ] 备忘录增删改查正常
- [ ] 数据隔离功能正常
- [ ] 错误处理机制正常

🎉 **恭喜！您已经掌握了备忘录API的完整对接方法！**
- **测试页面**: https://vgsarkerfnri.sealosbja.site (浏览器访问可看到测试界面)
- **健康检查**: https://vgsarkerfnri.sealosbja.site (返回API状态信息)
