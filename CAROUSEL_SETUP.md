# 轮播和默认内容数据库设置

## 概述
本文档说明如何为个人IP网站设置轮播图片和默认内容的数据库支持。

## 数据库表结构

### 1. 轮播图片表 (carousel_items)
```sql
CREATE TABLE carousel_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 默认内容表 (default_content)
```sql
CREATE TABLE default_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  content_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 设置步骤

### 1. 在Supabase控制台中执行SQL
1. 登录到你的Supabase项目控制台
2. 进入 SQL Editor
3. 复制并执行 `scripts/init-carousel-tables.sql` 文件中的所有SQL语句

### 2. 验证表创建
执行以下查询验证表是否创建成功：
```sql
SELECT * FROM carousel_items;
SELECT * FROM default_content;
```

### 3. 检查权限设置
确保RLS (Row Level Security) 策略已正确设置，允许读取和写入操作。

## 功能说明

### 轮播管理
- ✅ 支持从数据库加载轮播图片
- ✅ 支持新增、编辑、删除轮播项
- ✅ 自动回退到localStorage（如果数据库不可用）
- ✅ 支持图片上传和URL输入

### 默认内容管理
- ✅ 支持编辑智能体、提示词、教学资源的默认内容
- ✅ 数据保存到数据库和localStorage双重备份
- ✅ 支持完整的内容编辑（标题、描述、链接等）

## 管理后台功能

### 已修复的问题
1. ✅ 轮播管理现在支持编辑已有照片
2. ✅ 默认内容管理支持修改所有字段（不仅仅是名称）
3. ✅ 修复了form.tags undefined错误
4. ✅ 集成了数据库存储功能

### 新增功能
- 轮播图片的数据库持久化存储
- 默认内容的数据库备份
- 完整的CRUD操作支持
- 错误处理和回退机制

## 使用说明

### 轮播管理
1. 进入管理后台 → 轮播管理
2. 可以上传图片文件或输入图片URL
3. 填写标题和描述
4. 点击"新增轮播"或"保存修改"
5. 支持编辑和删除现有轮播项

### 默认内容管理
1. 进入管理后台 → 默认内容
2. 点击任意项目的"编辑内容"按钮
3. 依次输入新的标题、描述、链接等信息
4. 修改会立即保存到数据库

## 注意事项

1. **数据库优先**: 系统会优先从数据库加载数据，如果数据库不可用会回退到localStorage
2. **双重备份**: 所有数据都会同时保存到数据库和localStorage
3. **权限设置**: 确保Supabase中的RLS策略允许必要的操作
4. **图片存储**: 建议使用CDN或图床服务存储图片，数据库只存储URL

## 故障排除

### 如果轮播不显示
1. 检查Supabase连接是否正常
2. 查看浏览器控制台是否有错误信息
3. 确认数据库表是否正确创建
4. 检查RLS策略是否允许读取操作

### 如果无法保存数据
1. 检查Supabase写入权限
2. 确认网络连接正常
3. 查看控制台错误信息
4. 数据会自动保存到localStorage作为备份

## 技术实现

- 使用Supabase作为数据库
- TypeScript类型安全
- 错误处理和回退机制
- 响应式UI设计
- 实时数据同步 