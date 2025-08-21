const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugCreateOperations() {
  console.log('🐛 开始调试创建操作...')
  
  // 测试智能体创建
  console.log('\n1️⃣ 测试智能体创建')
  try {
    const testAgent = {
      name: '调试智能体',
      description: '这是一个调试用的智能体',
      image: 'https://via.placeholder.com/150',
      type: 'chat',
      url: 'https://test.com',
      tags: ['调试', '测试']
    }
    
    console.log('📝 准备创建的智能体数据:', testAgent)
    
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .insert([testAgent])
      .select()
      .single()
    
    if (agentError) {
      console.error('❌ 智能体创建失败:')
      console.error('  错误码:', agentError.code)
      console.error('  错误信息:', agentError.message)
      console.error('  详细信息:', agentError.details)
      console.error('  提示:', agentError.hint)
    } else {
      console.log('✅ 智能体创建成功:', agentData)
      
      // 立即删除测试数据
      await supabase.from('agents').delete().eq('id', agentData.id)
      console.log('🗑️ 测试数据已清理')
    }
  } catch (error) {
    console.error('💥 智能体创建异常:', error)
  }
  
  // 测试提示词创建
  console.log('\n2️⃣ 测试提示词创建')
  try {
    const testPrompt = {
      title: '调试提示词',
      description: '这是一个调试用的提示词',
      content: '你是一个专业的AI助手，请帮助用户解答问题。',
      tags: ['调试', '测试'],
      downloads: 0
    }
    
    console.log('📝 准备创建的提示词数据:', testPrompt)
    
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .insert([testPrompt])
      .select()
      .single()
    
    if (promptError) {
      console.error('❌ 提示词创建失败:')
      console.error('  错误码:', promptError.code)
      console.error('  错误信息:', promptError.message)
      console.error('  详细信息:', promptError.details)
      console.error('  提示:', promptError.hint)
    } else {
      console.log('✅ 提示词创建成功:', promptData)
      
      // 立即删除测试数据
      await supabase.from('prompts').delete().eq('id', promptData.id)
      console.log('🗑️ 测试数据已清理')
    }
  } catch (error) {
    console.error('💥 提示词创建异常:', error)
  }
  
  // 测试教学资源创建
  console.log('\n3️⃣ 测试教学资源创建')
  try {
    const testResource = {
      title: '调试教学资源',
      description: '这是一个调试用的教学资源',
      type: '课件',
      difficulty: '教师用',
      size: '10MB',
      download_url: 'https://test.com/resource.pdf',
      downloads: 0
    }
    
    console.log('📝 准备创建的教学资源数据:', testResource)
    
    const { data: resourceData, error: resourceError } = await supabase
      .from('teaching_resources')
      .insert([testResource])
      .select()
      .single()
    
    if (resourceError) {
      console.error('❌ 教学资源创建失败:')
      console.error('  错误码:', resourceError.code)
      console.error('  错误信息:', resourceError.message)
      console.error('  详细信息:', resourceError.details)
      console.error('  提示:', resourceError.hint)
    } else {
      console.log('✅ 教学资源创建成功:', resourceData)
      
      // 立即删除测试数据
      await supabase.from('teaching_resources').delete().eq('id', resourceData.id)
      console.log('🗑️ 测试数据已清理')
    }
  } catch (error) {
    console.error('💥 教学资源创建异常:', error)
  }
  
  // 检查表结构
  console.log('\n4️⃣ 检查表结构')
  try {
    // 检查agents表结构
    console.log('📋 检查agents表结构:')
    const { data: agentsSchema, error: agentsSchemaError } = await supabase
      .from('agents')
      .select('*')
      .limit(0)
    
    if (agentsSchemaError) {
      console.error('agents表查询错误:', agentsSchemaError)
    } else {
      console.log('agents表可正常访问')
    }
    
    // 检查prompts表结构
    console.log('📋 检查prompts表结构:')
    const { data: promptsSchema, error: promptsSchemaError } = await supabase
      .from('prompts')
      .select('*')
      .limit(0)
    
    if (promptsSchemaError) {
      console.error('prompts表查询错误:', promptsSchemaError)
    } else {
      console.log('prompts表可正常访问')
    }
    
    // 检查teaching_resources表结构
    console.log('📋 检查teaching_resources表结构:')
    const { data: resourcesSchema, error: resourcesSchemaError } = await supabase
      .from('teaching_resources')
      .select('*')
      .limit(0)
    
    if (resourcesSchemaError) {
      console.error('teaching_resources表查询错误:', resourcesSchemaError)
    } else {
      console.log('teaching_resources表可正常访问')
    }
  } catch (error) {
    console.error('💥 表结构检查异常:', error)
  }
  
  console.log('\n🎉 调试操作完成！')
}

debugCreateOperations() 