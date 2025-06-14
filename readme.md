# 🌟 个人IP网站 - AI教育实践者

一个现代化的个人IP展示网站，专为AI教育工作者设计，集成了智能体展示、提示词分享、教学资源下载和完整的后台管理系统。

## ✨ 主要功能

### 🎯 前台展示
- **个人信息展示**: 响应式个人简介，支持技能百分比展示
- **智能体展示**: 可筛选、搜索的智能体卡片，支持对话和下载类型
- **提示词分享**: 高质量提示词展示，支持一键复制和下载
- **教学资源**: 专业教学资源下载区，支持多种文件格式
- **定制申请**: 用户可提交智能体、提示词、教学资源的定制需求

### 🛠️ 后台管理
- **智能体管理**: 支持图片上传、标签管理、类型设置的完整CRUD
- **提示词管理**: 内容编辑、标签系统、下载量统计
- **教学资源管理**: 文件上传和链接输入双重支持
- **定制申请管理**: 查看用户申请、状态管理、统计面板

### 🎨 设计特色
- **现代化UI**: 采用Tailwind CSS + Framer Motion
- **响应式设计**: 完美适配桌面端和移动端
- **流畅动画**: 丰富的交互动画和过渡效果
- **安全管理**: 隐藏式后台入口，密码保护

## 🚀 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React
- **数据存储**: LocalStorage / Supabase
- **类型检查**: TypeScript
- **部署**: Vercel

## 📦 快速开始

### 环境要求
- Node.js 18.17 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/chanwarmsun/person-ipweb.git
cd person-ipweb
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 文件，配置以下变量：
NEXT_PUBLIC_SUPABASE_URL=你的supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的supabase匿名密钥
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

4. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

5. **访问网站**
- 前台: http://localhost:3000
- 后台: http://localhost:3000/admin-login

## 🔧 个人信息配置

### 修改个人信息
编辑 `data/content.json` 文件：

```json
{
  "personalInfo": {
    "name": "您的姓名",
    "title": "您的职位",
    "slogan": "您的个人口号",
    "bio": "您的个人简介",
    "avatar": "/images/your-avatar.jpg",
    "skills": [
      { "name": "技能名称", "level": 95 }
    ],
    "links": {
      "wechat": "微信二维码base64编码",
      "qq": "QQ二维码base64编码",
      "gongzhonghao": "公众号二维码base64编码"
    }
  }
}
```

### 添加个人头像
1. 将头像图片放在 `public/images/` 目录下
2. 修改 `data/content.json` 中的 `avatar` 字段
3. 推荐图片尺寸: 400x400px

### 生成二维码
1. 使用在线二维码生成器（如草料二维码）
2. 将生成的二维码转换为base64格式
3. 替换 `links` 对象中对应的字段

## 📊 数据库配置（可选）

### 使用Supabase（推荐）

1. **注册账号**: 访问 [Supabase](https://supabase.com) 注册
2. **创建项目**: 新建项目并获取URL和API密钥
3. **创建表结构**: 在SQL编辑器中执行 `scripts/migrate-to-supabase.ts` 中的SQL
4. **数据迁移**: 运行迁移脚本将localStorage数据迁移到数据库

## 🚀 部署指南

### Vercel部署（推荐）

1. **连接GitHub**
```bash
# 确保代码已推送到GitHub
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Vercel部署**
- 访问 [Vercel](https://vercel.com)
- 导入GitHub仓库
- 配置环境变量
- 一键部署

3. **域名配置**
- 在Vercel控制台添加自定义域名
- 配置DNS解析

### 其他部署平台
- **Netlify**: 支持Next.js的静态导出
- **腾讯云**: 使用Serverless框架
- **阿里云**: 使用函数计算或ECS

## 📁 项目结构

```
person-ipweb/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理后台页面
│   ├── admin-login/       # 管理员登录页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React组件
│   ├── AgentsSection.tsx  # 智能体展示
│   ├── PromptsSection.tsx # 提示词展示
│   ├── ResourcesSection.tsx # 教学资源
│   ├── PersonalInfo.tsx   # 个人信息
│   ├── CustomRequestModal.tsx # 定制申请模态框
│   └── FileUploadComponent.tsx # 文件上传
├── data/                  # 数据文件
│   └── content.json       # 网站内容配置
├── lib/                   # 工具库
│   └── supabase.ts        # 数据库配置
├── scripts/               # 脚本文件
│   └── migrate-to-supabase.ts # 数据迁移
├── public/                # 静态资源
│   └── images/            # 图片资源
├── .env.local             # 环境变量（本地）
├── .gitignore             # Git忽略文件
├── package.json           # 项目依赖
├── tailwind.config.js     # Tailwind配置
└── README.md              # 项目说明
```

## 🔐 管理后台使用

### 登录方式
- 访问: `/admin-login`
- 默认账号: `admin`
- 默认密码: `admin123`

### 功能说明
1. **智能体管理**: 新增、编辑、删除智能体，支持图片上传
2. **提示词管理**: 管理提示词内容，支持标签和下载量
3. **教学资源管理**: 文件上传或链接输入，支持多种格式
4. **定制申请管理**: 查看用户申请，状态管理和统计

## 🛡️ 安全说明

- 管理后台采用隐藏式入口，需手动输入URL访问
- 支持自定义管理员账号密码
- 敏感数据存储在环境变量中
- 建议生产环境使用更安全的认证方式

## 📞 技术支持

如果您在使用过程中遇到问题，请：

1. 查看项目文档和代码注释
2. 在GitHub上提交Issue
3. 联系项目维护者

## 📄 开源协议

本项目采用 MIT 协议开源，欢迎贡献代码和提出建议。

---

**🌟 如果这个项目对您有帮助，请给个Star支持一下！**
