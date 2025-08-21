const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('🔍 开始数据库连接测试...')
  
  try {
    // 1. 测试基本连接
    console.log('\n1. 测试基本连接...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('agents')
      .select('count', { count: 'exact' })
    
    if (connectionError) {
      console.error('❌ 连接失败:', connectionError)
      return
    }
    console.log('✅ 数据库连接成功')
    
    // 2. 测试查询权限
    console.log('\n2. 测试查询权限...')
    const { data: queryData, error: queryError } = await supabase
      .from('agents')
      .select('*')
      .limit(1)
    
    if (queryError) {
      console.error('❌ 查询失败:', queryError)
    } else {
      console.log('✅ 查询权限正常，当前数据条数:', queryData?.length || 0)
      if (queryData?.length > 0) {
        console.log('📊 示例数据:', queryData[0])
      }
    }
    
    // 3. 测试插入权限
    console.log('\n3. 测试插入权限...')
    const testAgent = {
      name: '测试智能体_' + Date.now(),
      description: '这是一个测试数据',
      image: 'https://example.com/test.jpg',
      type: 'chat',
      url: 'https://example.com',
      tags: ['测试']
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('agents')
      .insert([testAgent])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ 插入失败:', insertError)
      console.log('🔍 错误详情:')
      console.log('  - 错误代码:', insertError.code)
      console.log('  - 错误消息:', insertError.message)
      console.log('  - 详细信息:', insertError.details)
      console.log('  - 提示:', insertError.hint)
      
      if (insertError.message.includes('row-level security')) {
        console.log('\n🚨 检测到RLS策略问题！')
        console.log('请在Supabase控制台执行以下SQL来修复：')
        console.log('ALTER TABLE agents DISABLE ROW LEVEL SECURITY;')
        console.log('ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;')
        console.log('ALTER TABLE teaching_resources DISABLE ROW LEVEL SECURITY;')
        console.log('ALTER TABLE custom_requests DISABLE ROW LEVEL SECURITY;')
      }
    } else {
      console.log('✅ 插入成功:', insertData)
      
      // 4. 清理测试数据
      console.log('\n4. 清理测试数据...')
      const { error: deleteError } = await supabase
        .from('agents')
        .delete()
        .eq('id', insertData.id)
      
      if (deleteError) {
        console.error('❌ 删除测试数据失败:', deleteError)
      } else {
        console.log('✅ 测试数据清理完成')
      }
    }
    
    // 5. 测试所有表
    console.log('\n5. 测试所有表的权限...')
    const tables = ['agents', 'prompts', 'teaching_resources', 'custom_requests']
    
    for (const table of tables) {
      console.log(`\n测试表: ${table}`)
      
      // 查询测试
      const { data, error: selectError } = await supabase
        .from(table)
        .select('count', { count: 'exact' })
      
      if (selectError) {
        console.error(`❌ ${table} 查询失败:`, selectError.message)
      } else {
        console.log(`✅ ${table} 查询成功，数据条数: ${data?.[0]?.count || 0}`)
      }
    }
    
  } catch (error) {
    console.error('💥 测试过程中发生异常:', error)
  }
}

testDatabase() 