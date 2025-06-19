/**
 * 删除数据库中的默认内容
 * 用于清理系统预设的智能体、提示词、教学资源等
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteDefaultContent() {
  console.log('🗑️  开始删除数据库中的默认内容...\n')

  try {
    // 1. 删除默认内容表中的数据
    console.log('1️⃣  删除 default_content 表中的预设内容...')
    const { error: defaultContentError } = await supabase
      .from('default_content')
      .delete()
      .eq('id', 'website_default')
    
    if (defaultContentError) {
      console.error('❌ 删除默认内容失败:', defaultContentError)
    } else {
      console.log('✅ 默认内容表清理完成')
    }

    // 2. 查看各表的当前数据
    console.log('\n2️⃣  检查各表的当前数据...')
    
    const [agentsResult, promptsResult, resourcesResult, carouselResult] = await Promise.all([
      supabase.from('agents').select('*'),
      supabase.from('prompts').select('*'),
      supabase.from('teaching_resources').select('*'),
      supabase.from('carousel').select('*')
    ])

    console.log('📊 当前数据库内容:')
    console.log(`  - 智能体: ${agentsResult.data?.length || 0} 条`)
    console.log(`  - 提示词: ${promptsResult.data?.length || 0} 条`)
    console.log(`  - 教学资源: ${resourcesResult.data?.length || 0} 条`)
    console.log(`  - 轮播: ${carouselResult.data?.length || 0} 条`)

    // 3. 可选：删除特定的系统预设内容（需要根据实际情况调整）
    console.log('\n3️⃣  查找可能的系统预设内容...')
    
    // 检查是否有created_at为空或特定时间的记录（可能是系统预设）
    if (agentsResult.data && agentsResult.data.length > 0) {
      console.log('🤖 智能体详情:')
      agentsResult.data.forEach((agent, index) => {
        console.log(`  ${index + 1}. ${agent.name} (ID: ${agent.id}) - 创建时间: ${agent.created_at || '未知'}`)
      })
    }

    if (promptsResult.data && promptsResult.data.length > 0) {
      console.log('💡 提示词详情:')
      promptsResult.data.forEach((prompt, index) => {
        console.log(`  ${index + 1}. ${prompt.title} (ID: ${prompt.id}) - 创建时间: ${prompt.created_at || '未知'}`)
      })
    }

    if (resourcesResult.data && resourcesResult.data.length > 0) {
      console.log('📚 教学资源详情:')
      resourcesResult.data.forEach((resource, index) => {
        console.log(`  ${index + 1}. ${resource.title} (ID: ${resource.id}) - 创建时间: ${resource.created_at || '未知'}`)
      })
    }

    if (carouselResult.data && carouselResult.data.length > 0) {
      console.log('🎠 轮播详情:')
      carouselResult.data.forEach((carousel, index) => {
        console.log(`  ${index + 1}. ${carousel.title} (ID: ${carousel.id}) - 创建时间: ${carousel.created_at || '未知'}`)
      })
    }

    console.log('\n✅ 默认内容删除脚本执行完成!')
    console.log('\n📝 说明:')
    console.log('- 已删除 default_content 表中的系统预设内容')
    console.log('- 各数据表中的记录已列出，如需删除特定记录，请手动操作')
    console.log('- 建议只保留管理后台手动添加的内容')

  } catch (error) {
    console.error('💥 删除过程中发生错误:', error)
  }
}

// 确认删除的交互式提示
async function confirmDelete() {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('⚠️  确认要删除数据库中的默认内容吗？这将清理系统预设的内容。(y/N): ', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

// 主执行函数
async function main() {
  console.log('🗂️  数据库默认内容清理工具')
  console.log('═'.repeat(50))
  
  const confirmed = await confirmDelete()
  
  if (confirmed) {
    await deleteDefaultContent()
  } else {
    console.log('❌ 操作已取消')
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { deleteDefaultContent } 