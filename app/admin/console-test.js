// 在浏览器控制台中运行此脚本来测试数据库操作
// 复制粘贴以下代码到管理后台页面的浏览器控制台中

async function testDatabaseOperations() {
  console.log('🧪 开始测试数据库操作...')
  
  // 测试智能体创建
  console.log('\n1. 测试智能体创建...')
  try {
    const testAgent = {
      name: '测试智能体',
      description: '这是一个测试智能体',
      image: 'https://via.placeholder.com/150',
      type: 'chat',
      url: 'https://test.com',
      tags: ['测试', '智能体']
    }
    
    const { agentOperations } = await import('/lib/database.js')
    const createdAgent = await agentOperations.create(testAgent)
    
    if (createdAgent) {
      console.log('✅ 智能体创建成功:', createdAgent)
      
      // 验证是否能查询到
      const allAgents = await agentOperations.getAll()
      console.log('📊 当前智能体总数:', allAgents.length)
      
      // 清理测试数据
      const deleted = await agentOperations.delete(createdAgent.id)
      console.log('🗑️ 测试数据清理:', deleted ? '成功' : '失败')
    } else {
      console.error('❌ 智能体创建失败')
    }
  } catch (error) {
    console.error('💥 智能体操作异常:', error)
  }
  
  // 测试提示词创建
  console.log('\n2. 测试提示词创建...')
  try {
    const testPrompt = {
      title: '测试提示词',
      description: '这是一个测试提示词',
      content: '你是一个有用的AI助手...',
      tags: ['测试', '提示词'],
      downloads: 0
    }
    
    const { promptOperations } = await import('/lib/database.js')
    const createdPrompt = await promptOperations.create(testPrompt)
    
    if (createdPrompt) {
      console.log('✅ 提示词创建成功:', createdPrompt)
      
      // 验证是否能查询到
      const allPrompts = await promptOperations.getAll()
      console.log('📊 当前提示词总数:', allPrompts.length)
      
      // 清理测试数据
      const deleted = await promptOperations.delete(createdPrompt.id)
      console.log('🗑️ 测试数据清理:', deleted ? '成功' : '失败')
    } else {
      console.error('❌ 提示词创建失败')
    }
  } catch (error) {
    console.error('💥 提示词操作异常:', error)
  }
  
  // 测试教学资源创建
  console.log('\n3. 测试教学资源创建...')
  try {
    const testResource = {
      title: '测试教学资源',
      description: '这是一个测试教学资源',
      type: '课件',
      difficulty: '教师用',
      size: '10MB',
      download_url: 'https://test.com/resource.pdf',
      downloads: 0
    }
    
    const { resourceOperations } = await import('/lib/database.js')
    const createdResource = await resourceOperations.create(testResource)
    
    if (createdResource) {
      console.log('✅ 教学资源创建成功:', createdResource)
      
      // 验证是否能查询到
      const allResources = await resourceOperations.getAll()
      console.log('📊 当前教学资源总数:', allResources.length)
      
      // 清理测试数据
      const deleted = await resourceOperations.delete(createdResource.id)
      console.log('🗑️ 测试数据清理:', deleted ? '成功' : '失败')
    } else {
      console.error('❌ 教学资源创建失败')
    }
  } catch (error) {
    console.error('💥 教学资源操作异常:', error)
  }
  
  console.log('\n🎉 数据库操作测试完成！')
}

// 调用测试函数
testDatabaseOperations() 