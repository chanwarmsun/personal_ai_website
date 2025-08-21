const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://mvrikhctrwowswcamkfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'
)

async function checkDefaultContent() {
  try {
    console.log('🔍 检查数据库中的默认内容...')
    
    const { data, error } = await supabase
      .from('default_content')
      .select('*')
      .eq('content_type', 'website_default')
    
    if (error) {
      console.error('❌ 查询错误:', error)
      return
    }
    
    console.log(`📊 数据库中的默认内容记录数: ${data.length}`)
    
    if (data.length > 0) {
      const latestRecord = data[0]
      console.log('📝 最新记录ID:', latestRecord.id)
      console.log('🕒 更新时间:', latestRecord.updated_at)
      console.log('📄 内容数据:')
      
      const contentData = latestRecord.content_data
      if (contentData) {
        console.log('  - agents数量:', contentData.agents?.length || 0)
        console.log('  - prompts数量:', contentData.prompts?.length || 0) 
        console.log('  - teachingResources数量:', contentData.teachingResources?.length || 0)
        console.log('  - carousel数量:', contentData.carousel?.length || 0)
        
        // 显示详细内容
        console.log('\n📋 详细内容预览:')
        if (contentData.agents?.length > 0) {
          console.log('首个智能体:', contentData.agents[0].name || '无名称')
        }
        if (contentData.prompts?.length > 0) {
          console.log('首个提示词:', contentData.prompts[0].title || '无标题')
        }
        if (contentData.teachingResources?.length > 0) {
          console.log('首个教学资源:', contentData.teachingResources[0].title || '无标题')
        }
      } else {
        console.log('❌ 内容数据为空')
      }
    } else {
      console.log('⚠️ 数据库中没有默认内容记录')
    }
  } catch (err) {
    console.error('❌ 执行错误:', err)
  }
}

checkDefaultContent() 