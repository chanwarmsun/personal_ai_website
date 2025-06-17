-- 添加缺失的数据库表
-- 这个脚本用于在现有数据库中添加轮播表和默认内容表

-- 创建轮播图表（如果不存在）
CREATE TABLE IF NOT EXISTS carousel_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建默认内容表（如果不存在）
CREATE TABLE IF NOT EXISTS default_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_carousel_items_order ON carousel_items(order_index);
CREATE INDEX IF NOT EXISTS idx_default_content_type ON default_content(content_type);

-- 启用行级安全策略（RLS）
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_content ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略
DROP POLICY IF EXISTS "Allow all operations on carousel_items" ON carousel_items;
DROP POLICY IF EXISTS "Allow all operations on default_content" ON default_content;

CREATE POLICY "Allow all operations on carousel_items" ON carousel_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on default_content" ON default_content FOR ALL USING (true);

-- 添加一些示例数据（可选）
INSERT INTO default_content (content_type, content_data, updated_at) 
VALUES ('website_default', '{
  "agents": [
    {
      "id": "default-1",
      "name": "AI写作助手",
      "description": "专业的AI写作工具，帮助您快速生成高质量文章",
      "image": "https://via.placeholder.com/400x200",
      "type": "chat",
      "url": "https://chatgpt.com",
      "tags": ["写作", "教育", "AI"]
    }
  ],
  "prompts": [
    {
      "id": "default-1",
      "title": "学生作业批改",
      "description": "智能批改学生作业，提供详细反馈",
      "content": "请作为一名经验丰富的教师，批改以下学生作业...",
      "tags": ["教育", "批改"],
      "downloads": 0
    }
  ],
  "teachingResources": [
    {
      "id": "default-1",
      "title": "AI教育入门指南",
      "description": "全面介绍AI在教育领域的应用",
      "type": "课件",
      "difficulty": "教师用",
      "size": "2.5MB",
      "downloadUrl": "https://example.com/ai-education-guide.pdf",
      "downloads": 0
    }
  ]
}', NOW())
ON CONFLICT DO NOTHING; 