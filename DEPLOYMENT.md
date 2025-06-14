# 项目部署指南

## 部署到Vercel

### 前置条件
1. GitHub账号
2. Vercel账号（可以用GitHub登录）
3. Supabase数据库已配置

### 部署步骤

#### 1. 推送代码到GitHub
```bash
git add .
git commit -m "准备部署到Vercel"
git push origin master
```

#### 2. 连接Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 选择你的GitHub仓库 `chanwarmsun/person-ipweb`
5. 点击 "Import"

#### 3. 配置环境变量
在Vercel项目设置中添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://mvrikhctrwowswcamkfj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg
```

#### 4. 部署设置
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

#### 5. 域名配置（可选）
部署完成后，Vercel会提供一个默认域名，如：
`https://person-ipweb.vercel.app`

你也可以配置自定义域名。

### 数据库配置

确保Supabase数据库中的表已正确创建：

1. **agents** - 智能体表
2. **prompts** - 提示词表  
3. **teaching_resources** - 教学资源表
4. **custom_requests** - 定制需求表

### 功能验证

部署完成后，请验证以下功能：

1. ✅ 首页正常显示
2. ✅ 智能体、提示词、教学资源正常加载
3. ✅ 管理后台登录正常（密码：admin123）
4. ✅ 管理后台CRUD操作正常
5. ✅ 数据库连接正常
6. ✅ 定制需求提交正常

### 故障排除

如果遇到问题：

1. 检查Vercel部署日志
2. 检查环境变量配置
3. 检查Supabase数据库连接
4. 查看浏览器控制台错误信息

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