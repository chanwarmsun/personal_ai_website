import { createClient } from '@supabase/supabase-js'

// 简化的数据库连接测试
export async function simpleConnectionTest() {
  console.log('🚀 开始简化连接测试...')
  
  try {
    // 直接创建supabase客户端
    const supabaseUrl = 'https://mvrikhctrwowswcamkfj.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'
    
    console.log('📡 创建Supabase客户端...')
    console.log('URL:', supabaseUrl)
    console.log('Key:', supabaseKey.substring(0, 20) + '...')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('📋 执行测试查询...')
    
    // 简单的查询测试
    const startTime = Date.now()
    const { data, error, count } = await supabase
      .from('agents')
      .select('id, name', { count: 'exact' })
      .limit(1)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️ 查询耗时: ${duration}ms`)
    
    if (error) {
      console.error('❌ 查询失败:', error)
      return {
        success: false,
        error: error.message,
        code: error.code,
        details: error
      }
    }
    
    console.log('✅ 查询成功!')
    console.log('📊 记录数:', count)
    console.log('📋 数据:', data)
    
    return {
      success: true,
      count: count || 0,
      data: data,
      duration: duration
    }
    
  } catch (error: any) {
    console.error('💥 简化测试异常:', error)
    return {
      success: false,
      error: error.message,
      details: error
    }
  }
}

// 网络连接测试
export async function networkTest() {
  console.log('🌐 开始网络连接测试...')
  
  try {
    const response = await fetch('https://mvrikhctrwowswcamkfj.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'
      }
    })
    
    console.log('📡 HTTP状态码:', response.status)
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const text = await response.text()
      console.log('✅ 网络连接正常')
      console.log('📄 响应内容:', text.substring(0, 200) + '...')
      return { success: true, status: response.status }
    } else {
      console.error('❌ HTTP请求失败:', response.statusText)
      return { success: false, status: response.status, error: response.statusText }
    }
    
  } catch (error: any) {
    console.error('💥 网络连接异常:', error)
    return { success: false, error: error.message }
  }
} 