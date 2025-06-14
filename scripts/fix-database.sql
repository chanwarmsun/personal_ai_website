-- 修复现有数据库的SQL脚本
-- 这个脚本会添加缺失的字段而不删除现有数据

-- 1. 禁用RLS策略（解决插入数据问题）
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests DISABLE ROW LEVEL SECURITY;

-- 2. 为agents表添加缺失的字段
DO $$ 
BEGIN
    -- 添加tags字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='tags') THEN
        ALTER TABLE agents ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;
    
    -- 添加created_at字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='created_at') THEN
        ALTER TABLE agents ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. 为prompts表添加缺失的字段
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prompts' AND column_name='content') THEN
        ALTER TABLE prompts ADD COLUMN content TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prompts' AND column_name='tags') THEN
        ALTER TABLE prompts ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prompts' AND column_name='downloads') THEN
        ALTER TABLE prompts ADD COLUMN downloads INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prompts' AND column_name='created_at') THEN
        ALTER TABLE prompts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. 为teaching_resources表添加缺失的字段
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teaching_resources' AND column_name='difficulty') THEN
        ALTER TABLE teaching_resources ADD COLUMN difficulty TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teaching_resources' AND column_name='size') THEN
        ALTER TABLE teaching_resources ADD COLUMN size TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teaching_resources' AND column_name='download_url') THEN
        ALTER TABLE teaching_resources ADD COLUMN download_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teaching_resources' AND column_name='downloads') THEN
        ALTER TABLE teaching_resources ADD COLUMN downloads INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teaching_resources' AND column_name='created_at') THEN
        ALTER TABLE teaching_resources ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 5. 为custom_requests表添加缺失的字段
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='custom_requests' AND column_name='requirements') THEN
        ALTER TABLE custom_requests ADD COLUMN requirements TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='custom_requests' AND column_name='urgency') THEN
        ALTER TABLE custom_requests ADD COLUMN urgency TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='custom_requests' AND column_name='contact') THEN
        ALTER TABLE custom_requests ADD COLUMN contact TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='custom_requests' AND column_name='status') THEN
        ALTER TABLE custom_requests ADD COLUMN status TEXT DEFAULT '待处理';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='custom_requests' AND column_name='created_at') THEN
        ALTER TABLE custom_requests ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 6. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_created_at ON teaching_resources(created_at);
CREATE INDEX IF NOT EXISTS idx_custom_requests_created_at ON custom_requests(created_at);

-- 完成提示
SELECT 'Database fix completed successfully!' as message; 