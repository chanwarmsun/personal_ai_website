const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  'https://mvrikhctrwowswcamkfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'
)

async function restoreDefaultContent() {
  try {
    console.log('🔄 开始恢复默认内容...')
    
    // 1. 读取原始内容文件
    const contentPath = path.join(__dirname, '../data/content.json')
    const contentData = JSON.parse(fs.readFileSync(contentPath, 'utf8'))
    
    console.log('📁 从文件读取的内容:')
    console.log('  - agents数量:', contentData.agents?.length || 0)
    console.log('  - prompts数量:', contentData.prompts?.length || 0)
    console.log('  - teachingResources数量:', contentData.teachingResources?.length || 0)
    console.log('  - carousel数量:', contentData.carousel?.length || 0)
    
    // 2. 删除所有测试记录
    console.log('\n🗑️ 清除数据库中的测试数据...')
    const { error: deleteError } = await supabase
      .from('default_content')
      .delete()
      .eq('content_type', 'website_default')
    
    if (deleteError) {
      console.error('❌ 清除数据失败:', deleteError)
      return
    }
    
    console.log('✅ 测试数据已清除')
    
    // 3. 转换数据格式以匹配前端期望
    const transformedData = {
      agents: contentData.agents || [],
      prompts: contentData.prompts || [],
      teachingResources: contentData.teachingResources || [],
      carousel: contentData.carousel || []
    }
    
    // 4. 保存正确的默认内容到数据库
    console.log('\n💾 保存正确的默认内容到数据库...')
    const { error: insertError } = await supabase
      .from('default_content')
      .insert({
        content_type: 'website_default',
        content_data: transformedData,
        updated_at: new Date().toISOString()
      })
    
    if (insertError) {
      console.error('❌ 保存数据失败:', insertError)
      return
    }
    
    console.log('✅ 默认内容已成功保存')
    
    // 5. 验证保存结果
    console.log('\n🔍 验证保存结果...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('default_content')
      .select('*')
      .eq('content_type', 'website_default')
      .limit(1)
    
    if (verifyError) {
      console.error('❌ 验证失败:', verifyError)
      return
    }
    
    if (verifyData && verifyData.length > 0) {
      const savedContent = verifyData[0].content_data
      console.log('📊 验证结果:')
      console.log('  - agents数量:', savedContent.agents?.length || 0)
      console.log('  - prompts数量:', savedContent.prompts?.length || 0)
      console.log('  - teachingResources数量:', savedContent.teachingResources?.length || 0)
      console.log('  - carousel数量:', savedContent.carousel?.length || 0)
      
      console.log('\n🎉 默认内容恢复成功！')
      console.log('现在可以重新访问管理后台，默认内容应该正常显示了。')
    } else {
      console.log('❌ 验证失败：没有找到保存的数据')
    }
    
  } catch (err) {
    console.error('❌ 执行错误:', err)
  }
}

restoreDefaultContent() 