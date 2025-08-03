# 备忘录应用API接口对接文档

## 基础信息
- **服务器地址**: `https://plasmwcfgsbv.sealosbja.site`
- **API基础路径**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **请求头**: `Content-Type: application/json`

## 🔐 用户身份识别与数据隔离

### 重要更新说明
为了保护用户隐私和数据安全，现在所有API接口都需要用户身份识别。每个用户只能访问自己的备忘录数据。

### 用户ID传递方式
所有API请求都需要在请求头中包含用户标识：
```
User-Id: {用户唯一标识}
```

### 用户ID生成规则
前端会根据不同平台生成用户唯一标识，后端需要根据此标识进行数据隔离：

1. **微信小程序用户**: `wx_{openid}` (如: `wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M`)
2. **H5网页用户**: `h5_{设备指纹哈希}` (如: `h5_a1b2c3d4e5f6g7h8`)
3. **App用户**: `app_{设备UUID}` (如: `app_550e8400-e29b-41d4-a716-446655440000`)
4. **其他平台**: `other_{平台标识}_{唯一ID}` (如: `other_alipay_xxx123`)

### 数据隔离要求
- 每个用户只能查看、创建、修改、删除自己的备忘录
- 后端需要在所有操作中验证用户身份
- 数据库查询需要添加用户ID过滤条件

## 📊 数据库设计

### 用户表 (users)
用于管理用户信息和统计数据：

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) UNIQUE NOT NULL COMMENT '用户唯一标识',
  user_type ENUM('wx', 'h5', 'app', 'other') NOT NULL COMMENT '用户类型',
  openid VARCHAR(50) DEFAULT NULL COMMENT '微信openid（仅微信用户）',
  session_key VARCHAR(50) DEFAULT NULL COMMENT '微信session_key（仅微信用户）',
  nickname VARCHAR(50) DEFAULT NULL COMMENT '用户昵称',
  avatar_url VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  memo_count INT DEFAULT 0 COMMENT '备忘录数量',
  last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_openid (openid),
  INDEX idx_user_type (user_type),
  INDEX idx_last_active (last_active_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';
```

### 备忘录表 (memos) - 修改版
在原有备忘录表基础上添加用户关联：

```sql
CREATE TABLE memos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) NOT NULL COMMENT '用户唯一标识',
  title VARCHAR(200) NOT NULL COMMENT '备忘录标题',
  content TEXT COMMENT '备忘录内容',
  priority TINYINT DEFAULT 0 COMMENT '优先级 0-普通 1-重要 2-紧急',
  status TINYINT DEFAULT 0 COMMENT '状态 0-未完成 1-已完成',
  tags VARCHAR(500) DEFAULT NULL COMMENT '标签，JSON格式',
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_created_time (created_time),
  INDEX idx_updated_time (updated_time),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备忘录表';
```

### 数据库操作要求

#### 1. 用户自动注册
当接收到新的 `User-Id` 时，自动创建用户记录：

```sql
-- 检查用户是否存在，不存在则创建
INSERT IGNORE INTO users (user_id, user_type, last_active_time)
VALUES (?, ?, NOW());

-- 更新最后活跃时间
UPDATE users SET last_active_time = NOW() WHERE user_id = ?;
```

#### 2. 数据隔离查询
所有备忘录相关操作都必须添加用户过滤：

```sql
-- 获取用户备忘录列表
SELECT * FROM memos WHERE user_id = ? ORDER BY updated_time DESC;

-- 获取用户特定备忘录
SELECT * FROM memos WHERE user_id = ? AND id = ?;

-- 创建备忘录
INSERT INTO memos (user_id, title, content) VALUES (?, ?, ?);

-- 更新备忘录
UPDATE memos SET title = ?, content = ?, updated_time = NOW()
WHERE user_id = ? AND id = ?;

