#!/usr/bin/env node

/**
 * Supabase数据库唤醒脚本
 * 用于唤醒处于暂停状态的免费版Supabase数据库
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function wakeUpDatabase() {
  console.log('🌅 开始唤醒Supabase数据库...')
  
  const tables = ['agents', 'prompts', 'teaching_resources', 'custom_requests', 'carousel', 'default_content']
  
  for (let i = 0; i < 5; i++) {
    console.log(`🔄 第 ${i + 1} 次尝试...`)
    
    try {
      // 对每个表执行简单查询
      for (const table of tables) {
        console.log(`📡 查询表: ${table}`)
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact' })
          .limit(1)
        
        if (error) {
          console.log(`⚠️  表 ${table} 查询出错: ${error.message}`)
        } else {
          console.log(`✅ 表 ${table} 响应正常`)
        }
        
        // 间隔1秒
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      console.log(`✅ 第 ${i + 1} 次尝试完成`)
      
      // 间隔3秒再进行下一轮
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 次尝试失败:`, error.message)
    }
  }
  
  console.log('🎉 数据库唤醒流程完成！')
}

// API方式备用唤醒
async function wakeUpDatabaseViaAPI() {
  console.log('🌐 使用API方式唤醒数据库...')
  
  const tables = ['agents', 'prompts', 'teaching_resources', 'custom_requests', 'carousel', 'default_content']
  
  for (const table of tables) {
    try {
      console.log(`📡 API查询表: ${table}`)
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        console.log(`✅ 表 ${table} API响应正常`)
      } else {
        console.log(`⚠️  表 ${table} API响应异常: ${response.status}`)
      }
    } catch (error) {
      console.error(`❌ 表 ${table} API查询失败:`, error.message)
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

async function main() {
  console.log('🚀 启动数据库唤醒脚本...')
  
  try {
    // 先尝试SDK方式
    await wakeUpDatabase()
    
    // 再尝试API方式
    await wakeUpDatabaseViaAPI()
    
    console.log('🎊 数据库唤醒完成！现在应该可以正常连接了。')
  } catch (error) {
    console.error('💥 唤醒脚本执行失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = { wakeUpDatabase, wakeUpDatabaseViaAPI } 