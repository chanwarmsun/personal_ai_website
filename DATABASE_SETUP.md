# Supabase 数据库设置指南

## 1. 数据库配置

项目已配置连接到您的Supabase数据库：
- **Project URL**: https://mvrikhctrwowswcamkfj.supabase.co
- **API Key**: 已在代码中配置

## 2. 创建数据表

在Supabase控制台的SQL Editor中执行以下SQL语句来创建必要的数据表：

```sql
-- 创建智能体表
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  type TEXT CHECK (type IN ('chat', 'download')),
  url TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建提示词表  
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  tags JSONB DEFAULT '[]',
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建教学资源表
CREATE TABLE teaching_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  difficulty TEXT,
  size TEXT,
  download_url TEXT,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建定制申请表
CREATE TABLE custom_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('agent', 'prompt', 'resource')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  urgency TEXT,
  contact TEXT,
  status TEXT DEFAULT '待处理' CHECK (status IN ('待处理', '处理中', '已完成', '已取消')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_prompts_downloads ON prompts(downloads DESC);
CREATE INDEX idx_resources_type ON teaching_resources(type);
CREATE INDEX idx_requests_status ON custom_requests(status);
CREATE INDEX idx_requests_type ON custom_requests(type);
```

## 3. 初始化数据

创建表后，在浏览器控制台中运行以下命令来初始化基础数据：

```javascript
// 在浏览器控制台中执行
initializeDatabase()
```

这将会：
- 测试数据库连接
- 将content.json中的数据导入到数据库
- 初始化智能体、提示词和教学资源数据

## 4. 数据库操作

项目提供了完整的数据库操作函数：

### 智能体操作
```javascript
import { agentOperations } from './lib/database'

// 获取所有智能体
const agents = await agentOperations.getAll()

// 创建智能体
const newAgent = await agentOperations.create({
  name: '新智能体',
  description: '描述',
  image: '图片URL',
  type: 'chat',
  url: '链接',
  tags: ['标签1', '标签2']
})

// 更新智能体
const updatedAgent = await agentOperations.update('id', { name: '新名称' })

// 删除智能体
const success = await agentOperations.delete('id')
```

### 提示词操作
```javascript
import { promptOperations } from './lib/database'

// 获取所有提示词
const prompts = await promptOperations.getAll()

// 创建提示词
const newPrompt = await promptOperations.create({
  title: '标题',
  description: '描述',
  content: '内容',
  tags: ['标签'],
  downloads: 0
})
```

### 教学资源操作
```javascript
import { resourceOperations } from './lib/database'

// 获取所有教学资源
const resources = await resourceOperations.getAll()

// 创建教学资源
const newResource = await resourceOperations.create({
  title: '标题',
  description: '描述',
  type: '类型',
  difficulty: '难度',
  size: '大小',
  downloadUrl: '下载链接',
  downloads: 0
})
```

### 定制需求操作
```javascript
import { requestOperations } from './lib/database'

// 获取所有定制需求
const requests = await requestOperations.getAll()

// 创建定制需求
const newRequest = await requestOperations.create({
  type: 'agent',
  name: '用户名',
  email: '邮箱',
  title: '标题',
  description: '描述',
  requirements: '需求',
  urgency: '紧急程度',
  status: '待处理'
})

// 更新状态
const updated = await requestOperations.updateStatus('id', '处理中')
```

## 5. 数据迁移

如果您之前使用localStorage存储数据，可以使用迁移脚本：

```javascript
import { migrateLocalStorageData } from './scripts/migrate-to-supabase'

// 在浏览器控制台中执行
migrateLocalStorageData()
```

## 6. 测试连接

```javascript
import { testConnection } from './lib/database'

// 测试数据库连接
const isConnected = await testConnection()
console.log('数据库连接状态:', isConnected)
```

## 注意事项

1. 确保在Supabase控制台中正确设置了RLS（行级安全）策略
2. 如果需要公开访问，请在Supabase中设置相应的策略
3. 定期备份数据库数据
4. 监控数据库使用量，避免超出免费额度 