-- 删除备忘录
DELETE FROM memos WHERE user_id = ? AND id = ?;
```

#### 3. 用户统计更新
在备忘录增删时更新用户统计：

```sql
-- 更新用户备忘录数量
UPDATE users SET memo_count = (
  SELECT COUNT(*) FROM memos WHERE user_id = ?
) WHERE user_id = ?;
```

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

---

## 🧑‍💻 用户管理API

### 1. 微信小程序登录
获取微信用户的openid，用于后续API调用的用户标识。

#### 接口信息
- **URL**: `POST /api/auth/wechat-login`
- **描述**: 微信小程序用户登录，获取openid
- **请求头**:
  - `Content-Type: application/json`

#### 请求参数
```json
{
  "code": "微信登录凭证code（必填）",
  "nickname": "用户昵称（可选）",
  "avatarUrl": "用户头像URL（可选）"
}
```

#### 后端实现要求
需要调用微信API获取openid：

```javascript
// 调用微信API获取openid
const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`);
const { openid, session_key, errcode, errmsg } = await response.json();

if (errcode) {
  throw new Error(`微信API错误: ${errmsg}`);
}

// 生成用户ID
const userId = `wx_${openid}`;
```

#### SQL实现示例
```sql
-- 1. 创建或更新用户信息
INSERT INTO users (user_id, user_type, openid, nickname, avatar_url, last_active_time)
VALUES (?, 'wx', ?, ?, ?, NOW())
ON DUPLICATE KEY UPDATE
  nickname = COALESCE(VALUES(nickname), nickname),
  avatar_url = COALESCE(VALUES(avatar_url), avatar_url),
  last_active_time = NOW();

-- 2. 返回用户信息
SELECT user_id, user_type, nickname, avatar_url, memo_count,
       created_time, last_active_time
FROM users WHERE user_id = ?;
```

#### 成功响应 (200)
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "userId": "wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
    "userType": "wx",
    "openid": "o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
    "nickname": "微信用户",
    "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/xxx",
    "memoCount": 0,
    "createdTime": "2025-08-03T10:00:00.000Z",
    "lastActiveTime": "2025-08-03T15:30:00.000Z"
  }
}
```

#### 失败响应 (400)
```json
{
  "code": 400,
  "message": "微信登录失败: invalid code",
  "data": null
}
```

### 2. 其他平台用户注册/登录
用户首次访问时自动注册，后续访问自动更新活跃时间。

#### 接口信息
- **URL**: `POST /api/users/register`
- **描述**: 用户自动注册或更新活跃时间
- **请求头**:
  - `User-Id` (必填): 用户唯一标识
  - `Content-Type: application/json`

#### 请求参数
```json
{
  "nickname": "用户昵称（可选）",
  "avatarUrl": "头像URL（可选）"
}
```

#### 后端实现要求
```sql
-- 1. 检查用户是否存在，不存在则创建
INSERT IGNORE INTO users (user_id, user_type, nickname, avatar_url, last_active_time)
VALUES (?, ?, ?, ?, NOW());

-- 2. 更新用户信息和活跃时间
UPDATE users SET
  nickname = COALESCE(?, nickname),
  avatar_url = COALESCE(?, avatar_url),
  last_active_time = NOW()
WHERE user_id = ?;

-- 3. 返回用户信息
SELECT user_id, user_type, nickname, avatar_url, memo_count,
       created_time, last_active_time
FROM users WHERE user_id = ?;
```

#### 成功响应 (200)
```json
{
  "code": 200,
  "message": "用户信息更新成功",
  "data": {
    "userId": "wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
    "userType": "wx",
    "nickname": "微信用户",
    "avatarUrl": "https://example.com/avatar.jpg",
    "memoCount": 5,
    "createdTime": "2025-08-02T10:00:00.000Z",
    "lastActiveTime": "2025-08-03T15:30:00.000Z"
  }
}
```

### 2. 获取用户信息
获取当前用户的详细信息和统计数据。

#### 接口信息
- **URL**: `GET /api/users/profile`
- **描述**: 获取用户个人信息
- **请求头**:
  - `User-Id` (必填): 用户唯一标识

#### 后端实现要求
```sql
-- 获取用户信息
SELECT user_id, user_type, nickname, avatar_url, memo_count,
       created_time, last_active_time
FROM users WHERE user_id = ?;
```

#### 成功响应 (200)
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": "wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
    "userType": "wx",
    "nickname": "微信用户",
    "avatarUrl": "https://example.com/avatar.jpg",
    "memoCount": 5,
    "createdTime": "2025-08-02T10:00:00.000Z",
    "lastActiveTime": "2025-08-03T15:30:00.000Z"
  }
}
```

