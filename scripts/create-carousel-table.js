#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createCarouselTable() {
  console.log('📝 开始创建轮播表...')

  try {
    // 创建轮播表的SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS carousel (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `

    console.log('🔄 执行创建表SQL...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.error('❌ 创建表失败:', error)
      
      // 尝试使用admin密钥（如果有的话）
      console.log('🔄 尝试备用方案...')
      await createTableViaAPI()
      return
    }

    console.log('✅ 轮播表创建成功')
    
    // 测试表是否真的创建了
    const { data: testData, error: testError } = await supabase
      .from('carousel')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (testError) {
      console.warn('⚠️ 表验证失败:', testError.message)
    } else {
      console.log('✅ 表验证成功，当前记录数:', testData?.length || 0)
    }

  } catch (error) {
    console.error('💥 创建表过程异常:', error)
    await createTableViaAPI()
  }
}

async function createTableViaAPI() {
  console.log('🌐 尝试通过API创建表...')
  
  try {
    // 使用raw SQL API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS carousel (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            image TEXT NOT NULL,
            description TEXT,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
          );
        `
      })
    })

    if (response.ok) {
      console.log('✅ API方式创建表成功')
    } else {
      console.log('⚠️ API方式创建表响应:', response.status, response.statusText)
      
      // 如果创建失败，可能是权限问题，我们跳过这个表
      console.log('ℹ️ 注意：轮播功能可能会使用本地存储作为备选方案')
    }
  } catch (error) {
    console.error('❌ API方式创建表失败:', error.message)
    console.log('ℹ️ 这可能是权限限制，轮播功能将使用本地存储')
  }
}

async function main() {
  console.log('🚀 启动轮播表创建脚本...')
  await createCarouselTable()
  console.log('🎊 轮播表创建脚本完成！')
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createCarouselTable } 