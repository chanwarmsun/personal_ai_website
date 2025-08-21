// 测试数据库连接的简单脚本
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 测试数据库连接...')
  
  try {
    // 测试agents表
    console.log('📋 测试agents表...')
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(5)
    
    if (agentsError) {
      console.error('❌ agents表错误:', agentsError)
    } else {
      console.log('✅ agents表连接成功，数据条数:', agents.length)
    }

    // 测试创建一个智能体
    console.log('🧪 测试创建智能体...')
    const testAgent = {
      name: '测试智能体',
      description: '这是一个测试智能体',
      image: '/test.png',
      type: 'chat',
      url: 'https://example.com',
      tags: ['测试', '智能体']
    }

    const { data: newAgent, error: createError } = await supabase
      .from('agents')
      .insert([testAgent])
      .select()
      .single()

    if (createError) {
      console.error('❌ 创建智能体失败:', createError)
    } else {
      console.log('✅ 创建智能体成功:', newAgent)
      
      // 删除测试数据
      const { error: deleteError } = await supabase
        .from('agents')
        .delete()
        .eq('id', newAgent.id)
      
      if (deleteError) {
        console.error('❌ 删除测试数据失败:', deleteError)
      } else {
        console.log('✅ 清理测试数据成功')
      }
    }

  } catch (error) {
    console.error('❌ 数据库连接异常:', error)
  }
}

testConnection() 