### 3. 更新用户信息
更新用户的昵称和头像等信息。

#### 接口信息
- **URL**: `PUT /api/users/profile`
- **描述**: 更新用户个人信息
- **请求头**:
  - `User-Id` (必填): 用户唯一标识
  - `Content-Type: application/json`

#### 请求参数
```json
{
  "nickname": "新昵称",
  "avatarUrl": "新头像URL"
}
```

#### 后端实现要求
```sql
-- 更新用户信息
UPDATE users SET
  nickname = ?,
  avatar_url = ?,
  updated_time = NOW()
WHERE user_id = ?;

-- 返回更新后的用户信息
SELECT user_id, user_type, nickname, avatar_url, memo_count,
       created_time, last_active_time
FROM users WHERE user_id = ?;
```

#### 成功响应 (200)
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "userId": "wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
    "userType": "wx",
    "nickname": "新昵称",
    "avatarUrl": "新头像URL",
    "memoCount": 5,
    "createdTime": "2025-08-02T10:00:00.000Z",
    "lastActiveTime": "2025-08-03T15:30:00.000Z"
  }
}
```

---

## 📝 备忘录管理API

### 1. 获取备忘录列表

### 接口信息
- **URL**: `GET /api/memos`
- **描述**: 获取当前用户的所有备忘录，按更新时间倒序排列
- **请求参数**: 无
- **请求头**:
  - `User-Id` (必填): 用户唯一标识

### 后端实现要求
- 根据请求头中的 `User-Id` 过滤数据
- 只返回该用户创建的备忘录
- 如果 `User-Id` 为空，返回400错误
- 自动更新用户活跃时间

#### SQL实现示例
```sql
-- 1. 验证用户存在并更新活跃时间
UPDATE users SET last_active_time = NOW() WHERE user_id = ?;

-- 2. 获取用户备忘录列表
SELECT id, title, content, priority, status, tags,
       created_time as createTime, updated_time as updateTime
FROM memos
WHERE user_id = ?
ORDER BY updated_time DESC;
```

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos',
  method: 'GET',
  header: {
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
fetch('https://pmfvfknyyvch.sealosbja.site/api/memos', {
  headers: {
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
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
      "createTime": "2025-08-02T12:35:47.000Z",
      "updateTime": "2025-08-02T12:35:47.000Z"
    },
    {
      "id": 2,
      "title": "购买生活用品",
      "content": "牙膏、洗发水、纸巾、洗衣液、沐浴露、洗面奶等日常用品。",
      "createTime": "2025-08-02T12:36:52.000Z",
      "updateTime": "2025-08-02T12:36:52.000Z"
    }
  ]
}
```

### 失败响应 (500)
```json
{
  "code": 500,
  "message": "服务器内部错误",
  "data": null
}
```

---

## 2. 获取备忘录详情

### 接口信息
- **URL**: `GET /api/memos/{id}`
- **描述**: 根据ID获取单个备忘录的详细信息
- **路径参数**:
  - `id` (必填): 备忘录ID
- **请求头**:
  - `User-Id` (必填): 用户唯一标识

### 后端实现要求
- 验证备忘录是否属于当前用户
- 如果备忘录不属于当前用户，返回404错误
- 如果 `User-Id` 为空，返回400错误
- 自动更新用户活跃时间

