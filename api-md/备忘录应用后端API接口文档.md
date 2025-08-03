# 备忘录应用API接口对接文档

## 基础信息
- **服务器地址**: `https://pmfvfknyyvch.sealosbja.site`
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
前端会自动生成用户唯一标识，后端需要根据此标识进行数据隔离：

1. **微信小程序用户**: `wx_{微信code前16位}` (如: `wx_1234567890abcdef`)
2. **设备用户**: `device_{设备信息哈希}` (如: `device_a1b2c3d4e5f6`)
3. **随机用户**: `random_{时间戳}_{随机字符串}` (如: `random_1691234567_abc123`)

### 数据隔离要求
- 每个用户只能查看、创建、修改、删除自己的备忘录
- 后端需要在所有操作中验证用户身份
- 数据库查询需要添加用户ID过滤条件

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

## 1. 获取备忘录列表

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

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos',
  method: 'GET',
  header: {
    'User-Id': 'wx_1234567890abcdef'
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
fetch('https://pmfvfknyyvch.sealosbja.site/api/memos', {
  headers: {
    'User-Id': 'wx_1234567890abcdef'
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

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos/1',
  method: 'GET',
  header: {
    'User-Id': 'wx_1234567890abcdef'
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
fetch('https://pmfvfknyyvch.sealosbja.site/api/memos/1', {
  headers: {
    'User-Id': 'wx_1234567890abcdef'
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

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos',
  method: 'POST',
  header: {
    'User-Id': 'wx_1234567890abcdef'
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
    'User-Id': 'wx_1234567890abcdef'
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

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos/1',
  method: 'PUT',
  header: {
    'User-Id': 'wx_1234567890abcdef'
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
    'User-Id': 'wx_1234567890abcdef'
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

### 请求示例
```javascript
// uni-app
uni.request({
  url: 'https://pmfvfknyyvch.sealosbja.site/api/memos/1',
  method: 'DELETE',
  header: {
    'User-Id': 'wx_1234567890abcdef'
  },
  success: (res) => {
    console.log(res.data);
  }
});

// 原生JavaScript
fetch('https://pmfvfknyyvch.sealosbja.site/api/memos/1', {
  method: 'DELETE',
  headers: {
    'User-Id': 'wx_1234567890abcdef'
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

- **API根地址**: https://pmfvfknyyvch.sealosbja.site
- **测试页面**: https://pmfvfknyyvch.sealosbja.site (浏览器访问可看到测试界面)
- **健康检查**: https://pmfvfknyyvch.sealosbja.site (返回API状态信息)

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
