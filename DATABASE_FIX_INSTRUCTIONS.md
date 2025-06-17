# 数据库修复说明

## 问题描述
当前存在两个主要问题：
1. **默认内容修改无法保存到数据库** - 缺少 `default_content` 表
2. **文件下载格式错误** - Base64编码处理问题

## 解决方案

### 步骤1：在Supabase中添加缺失的表

1. 登录 [Supabase控制台](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 "SQL Editor"
4. 复制并执行以下SQL代码：

```sql
-- 创建轮播图表
CREATE TABLE IF NOT EXISTS carousel_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建默认内容表
CREATE TABLE IF NOT EXISTS default_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_carousel_items_order ON carousel_items(order_index);
CREATE INDEX IF NOT EXISTS idx_default_content_type ON default_content(content_type);

-- 启用行级安全策略
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_content ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
CREATE POLICY "Allow all operations on carousel_items" ON carousel_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on default_content" ON default_content FOR ALL USING (true);
```

### 步骤2：验证表创建

在SQL Editor中执行以下查询来验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('carousel_items', 'default_content');

-- 检查表结构
\d carousel_items
\d default_content
```

### 步骤3：重启开发服务器

在终端中重启开发服务器：

```bash
npm run dev
```

## 修复内容

### 1. 默认内容管理修复
- ✅ 添加了 `default_content` 表
- ✅ 修复了默认内容保存逻辑
- ✅ 支持默认智能体、提示词、教学资源的数据库存储

### 2. 文件下载修复
- ✅ 修复了Base64编码文件的下载处理
- ✅ 添加了 `DownloadButton` 组件
- ✅ 支持正确的文件名和格式保持

### 3. 字段映射修复
- ✅ 修复了创建操作中的字段映射错误
- ✅ 确保只传递数据库表中存在的字段
- ✅ 添加了类型安全的数据验证

## 测试验证

执行以下步骤验证修复效果：

1. **测试默认内容修改**：
   - 访问 `/admin` → 默认内容管理
   - 编辑任一默认内容项
   - 保存后检查数据库是否更新

2. **测试文件上传下载**：
   - 在教学资源中上传一个ZIP文件
   - 保存后在前端下载该文件
   - 验证下载的文件格式正确

3. **测试创建功能**：
   - 分别测试智能体、提示词、教学资源的创建
   - 确认无字段映射错误

## 注意事项

- 如果在Supabase控制台中执行SQL时遇到权限问题，请确保您是项目管理员
- 表创建完成后，可能需要刷新浏览器缓存
- 如果问题仍然存在，可以查看浏览器控制台的详细错误信息

## 备份说明

执行数据库操作前，建议：
1. 导出现有数据作为备份
2. 在测试环境中先验证修复效果
3. 确认无误后再在生产环境执行 