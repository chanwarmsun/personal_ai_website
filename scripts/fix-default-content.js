const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgzNTIyMiwiZXhwIjoyMDY1NDExMjIyfQ.QIdZnqhm4xPZaXkmP1o_Q-qAKBRgxT69WNMdL8j1dEo'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

// 创建管理员客户端（使用service role key）
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 创建普通客户端（使用anon key）
const normalClient = createClient(supabaseUrl, supabaseAnonKey)

async function checkAndFixDefaultContent() {
  console.log('🔍 开始诊断默认内容保存问题...\n')

  // 1. 检查数据库连接
  console.log('1️⃣ 检查数据库连接状态...')
  try {
    const { data: pingData, error: pingError } = await normalClient
      .from('agents')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (pingError) {
      console.error('❌ 数据库连接失败:', pingError.message)
      console.log('🔄 尝试唤醒数据库...')
      
      // 尝试多次连接以唤醒数据库
      for (let i = 0; i < 3; i++) {
        console.log(`   尝试 ${i + 1}/3...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          await normalClient.from('agents').select('id').limit(1)
          console.log('✅ 数据库已唤醒')
          break
        } catch (e) {
          console.log('   唤醒失败，继续尝试...')
        }
      }
    } else {
      console.log('✅ 数据库连接正常')
    }
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message)
  }

  // 2. 检查default_content表是否存在
  console.log('\n2️⃣ 检查default_content表是否存在...')
  try {
    const { data: tableData, error: tableError } = await normalClient
      .from('default_content')
      .select('id')
      .limit(1)
    
    if (tableError) {
      if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
        console.log('❌ default_content表不存在，开始创建...')
        await createDefaultContentTable()
      } else {
        console.error('❌ 表检查失败:', tableError.message)
      }
    } else {
      console.log('✅ default_content表存在')
    }
  } catch (error) {
    console.error('❌ 表检查异常:', error.message)
  }

  // 3. 检查表权限
  console.log('\n3️⃣ 检查表权限...')
  try {
    // 尝试插入测试数据
    const testData = {
      content_type: 'test_permission',
      content_data: { test: true },
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData, error: insertError } = await normalClient
      .from('default_content')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.error('❌ 写入权限测试失败:', insertError.message)
      console.log('🔧 尝试修复权限问题...')
      await fixPermissions()
    } else {
      console.log('✅ 写入权限正常')
      
      // 清理测试数据
      if (insertData && insertData.length > 0) {
        await normalClient
          .from('default_content')
          .delete()
          .eq('content_type', 'test_permission')
      }
    }
  } catch (error) {
    console.error('❌ 权限检查异常:', error.message)
  }

  // 4. 测试完整的保存功能
  console.log('\n4️⃣ 测试完整的保存功能...')
  try {
    const testContent = {
      agents: [{ id: 'test-1', name: '测试智能体', description: '这是一个测试' }],
      prompts: [],
      teachingResources: [],
      carousel: []
    }
    
    // 测试保存
    const saveResult = await saveDefaultContent('website_default', testContent)
    if (saveResult) {
      console.log('✅ 保存功能测试成功')
      
      // 测试读取
      const loadResult = await loadDefaultContent('website_default')
      if (loadResult) {
        console.log('✅ 读取功能测试成功')
        console.log('📄 测试数据:', JSON.stringify(loadResult, null, 2))
      } else {
        console.log('❌ 读取功能测试失败')
      }
    } else {
      console.log('❌ 保存功能测试失败')
    }
  } catch (error) {
    console.error('❌ 保存功能测试异常:', error.message)
  }

  console.log('\n🎉 诊断完成！')
}

async function createDefaultContentTable() {
  try {
    const { error } = await adminClient.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS default_content (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          content_type TEXT NOT NULL,
          content_data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_default_content_type ON default_content(content_type);
        
        ALTER TABLE default_content ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Allow all operations on default_content" 
        ON default_content FOR ALL USING (true);
      `
    })
    
    if (error) {
      console.error('❌ 创建表失败:', error.message)
    } else {
      console.log('✅ default_content表创建成功')
    }
  } catch (error) {
    console.log('⚠️ 使用管理员权限创建表失败，尝试直接SQL创建...')
    
    // 备用方案：直接执行SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS default_content (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content_type TEXT NOT NULL,
        content_data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    try {
      const { error: sqlError } = await adminClient.sql(createTableSQL)
      if (sqlError) {
        console.error('❌ SQL创建表失败:', sqlError.message)
      } else {
        console.log('✅ 使用SQL成功创建表')
      }
    } catch (sqlError) {
      console.error('❌ 所有创建表方法都失败了:', sqlError.message)
    }
  }
}

async function fixPermissions() {
  try {
    const { error } = await adminClient.rpc('execute_sql', {
      sql: `
        ALTER TABLE default_content ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow all operations on default_content" ON default_content;
        
        CREATE POLICY "Allow all operations on default_content" 
        ON default_content FOR ALL USING (true);
      `
    })
    
    if (error) {
      console.error('❌ 修复权限失败:', error.message)
    } else {
      console.log('✅ 权限修复成功')
    }
  } catch (error) {
    console.error('❌ 权限修复异常:', error.message)
  }
}

async function saveDefaultContent(contentType, contentData) {
  try {
    // 先检查是否已存在
    const { data: existing, error: selectError } = await normalClient
      .from('default_content')
      .select('id')
      .eq('content_type', contentType)
      .limit(1)
    
    if (selectError) {
      console.error('查询现有记录失败:', selectError.message)
      return false
    }
    
    if (existing && existing.length > 0) {
      // 更新现有记录
      const { error: updateError } = await normalClient
        .from('default_content')
        .update({
          content_data: contentData,
          updated_at: new Date().toISOString()
        })
        .eq('content_type', contentType)
      
      if (updateError) {
        console.error('更新记录失败:', updateError.message)
        return false
      }
    } else {
      // 创建新记录
      const { error: insertError } = await normalClient
        .from('default_content')
        .insert({
          content_type: contentType,
          content_data: contentData,
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('创建记录失败:', insertError.message)
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('保存操作异常:', error.message)
    return false
  }
}

async function loadDefaultContent(contentType) {
  try {
    const { data, error } = await normalClient
      .from('default_content')
      .select('content_data')
      .eq('content_type', contentType)
      .order('updated_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('加载内容失败:', error.message)
      return null
    }
    
    return data && data.length > 0 ? data[0].content_data : null
  } catch (error) {
    console.error('加载操作异常:', error.message)
    return null
  }
}

// 运行诊断
checkAndFixDefaultContent().catch(console.error) 