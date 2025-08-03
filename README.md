# 📝 备忘录小程序 - Vue3 + uni-app

一个基于 Vue3 和 uni-app 框架开发的跨平台备忘录应用，支持微信小程序、H5、App等多端运行。

## 🚀 项目特色

- **🎯 跨平台支持**: 一套代码，多端运行（微信小程序、支付宝小程序、H5、App等）
- **⚡ 现代技术栈**: Vue3 + uni-app + Vite，享受最新的开发体验
- **📱 响应式设计**: 适配各种屏幕尺寸，提供优秀的用户体验
- **🔐 数据安全**: 用户身份识别，数据隔离保护
- **🎨 简洁界面**: 清爽的UI设计，专注于内容创作

## 📋 功能特性

### 核心功能
- ✅ **备忘录管理**: 创建、编辑、删除备忘录
- ✅ **详情查看**: 支持富文本内容展示
- ✅ **数据同步**: 云端存储，多设备同步
- ✅ **用户隔离**: 每个用户只能访问自己的数据

### 页面结构
- **引导页** (`intro`): 应用介绍和欢迎页面
- **首页** (`index`): 备忘录列表展示
- **详情页** (`detail`): 备忘录内容详细查看
- **新建页** (`add`): 创建新的备忘录
- **编辑页** (`edit`): 编辑现有备忘录

## 🛠️ 技术栈

### 前端框架
- **Vue 3.4.21**: 渐进式JavaScript框架
- **uni-app 3.0**: 跨平台应用开发框架
- **Vite 5.2.8**: 现代化构建工具

### 开发工具
- **Vue I18n**: 国际化支持
- **TypeScript**: 类型安全支持
- **ESLint**: 代码质量检查

### 支持平台
- 微信小程序 (mp-weixin)
- 支付宝小程序 (mp-alipay)
- 百度小程序 (mp-baidu)
- 字节跳动小程序 (mp-toutiao)
- QQ小程序 (mp-qq)
- H5网页版
- App (Android/iOS)

## 📁 项目结构

```
my-vue3-project/
├── src/                    # 源代码目录
│   ├── pages/             # 页面文件
│   │   ├── intro/         # 引导页
│   │   ├── index/         # 首页
│   │   ├── detail/        # 详情页
│   │   ├── add/           # 新建页
│   │   └── edit/          # 编辑页
│   ├── static/            # 静态资源
│   ├── utils/             # 工具函数
│   │   └── api.js         # API接口封装
│   ├── App.vue            # 应用入口组件
│   ├── main.js            # 应用入口文件
│   ├── pages.json         # 页面配置
│   ├── manifest.json      # 应用配置
│   └── uni.scss           # 全局样式
├── api-md/                # API文档
├── dist/                  # 构建输出目录
├── package.json           # 项目配置
└── vite.config.js         # Vite配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn 包管理器
- HBuilderX (推荐) 或 VS Code

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 开发运行

#### 微信小程序
```bash
npm run dev:mp-weixin
```

#### H5网页版
```bash
npm run dev:h5
```

#### 其他平台
```bash
# 支付宝小程序
npm run dev:mp-alipay

# 百度小程序
npm run dev:mp-baidu

# 字节跳动小程序
npm run dev:mp-toutiao

# QQ小程序
npm run dev:mp-qq
```

### 生产构建

#### 微信小程序
```bash
npm run build:mp-weixin
```

#### H5网页版
```bash
npm run build:h5
```

## 🔗 API接口

项目使用RESTful API与后端服务通信，详细的API文档请查看：
- [备忘录应用后端API接口文档](./api-md/备忘录应用后端API接口文档.md)

### API基础信息
- **服务器地址**: `https://plasmwcfgsbv.sealosbja.site`
- **API基础路径**: `/api`
- **数据格式**: JSON
- **认证方式**: User-Id请求头

## 📱 使用说明

### 微信小程序开发
1. 在微信开发者工具中导入项目
2. 运行 `npm run dev:mp-weixin`
3. 在微信开发者工具中预览和调试

### H5开发
1. 运行 `npm run dev:h5`
2. 在浏览器中访问 `http://localhost:5173`

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件至项目维护者:2650321653@qq.com

---

**享受编码，创造美好！** 🎉
