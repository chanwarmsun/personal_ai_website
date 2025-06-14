// 数据库迁移脚本
// 运行前请先配置好 Supabase 项目

import { supabase } from '../lib/supabase'

// 创建数据库表的SQL
export const createTablesSQL = `
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
`

// 迁移localStorage数据到Supabase
export async function migrateLocalStorageData() {
  try {
    // 1. 迁移智能体数据
    const customAgents = JSON.parse(localStorage.getItem('custom_agents') || '[]')
    if (customAgents.length > 0) {
      const { error: agentsError } = await supabase
        .from('agents')
        .insert(customAgents)
      
      if (agentsError) {
        console.error('迁移智能体数据失败:', agentsError)
      } else {
        console.log(`成功迁移 ${customAgents.length} 个智能体`)
      }
    }

    // 2. 迁移提示词数据
    const customPrompts = JSON.parse(localStorage.getItem('custom_prompts') || '[]')
    if (customPrompts.length > 0) {
      const { error: promptsError } = await supabase
        .from('prompts')
        .insert(customPrompts)
      
      if (promptsError) {
        console.error('迁移提示词数据失败:', promptsError)
      } else {
        console.log(`成功迁移 ${customPrompts.length} 个提示词`)
      }
    }

    // 3. 迁移教学资源数据
    const customResources = JSON.parse(localStorage.getItem('custom_resources') || '[]')
    if (customResources.length > 0) {
      const { error: resourcesError } = await supabase
        .from('teaching_resources')
        .insert(customResources.map((item: any) => ({
          ...item,
          download_url: item.downloadUrl // 字段名转换
        })))
      
      if (resourcesError) {
        console.error('迁移教学资源数据失败:', resourcesError)
      } else {
        console.log(`成功迁移 ${customResources.length} 个教学资源`)
      }
    }

    // 4. 迁移定制申请数据
    const customRequests = JSON.parse(localStorage.getItem('custom_requests') || '[]')
    if (customRequests.length > 0) {
      const { error: requestsError } = await supabase
        .from('custom_requests')
        .insert(customRequests)
      
      if (requestsError) {
        console.error('迁移定制申请数据失败:', requestsError)
      } else {
        console.log(`成功迁移 ${customRequests.length} 个定制申请`)
      }
    }

    console.log('数据迁移完成！')
    
  } catch (error) {
    console.error('数据迁移失败:', error)
  }
}

// 使用示例：
// 1. 在 Supabase SQL Editor 中执行 createTablesSQL
// 2. 在浏览器控制台运行 migrateLocalStorageData() 