#### SQL实现示例
```sql
-- 1. 验证用户存在并更新活跃时间
UPDATE users SET last_active_time = NOW() WHERE user_id = ?;

-- 2. 获取指定备忘录（必须属于当前用户）
SELECT id, title, content, priority, status, tags,
       created_time as createTime, updated_time as updateTime
FROM memos
WHERE user_id = ? AND id = ?;

-- 如果查询结果为空，返回404错误
```

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos/1',
  method: 'GET',
  header: {
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
fetch('https://pmfvfknyyvch.sealosbja.site/api/memos/1', {
  headers: {
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
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
    "createTime": "2025-08-02T12:35:47.000Z",
    "updateTime": "2025-08-02T12:35:47.000Z"
  }
}
```

### 失败响应 (404)
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

## 3. 创建备忘录

### 接口信息
- **URL**: `POST /api/memos`
- **描述**: 为当前用户创建新的备忘录
- **请求头**:
  - `User-Id` (必填): 用户唯一标识
  - `Content-Type`: application/json
- **请求体参数**:
  - `title` (必填): 备忘录标题，1-50字符
  - `content` (必填): 备忘录内容，1-1000字符

### 后端实现要求
- 将备忘录与当前用户关联
- 在数据库中存储用户ID
- 如果 `User-Id` 为空，返回400错误
- 自动更新用户活跃时间和备忘录数量

#### SQL实现示例
```sql
-- 1. 验证用户存在并更新活跃时间
UPDATE users SET last_active_time = NOW() WHERE user_id = ?;

-- 2. 创建备忘录
INSERT INTO memos (user_id, title, content, created_time, updated_time)
VALUES (?, ?, ?, NOW(), NOW());

-- 3. 获取新创建的备忘录ID
SET @memo_id = LAST_INSERT_ID();

-- 4. 更新用户备忘录数量
UPDATE users SET memo_count = (
  SELECT COUNT(*) FROM memos WHERE user_id = ?
) WHERE user_id = ?;

-- 5. 返回新创建的备忘录信息
SELECT id, title, content, priority, status, tags,
       created_time as createTime, updated_time as updateTime
FROM memos WHERE id = @memo_id;
```

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos',
  method: 'POST',
  header: {
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
  },
  data: {
    title: '新备忘录标题',
    content: '新备忘录内容'
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
fetch('https://pmfvfknyyvch.sealosbja.site/api/memos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
  },
  body: JSON.stringify({
    title: '新备忘录标题',
    content: '新备忘录内容'
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
    "title": "新备忘录标题",
    "content": "新备忘录内容",
    "createTime": "2025-08-02T14:30:00.000Z",
    "updateTime": "2025-08-02T14:30:00.000Z"
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

## 4. 更新备忘录

### 接口信息
- **URL**: `PUT /api/memos/{id}`
- **描述**: 更新指定ID的备忘录信息
- **路径参数**:
  - `id` (必填): 备忘录ID
- **请求头**:
  - `User-Id` (必填): 用户唯一标识
  - `Content-Type`: application/json
- **请求体参数**:
  - `title` (必填): 备忘录标题，1-50字符
  - `content` (必填): 备忘录内容，1-1000字符

### 后端实现要求
- 验证备忘录是否属于当前用户
- 只允许用户更新自己的备忘录
- 如果备忘录不属于当前用户，返回404错误
- 如果 `User-Id` 为空，返回400错误
- 自动更新用户活跃时间

#### SQL实现示例
```sql
-- 1. 验证用户存在并更新活跃时间
UPDATE users SET last_active_time = NOW() WHERE user_id = ?;

-- 2. 验证备忘录是否属于当前用户并更新
UPDATE memos SET
  title = ?,
  content = ?,
  updated_time = NOW()
WHERE user_id = ? AND id = ?;

-- 3. 检查是否有行被更新（如果为0则返回404）
-- 4. 返回更新后的备忘录信息
SELECT id, title, content, priority, status, tags,
       created_time as createTime, updated_time as updateTime
FROM memos
WHERE user_id = ? AND id = ?;
```

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos/1',
  method: 'PUT',
  header: {
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
  },
  data: {
    title: '更新后的标题',
    content: '更新后的内容'
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
fetch('https://pmfvfknyyvch.sealosbja.site/api/memos/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
  },
  body: JSON.stringify({
    title: '更新后的标题',
    content: '更新后的内容'
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
    "createTime": "2025-08-02T12:35:47.000Z",
    "updateTime": "2025-08-02T15:45:00.000Z"
  }
}
```

### 失败响应 (404)
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

## 5. 删除备忘录

### 接口信息
- **URL**: `DELETE /api/memos/{id}`
- **描述**: 删除指定ID的备忘录
- **路径参数**:
  - `id` (必填): 备忘录ID
- **请求头**:
  - `User-Id` (必填): 用户唯一标识

### 后端实现要求
- 验证备忘录是否属于当前用户
- 只允许用户删除自己的备忘录
- 如果备忘录不属于当前用户，返回404错误
- 如果 `User-Id` 为空，返回400错误
- 自动更新用户活跃时间和备忘录数量

#### SQL实现示例
```sql
-- 1. 验证用户存在并更新活跃时间
UPDATE users SET last_active_time = NOW() WHERE user_id = ?;

-- 2. 删除指定备忘录（必须属于当前用户）
DELETE FROM memos WHERE user_id = ? AND id = ?;

-- 3. 检查是否有行被删除（如果为0则返回404）
-- 4. 更新用户备忘录数量
UPDATE users SET memo_count = (
  SELECT COUNT(*) FROM memos WHERE user_id = ?
) WHERE user_id = ?;
```

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos/1',
  method: 'DELETE',
  header: {
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
fetch('https://pmfvfknyyvch.sealosbja.site/api/memos/1', {
  method: 'DELETE',
  headers: {
    'User-Id': 'wx_o6_bmjrPTlm6_2sgVt7hMZOPfL2M'
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

### 失败响应 (404)
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

## 🔒 用户身份验证错误响应

### 缺少用户ID (400)
```json
{
  "code": 400,
  "message": "缺少用户身份标识",
  "data": null
}
```

### 无权限访问 (403)
```json
{
  "code": 403,
  "message": "无权限访问该资源",
  "data": null
}
```

---

## 📊 数据库设计建议

### 备忘录表结构更新
建议在现有备忘录表中添加用户ID字段：

```sql
-- 添加用户ID字段
ALTER TABLE memos ADD COLUMN user_id VARCHAR(100) NOT NULL;

-- 添加索引提高查询性能
CREATE INDEX idx_memos_user_id ON memos(user_id);
CREATE INDEX idx_memos_user_id_update_time ON memos(user_id, update_time DESC);

-- 示例表结构
CREATE TABLE memos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) NOT NULL COMMENT '用户唯一标识',
  title VARCHAR(50) NOT NULL COMMENT '备忘录标题',
  content TEXT NOT NULL COMMENT '备忘录内容',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_user_id (user_id),
  INDEX idx_user_update_time (user_id, update_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备忘录表';
```

### 查询示例
```sql
-- 获取用户备忘录列表
SELECT * FROM memos WHERE user_id = ? ORDER BY update_time DESC;

-- 获取用户特定备忘录
SELECT * FROM memos WHERE id = ? AND user_id = ?;

-- 创建备忘录
INSERT INTO memos (user_id, title, content) VALUES (?, ?, ?);

-- 更新备忘录
UPDATE memos SET title = ?, content = ?, update_time = NOW()
WHERE id = ? AND user_id = ?;

-- 删除备忘录
DELETE FROM memos WHERE id = ? AND user_id = ?;
```

---

## 错误处理建议

### 前端错误处理示例
```javascript
// uni-app 错误处理
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
        title: message,
        icon: 'none'
      });
      break;
    case 404:
      // 资源不存在
      uni.showToast({
        title: '数据不存在',
        icon: 'none'
      });
      break;
    case 500:
      // 服务器错误
      uni.showToast({
        title: '服务器错误，请稍后重试',
        icon: 'none'
      });
      break;
    default:
      uni.showToast({
        title: '未知错误',
        icon: 'none'
      });
  }
  return null;
}

// 使用示例
uni.request({
  url: 'https://vgsarkerfnri.sealosbja.site/api/memos',
  method: 'GET',
  success: (res) => {
    const data = handleApiResponse(res);
    if (data) {
      // 处理成功数据
      this.memoList = data;
    }
  },
  fail: (err) => {
    uni.showToast({
      title: '网络错误',
      icon: 'none'
    });
  }
});
```

## 注意事项

1. **用户身份验证**: 所有API请求都必须包含 `User-Id` 请求头
2. **数据隔离**: 每个用户只能访问自己的数据
3. **时间格式**: 所有时间字段使用ISO 8601格式 (YYYY-MM-DDTHH:mm:ss.sssZ)
4. **字符限制**: 标题最大50字符，内容最大1000字符
5. **排序**: 列表接口按更新时间倒序返回
6. **错误处理**: 前端需要根据返回的code字段判断操作结果
7. **网络超时**: 建议设置合理的请求超时时间
8. **数据验证**: 前端也应该进行基本的数据验证
9. **用户ID格式**: 支持微信用户、设备用户、随机用户等多种格式

## 🔧 后端开发重点

### 必须实现的功能
1. **用户ID验证**: 检查所有请求的 `User-Id` 请求头
2. **数据过滤**: 在所有查询中添加用户ID条件
3. **权限验证**: 确保用户只能操作自己的数据
4. **错误处理**: 返回适当的错误码和消息

### 安全建议
1. **输入验证**: 验证用户ID格式的合法性
2. **SQL注入防护**: 使用参数化查询
3. **数据库索引**: 为用户ID字段添加索引
4. **日志记录**: 记录用户操作日志

## 测试地址

- **API根地址**: https://plasmwcfgsbv.sealosbja.site
- **测试页面**: https://plasmwcfgsbv.sealosbja.site (浏览器访问可看到测试界面)
- **健康检查**: https://plasmwcfgsbv.sealosbja.site (返回API状态信息)

## 📝 更新日志

### v2.0 (当前版本)
- ✅ 添加用户身份识别机制
- ✅ 实现数据隔离和权限控制
- ✅ 更新所有API接口支持用户ID
- ✅ 添加数据库设计建议
- ✅ 完善错误处理机制

### v1.0 (旧版本)
- ❌ 无用户身份识别
- ❌ 所有用户共享数据
- ❌ 存在隐私安全问题

---

## 🔧 后端开发实施指南

### 1. 微信小程序配置

#### 微信开发者平台配置
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 获取小程序的 `AppID` 和 `AppSecret`
3. 配置服务器域名白名单

#### 后端环境变量配置
```bash
# .env 文件
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
```

#### 微信API调用示例
```javascript
// Node.js 示例
const getWechatOpenId = async (code) => {
  const url = `https://api.weixin.qq.com/sns/jscode2session`;
  const params = {
    appid: process.env.WECHAT_APPID,
    secret: process.env.WECHAT_SECRET,
    js_code: code,
    grant_type: 'authorization_code'
  };

  const response = await fetch(`${url}?${new URLSearchParams(params)}`);
  const data = await response.json();

  if (data.errcode) {
    throw new Error(`微信API错误: ${data.errmsg}`);
  }

  return {
    openid: data.openid,
    session_key: data.session_key
  };
};
```

#### 前端调用示例
```javascript
// uni-app 微信小程序登录
const wechatLogin = async () => {
  try {
    // 1. 获取微信登录凭证
    const loginRes = await uni.login({
      provider: 'weixin'
    });

    if (!loginRes[1].code) {
      throw new Error('获取微信登录凭证失败');
    }

    // 2. 获取用户信息（可选）
    const userInfoRes = await uni.getUserProfile({
      desc: '用于完善用户资料'
    });

    // 3. 调用后端登录接口
    const response = await uni.request({
      url: 'https://pmfvfknyyvch.sealosbja.site/api/auth/wechat-login',
      method: 'POST',
      data: {
        code: loginRes[1].code,
        nickname: userInfoRes[1].userInfo?.nickName,
        avatarUrl: userInfoRes[1].userInfo?.avatarUrl
      }
    });

    if (response[1].data.code === 200) {
      const userData = response[1].data.data;
      // 保存用户ID到本地存储
      uni.setStorageSync('userId', userData.userId);
      uni.setStorageSync('userInfo', userData);

      console.log('登录成功:', userData);
      return userData;
    } else {
      throw new Error(response[1].data.message);
    }
  } catch (error) {
    console.error('微信登录失败:', error);
    uni.showToast({
      title: '登录失败',
      icon: 'error'
    });
  }
};

// 在页面中使用
onMounted(() => {
  // 检查是否已登录
  const userId = uni.getStorageSync('userId');
  if (!userId) {
    // 未登录，执行登录
    wechatLogin();
  }
});
```

### 2. 数据库迁移步骤

#### 步骤1: 创建用户表
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) UNIQUE NOT NULL COMMENT '用户唯一标识',
  user_type ENUM('wx', 'h5', 'app', 'other') NOT NULL COMMENT '用户类型',
  openid VARCHAR(50) DEFAULT NULL COMMENT '微信openid（仅微信用户）',
  session_key VARCHAR(50) DEFAULT NULL COMMENT '微信session_key（仅微信用户）',
  nickname VARCHAR(50) DEFAULT NULL COMMENT '用户昵称',
  avatar_url VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  memo_count INT DEFAULT 0 COMMENT '备忘录数量',
  last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_openid (openid),
  INDEX idx_user_type (user_type),
  INDEX idx_last_active (last_active_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';
```

#### 步骤2: 修改备忘录表
```sql
-- 如果是新建表
CREATE TABLE memos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) NOT NULL COMMENT '用户唯一标识',
  title VARCHAR(200) NOT NULL COMMENT '备忘录标题',
  content TEXT COMMENT '备忘录内容',
  priority TINYINT DEFAULT 0 COMMENT '优先级 0-普通 1-重要 2-紧急',
  status TINYINT DEFAULT 0 COMMENT '状态 0-未完成 1-已完成',
  tags VARCHAR(500) DEFAULT NULL COMMENT '标签，JSON格式',
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_created_time (created_time),
  INDEX idx_updated_time (updated_time),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备忘录表';

-- 如果是修改现有表
ALTER TABLE memos ADD COLUMN user_id VARCHAR(100) NOT NULL COMMENT '用户唯一标识' AFTER id;
ALTER TABLE memos ADD INDEX idx_user_id (user_id);
ALTER TABLE memos ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
```

### 2. 中间件实现建议

#### 用户身份验证中间件
```javascript
// Node.js Express 示例
const userAuthMiddleware = async (req, res, next) => {
  const userId = req.headers['user-id'];

  if (!userId) {
    return res.status(400).json({
      code: 400,
      message: '缺少用户标识',
      data: null
    });
  }

  // 验证用户ID格式
  if (!/^(wx_|h5_|app_|other_).+/.test(userId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的用户标识格式',
      data: null
    });
  }

  // 自动注册或更新用户活跃时间
  try {
    await autoRegisterUser(userId);
    req.userId = userId;
    next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: '用户验证失败',
      data: null
    });
  }
};

// 自动注册用户函数
const autoRegisterUser = async (userId) => {
  const userType = userId.split('_')[0];

  // 插入或更新用户记录
  await db.query(`
    INSERT INTO users (user_id, user_type, last_active_time)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE last_active_time = NOW()
  `, [userId, userType]);
};
```

### 3. 安全注意事项

#### 数据隔离检查清单
- ✅ 所有查询都包含 `WHERE user_id = ?` 条件
- ✅ 创建记录时自动设置 `user_id`
- ✅ 更新/删除前验证记录所有权
- ✅ 使用参数化查询防止SQL注入
- ✅ 验证用户ID格式和长度
- ✅ 记录用户操作日志（可选）

#### 性能优化建议
- 🚀 在 `user_id` 字段上创建索引
- 🚀 在 `(user_id, updated_time)` 上创建复合索引
- 🚀 定期清理不活跃用户数据
- 🚀 使用连接池管理数据库连接
- 🚀 实现查询结果缓存（Redis）

### 4. 错误处理标准

#### 统一错误响应格式
```javascript
const errorResponse = (code, message, data = null) => ({
  code,
  message,
  data
});

// 常用错误响应
const ERRORS = {
  MISSING_USER_ID: errorResponse(400, '缺少用户标识'),
  INVALID_USER_ID: errorResponse(400, '无效的用户标识'),
  MEMO_NOT_FOUND: errorResponse(404, '备忘录不存在'),
  UNAUTHORIZED: errorResponse(403, '无权访问此资源'),
  SERVER_ERROR: errorResponse(500, '服务器内部错误')
};
```

### 5. 测试建议

#### 单元测试要点
- 测试用户自动注册功能
- 测试数据隔离（不同用户不能访问彼此数据）
- 测试无效用户ID的处理
- 测试并发访问的数据一致性
- 测试数据库约束和外键关系

#### 集成测试场景
- 多用户同时操作不同备忘录
- 用户ID格式验证
- 数据库连接异常处理
- 大量数据的查询性能

---

## 📞 技术支持

如有实施过程中的技术问题，请联系：
- 📧 邮箱：2650321653@qq.com
- 📋 提交Issue到项目仓库
- 💬 技术交流群：[待建立]

**祝开发顺利！** 🎉
