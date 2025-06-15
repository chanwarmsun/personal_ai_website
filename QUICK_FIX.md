# 快速修复指南

## 问题：npm run dev 错误

### 错误原因
您在错误的目录中运行了 `npm run dev` 命令。错误显示您在 `C:\Users\52715\` 目录中，但项目实际在 `E:\cursor开发文件\个人IP网站\` 目录中。

### 解决方案

#### 步骤1：打开正确的终端
1. 按 `Win + R` 打开运行对话框
2. 输入 `cmd` 或 `powershell` 并按回车
3. 或者在项目文件夹中右键选择"在终端中打开"

#### 步骤2：切换到项目目录
```bash
cd "E:\cursor开发文件\个人IP网站"
```

#### 步骤3：验证目录正确
```bash
dir package.json
```
应该能看到 package.json 文件

#### 步骤4：启动开发服务器
```bash
npm run dev
```

### 如果端口被占用

如果看到端口被占用的警告，Next.js会自动选择下一个可用端口：
- 3000端口被占用 → 自动使用3001
- 3001端口被占用 → 自动使用3002
- 以此类推...

### 清理多余的Node进程（可选）

如果有太多Node进程在运行，可以清理：
```bash
taskkill /F /IM node.exe
```
然后重新运行 `npm run dev`

### 访问网站

服务器启动后，在浏览器中访问：
- 首页：http://localhost:3000
- 管理后台：http://localhost:3000/admin
- 管理员登录：http://localhost:3000/admin-login

如果使用了其他端口，请相应调整URL。

### 常见问题

1. **权限错误**：以管理员身份运行终端
2. **路径包含中文**：确保使用双引号包围路径
3. **Node版本问题**：确保Node.js版本 >= 14

### 成功标志

看到以下信息表示启动成功：
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in 3s
``` 