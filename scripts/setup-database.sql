-- 删除现有表（如果存在）
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS teaching_resources CASCADE;
DROP TABLE IF EXISTS custom_requests CASCADE;
DROP TABLE IF EXISTS carousel_items CASCADE;
DROP TABLE IF EXISTS default_content CASCADE;

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

-- 创建定制需求表
CREATE TABLE custom_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('agent', 'prompt', 'resource')),
  name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  description TEXT,
  requirements TEXT,
  urgency TEXT,
  contact TEXT,
  status TEXT DEFAULT '待处理' CHECK (status IN ('待处理', '处理中', '已完成', '已取消')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建轮播图表
CREATE TABLE carousel_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建默认内容表
CREATE TABLE default_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_agents_created_at ON agents(created_at);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
CREATE INDEX idx_teaching_resources_created_at ON teaching_resources(created_at);
CREATE INDEX idx_custom_requests_created_at ON custom_requests(created_at);
CREATE INDEX idx_custom_requests_status ON custom_requests(status);
CREATE INDEX idx_carousel_items_order ON carousel_items(order_index);
CREATE INDEX idx_default_content_type ON default_content(content_type);

-- 启用行级安全策略（RLS）
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_content ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（在生产环境中应该更严格）
CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on prompts" ON prompts FOR ALL USING (true);
CREATE POLICY "Allow all operations on teaching_resources" ON teaching_resources FOR ALL USING (true);
CREATE POLICY "Allow all operations on custom_requests" ON custom_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations on carousel_items" ON carousel_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on default_content" ON default_content FOR ALL USING (true); 