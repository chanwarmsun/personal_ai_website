# 个人IP网站 - 设置指南

这是一个基于 Next.js + React + Tailwind CSS + Framer Motion 构建的现代化个人展示网站。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 在浏览器中访问
打开 [http://localhost:3000](http://localhost:3000) 查看网站。

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── Header.tsx         # 导航头部
│   ├── PersonalInfo.tsx   # 个人信息展示
│   ├── AgentsSection.tsx  # AI智能体展示
│   ├── PromptsSection.tsx # 提示词展示
│   ├── ResourcesSection.tsx # HTML教学资源
│   ├── SearchModal.tsx    # 搜索功能
│   └── Footer.tsx         # 底部
├── data/                  # 数据文件
│   └── content.json       # 网站内容数据
├── public/               # 静态资源
└── ...配置文件
```

## 🎨 主要功能

✅ **个人信息展示** - 头像、技能、社交链接等
✅ **智能体分发** - AI智能体展示和下载
✅ **提示词收藏** - 提示词展示、复制和下载
✅ **HTML教学资源** - 学习资源下载
✅ **全站搜索** - 快速搜索所有内容
✅ **响应式设计** - 适配所有设备
✅ **动画效果** - 流畅的Apple风格动画

## 🛠 技术栈

- **框架**: Next.js 14 (App Router)
- **UI库**: React 18
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React
- **搜索**: Fuse.js
- **语言**: TypeScript

## 📝 自定义内容

编辑 `data/content.json` 文件来修改网站内容：

```json
{
  "personalInfo": {
    "name": "你的姓名",
    "title": "你的职业/头衔",
    "slogan": "你的口号",
    ...
  },
  "agents": [...],
  "prompts": [...],
  "htmlResources": [...]
}
```

## 🎯 部署

### Vercel 部署 (推荐)
1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 自动部署完成

### 其他平台
- **Netlify**: 支持
- **Cloudflare Pages**: 支持
- **GitHub Pages**: 需要配置静态导出

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 📞 技术支持

如果遇到问题，请检查：
1. Node.js 版本 >= 18
2. 依赖是否正确安装
3. 端口 3000 是否被占用

## 🎉 享受使用

网站已经配置好所有功能，您可以：
- 修改个人信息和内容
- 添加更多智能体和提示词
- 自定义样式和颜色
- 扩展新功能

祝您使用愉快！🚀 