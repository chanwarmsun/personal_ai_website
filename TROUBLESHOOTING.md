# 问题诊断和解决方案

## 问题1: 管理后台没有样式

### 可能原因
1. Tailwind CSS 没有正确加载
2. 样式文件路径问题
3. 浏览器缓存问题

### 解决方案

#### 方案1: 清除浏览器缓存
1. 按 `Ctrl + Shift + R` 强制刷新页面
2. 或者按 `F12` 打开开发者工具，右键刷新按钮选择"清空缓存并硬性重新加载"

#### 方案2: 检查开发服务器
1. 确保开发服务器正在运行：`npm run dev`
2. 访问 `http://localhost:3000/admin` 或 `http://localhost:3001/admin`
3. 检查控制台是否有错误信息

#### 方案3: 重新构建项目
```bash
# 停止开发服务器 (Ctrl+C)
# 删除构建缓存
rm -rf .next
# 重新安装依赖
npm install
# 重新启动
npm run dev
```

## 问题2: Supabase SQL 执行错误

### 错误信息
```
ERROR: 42601: syntax error at or near "scripts"
```

### 原因
您不能直接在Supabase SQL Editor中执行文件路径，需要复制SQL内容。

### 正确的执行步骤

1. **登录Supabase控制台**
   - 访问 https://supabase.com
   - 进入您的项目

2. **进入SQL Editor**
   - 点击左侧菜单的 "SQL Editor"

3. **按顺序执行以下SQL语句**（每次执行一个）：

#### 第1步：创建轮播图片表
```sql
CREATE TABLE IF NOT EXISTS carousel_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 第2步：创建默认内容表
```sql
CREATE TABLE IF NOT EXISTS default_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  content_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 第3步：插入默认轮播数据
```sql
INSERT INTO carousel_items (title, image, description, order_index) VALUES
('AI教学创新', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop', '探索人工智能在教育领域的无限可能', 1),
('智能学习体验', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=600&fit=crop', '打造个性化、高效的智能学习环境', 2),
('未来教育科技', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop', '引领教育数字化转型的新时代', 3),
('专业教学支持', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop', '为教师提供专业的AI教学工具和资源', 4)
ON CONFLICT DO NOTHING;
```

#### 第4步：插入默认内容数据
```sql
INSERT INTO default_content (content_type, content_data) VALUES
('carousel', '[]'),
('agents', '[]'),
('prompts', '[]'),
('teaching_resources', '[]')
ON CONFLICT DO NOTHING;
```

#### 第5步：创建索引
```sql
CREATE INDEX IF NOT EXISTS idx_carousel_order ON carousel_items(order_index);
CREATE INDEX IF NOT EXISTS idx_default_content_type ON default_content(content_type);
```

#### 第6步：设置权限
```sql
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all users" ON carousel_items FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON default_content FOR SELECT USING (true);
CREATE POLICY "Allow all operations for now" ON carousel_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON default_content FOR ALL USING (true);
```

4. **验证表创建**
```sql
SELECT * FROM carousel_items;
SELECT * FROM default_content;
```

## 问题3: 首页无法打开

### 可能原因
1. 端口冲突
2. 组件导入错误
3. 数据加载问题

### 解决方案

#### 检查端口
- 如果3000端口被占用，Next.js会自动使用3001端口
- 查看终端输出，确认正确的端口号
- 访问显示的URL（如 `http://localhost:3001`）

#### 检查控制台错误
1. 按 `F12` 打开开发者工具
2. 查看 Console 标签页是否有错误
3. 查看 Network 标签页是否有请求失败

#### 重启开发服务器
```bash
# 停止服务器 (Ctrl+C)
npm run dev
```

## 快速诊断步骤

### 1. 检查开发服务器状态
```bash
npm run dev
```
查看输出信息，确认服务器启动成功和端口号。

### 2. 检查浏览器控制台
- 按 `F12` 打开开发者工具
- 查看是否有JavaScript错误
- 查看网络请求是否正常

### 3. 清除缓存
- 按 `Ctrl + Shift + R` 强制刷新
- 或清除浏览器缓存

### 4. 验证数据库连接
- 检查 `.env.local` 文件中的Supabase配置
- 确认数据库表已正确创建

## 常见错误和解决方案

### 错误: "Cannot read properties of undefined"
**解决方案**: 检查数据加载逻辑，确保有默认值处理

### 错误: "Module not found"
**解决方案**: 检查导入路径，运行 `npm install` 重新安装依赖

### 错误: "Hydration failed"
**解决方案**: 检查服务端和客户端渲染的一致性，使用 `useEffect` 处理客户端特有逻辑

## 联系支持

如果以上解决方案都无法解决问题，请提供：
1. 浏览器控制台的错误信息截图
2. 终端的错误输出
3. 具体的操作步骤和期望结果 