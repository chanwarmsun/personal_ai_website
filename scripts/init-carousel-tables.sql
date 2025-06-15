-- 创建轮播图片表
CREATE TABLE IF NOT EXISTS carousel_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建默认内容表
CREATE TABLE IF NOT EXISTS default_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  content_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认的轮播数据
INSERT INTO carousel_items (title, image, description, order_index) VALUES
('AI教学创新', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop', '探索人工智能在教育领域的无限可能', 1),
('智能学习体验', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=600&fit=crop', '打造个性化、高效的智能学习环境', 2),
('未来教育科技', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop', '引领教育数字化转型的新时代', 3),
('专业教学支持', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop', '为教师提供专业的AI教学工具和资源', 4)
ON CONFLICT DO NOTHING;

-- 插入默认内容数据
INSERT INTO default_content (content_type, content_data) VALUES
('carousel', '[]'),
('agents', '[]'),
('prompts', '[]'),
('teaching_resources', '[]')
ON CONFLICT DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_carousel_order ON carousel_items(order_index);
CREATE INDEX IF NOT EXISTS idx_default_content_type ON default_content(content_type);

-- 设置RLS (Row Level Security)
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_content ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有用户读取，但只有认证用户可以修改）
CREATE POLICY "Allow read access for all users" ON carousel_items FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON default_content FOR SELECT USING (true);

-- 暂时允许所有操作（在生产环境中应该更严格）
CREATE POLICY "Allow all operations for now" ON carousel_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON default_content FOR ALL USING (true); 