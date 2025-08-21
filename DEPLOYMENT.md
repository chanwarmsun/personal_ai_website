# 部署指南 - Vercel部署

## 前置条件

1. 确保你有一个GitHub账户，并且项目已经推送到GitHub
2. 注册Vercel账户（可以使用GitHub账户登录）
3. 确保Supabase数据库已经设置完成

## 部署步骤

### 1. 登录Vercel

访问 [vercel.com](https://vercel.com) 并使用GitHub账户登录。

### 2. 导入项目

1. 点击 "New Project" 按钮
2. 选择你的GitHub仓库（个人IP网站项目）
3. 点击 "Import" 按钮

### 3. 配置环境变量

在项目设置中，添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://mvrikhctrwowswcamkfj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg
```

### 4. 部署设置

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 5. 部署

点击 "Deploy" 按钮开始部署。

## 部署后验证

1. 访问分配的Vercel域名
2. 测试网站各个功能：
   - 首页显示
   - 智能体、提示词、教学资源展示
   - 管理后台登录（/admin-login）
   - 数据库CRUD操作
   - 测试页面（/test-db）

## 自定义域名（可选）

1. 在Vercel项目设置中点击 "Domains"
2. 添加你的自定义域名
3. 按照提示配置DNS记录

## 注意事项

1. 确保Supabase数据库的RLS策略已正确配置
2. 检查所有环境变量是否正确设置
3. 如果遇到部署问题，查看Vercel的构建日志
4. 首次部署可能需要几分钟时间

## 常见问题

### 数据库连接失败
- 检查Supabase URL和API Key是否正确
- 确认Supabase项目状态正常

### 页面404错误
- 检查Next.js路由配置
- 确认vercel.json配置正确

### 构建失败
- 检查package.json依赖
- 查看构建日志中的错误信息

## 更新部署

每次推送代码到GitHub主分支时，Vercel会自动重新部署。

### 项目特色

- 🤖 **智能体展示** - 精美的AI智能体展示页面
- 💡 **提示词库** - 丰富的AI提示词资源
- 📚 **教学资源** - AI相关教学材料
- 🔧 **管理后台** - 完整的内容管理系统
- 💾 **数据库集成** - Supabase云数据库
- 📱 **响应式设计** - 支持各种设备
- ⚡ **高性能** - Next.js 14 + Vercel部署

### 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, Framer Motion
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel
- **图标**: Lucide React

---

部署完成后，你的个人IP网站就可以在全球访问了！🎉 