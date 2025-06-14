import { testConnection } from '../lib/database'
import { supabase } from '../lib/supabase'
import contentData from '../data/content.json'

// 初始化数据库数据
export async function initializeDatabase() {
  console.log('开始初始化数据库...')
  
  // 1. 测试连接
  const isConnected = await testConnection()
  if (!isConnected) {
    console.error('数据库连接失败，请检查配置')
    return false
  }

  try {
    // 2. 初始化智能体数据
    console.log('初始化智能体数据...')
    const { data: existingAgents } = await supabase.from('agents').select('id')
    
    if (!existingAgents || existingAgents.length === 0) {
      const agentsToInsert = contentData.agents.map(agent => ({
        name: agent.name,
        description: agent.description,
        image: agent.image,
        type: agent.type,
        url: agent.url,
        tags: agent.tags
      }))

      const { error: agentsError } = await supabase
        .from('agents')
        .insert(agentsToInsert)

      if (agentsError) {
        console.error('初始化智能体数据失败:', agentsError)
      } else {
        console.log(`成功初始化 ${agentsToInsert.length} 个智能体`)
      }
    } else {
      console.log('智能体数据已存在，跳过初始化')
    }

    // 3. 初始化提示词数据
    console.log('初始化提示词数据...')
    const { data: existingPrompts } = await supabase.from('prompts').select('id')
    
    if (!existingPrompts || existingPrompts.length === 0) {
      const promptsToInsert = contentData.prompts.map(prompt => ({
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        tags: prompt.tags,
        downloads: prompt.downloads
      }))

      const { error: promptsError } = await supabase
        .from('prompts')
        .insert(promptsToInsert)

      if (promptsError) {
        console.error('初始化提示词数据失败:', promptsError)
      } else {
        console.log(`成功初始化 ${promptsToInsert.length} 个提示词`)
      }
    } else {
      console.log('提示词数据已存在，跳过初始化')
    }

    // 4. 初始化教学资源数据
    console.log('初始化教学资源数据...')
    const { data: existingResources } = await supabase.from('teaching_resources').select('id')
    
    if (!existingResources || existingResources.length === 0) {
      const resourcesToInsert = contentData.teachingResources.map(resource => ({
        title: resource.title,
        description: resource.description,
        type: resource.type,
        difficulty: resource.difficulty,
        size: resource.size,
        download_url: resource.downloadUrl,
        downloads: resource.downloads
      }))

      const { error: resourcesError } = await supabase
        .from('teaching_resources')
        .insert(resourcesToInsert)

      if (resourcesError) {
        console.error('初始化教学资源数据失败:', resourcesError)
      } else {
        console.log(`成功初始化 ${resourcesToInsert.length} 个教学资源`)
      }
    } else {
      console.log('教学资源数据已存在，跳过初始化')
    }

    console.log('数据库初始化完成！')
    return true

  } catch (error) {
    console.error('数据库初始化失败:', error)
    return false
  }
}

// 在浏览器控制台中运行此函数来初始化数据库
if (typeof window !== 'undefined') {
  (window as any).initializeDatabase = initializeDatabase
} 