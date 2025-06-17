'use client'

import React, { useState, useEffect } from 'react'
import { agentOperations, promptOperations, resourceOperations, testConnection } from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { simpleConnectionTest, networkTest } from '../../lib/simple-db-test'

export default function TestDbPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    setResults(prev => [...prev, logMessage])
    console.log(logMessage)
  }

  // 页面加载时自动测试简化连接
  useEffect(() => {
    testSimpleConnection()
  }, [])

  const testBasicConnectionOnly = async () => {
    await testSimpleConnection()
  }

  const testSimpleConnection = async () => {
    setLoading(true)
    setResults([])
    
    try {
      addResult('🚀 开始简化连接测试...')
      
      // 先测试网络连接
      const networkResult = await networkTest()
      if (networkResult.success) {
        addResult(`✅ 网络连接正常 (HTTP ${networkResult.status})`)
      } else {
        addResult(`❌ 网络连接失败: ${networkResult.error}`)
        setConnectionStatus('disconnected')
        setLoading(false)
        return
      }
      
      // 再测试数据库连接
      const dbResult = await simpleConnectionTest()
      if (dbResult.success) {
        addResult(`✅ 数据库连接成功! 耗时: ${dbResult.duration}ms`)
        addResult(`📊 表记录数: ${dbResult.count}`)
        addResult(`📋 示例数据: ${JSON.stringify(dbResult.data)}`)
        setConnectionStatus('connected')
      } else {
        addResult(`❌ 数据库连接失败: ${dbResult.error}`)
        if (dbResult.code) {
          addResult(`🔍 错误代码: ${dbResult.code}`)
        }
        setConnectionStatus('disconnected')
      }
      
    } catch (error: any) {
      addResult(`💥 简化测试异常: ${error.message}`)
      setConnectionStatus('disconnected')
    }
    
    setLoading(false)
  }

  const testAllTablesConnection = async () => {
    setLoading(true)
    setResults([])
    
    try {
      addResult('🧪 开始测试所有数据表...')
      const tables = ['agents', 'prompts', 'teaching_resources', 'custom_requests']
      const results: any = {}

      for (const table of tables) {
        try {
          addResult(`📋 测试表: ${table}`)
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(1)

          if (error) {
            addResult(`❌ ${table} 表查询失败: ${error.message}`)
            results[table] = { success: false, error: error.message }
          } else {
            addResult(`✅ ${table} 表连接正常，记录数: ${count}`)
            results[table] = { success: true, count: count || 0 }
          }
        } catch (error: any) {
          addResult(`💥 ${table} 表连接异常: ${error.message}`)
          results[table] = { success: false, error: error.message }
        }
      }
      
      const successCount = Object.values(results).filter((r: any) => r.success).length
      addResult(`📊 测试完成: ${successCount}/4 个表连接正常`)
      
    } catch (error: any) {
      addResult(`💥 表连接测试异常: ${error.message}`)
    }
    
    setLoading(false)
  }

  const testDatabaseOperations = async () => {
    setLoading(true)
    setResults([])
    
    try {
      addResult('🔄 开始测试数据库操作...')
      
      // 测试1: 检查连接
      const isConnected = await testConnection()
      addResult(`🔗 数据库连接状态: ${isConnected ? '正常' : '失败'}`)
      
      if (!isConnected) {
        addResult('❌ 数据库连接失败，停止后续测试')
        setLoading(false)
        return
      }
      
      // 测试2: 获取数据
      addResult('📋 测试数据获取...')
      const agents = await agentOperations.getAll()
      addResult(`✅ 获取智能体: ${agents.length} 条记录`)
      
      const prompts = await promptOperations.getAll()
      addResult(`✅ 获取提示词: ${prompts.length} 条记录`)
      
      const resources = await resourceOperations.getAll()
      addResult(`✅ 获取教学资源: ${resources.length} 条记录`)
      
      // 测试3: 创建测试数据
      addResult('📝 测试数据创建...')
      
      const testAgent = {
        name: `测试智能体_${Date.now()}`,
        description: '这是一个测试智能体',
        image: '',
        type: 'chat' as const,
        url: 'https://test.com',
        tags: ['测试']
      }
      
      const createdAgent = await agentOperations.create(testAgent)
      if (createdAgent) {
        addResult(`✅ 创建智能体成功: ${createdAgent.name}`)
        
        // 测试4: 删除测试数据
        const deleted = await agentOperations.delete(createdAgent.id)
        if (deleted) {
          addResult(`✅ 删除测试数据成功`)
        } else {
          addResult(`⚠️ 删除测试数据失败`)
        }
      } else {
        addResult(`❌ 创建智能体失败`)
      }
      
      addResult('🎉 所有测试完成!')
      
    } catch (error: any) {
      addResult(`💥 测试过程中发生异常: ${error.message}`)
      console.error('测试异常详情:', error)
    }
    
    setLoading(false)
  }

  const testDirectSupabase = async () => {
    setLoading(true)
    setResults([])
    
    try {
      addResult('🔬 直接测试Supabase连接...')
      addResult(`📡 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvrikhctrwowswcamkfj.supabase.co'}`)
      
      // 直接使用supabase客户端测试
      const { data, error } = await supabase
        .from('agents')
        .select('count', { count: 'exact' })
      
      if (error) {
        addResult(`❌ 直接查询失败: ${error.message}`)
        addResult(`🔍 错误详情: ${JSON.stringify(error, null, 2)}`)
      } else {
        addResult(`✅ 直接查询成功!`)
        addResult(`📊 返回数据: ${JSON.stringify(data, null, 2)}`)
      }
      
    } catch (error: any) {
      addResult(`💥 直接测试异常: ${error.message}`)
      console.error('直接测试异常详情:', error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">数据库连接测试工具</h1>
          
          {/* 连接状态指示器 */}
          <div className={`mb-6 p-4 rounded-lg ${
            connectionStatus === 'connected' ? 'bg-green-50 border border-green-200' :
            connectionStatus === 'disconnected' ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'disconnected' ? 'bg-red-500' :
                'bg-gray-400'
              }`}></div>
              <span className="font-medium">
                连接状态: {
                  connectionStatus === 'connected' ? '✅ 已连接' :
                  connectionStatus === 'disconnected' ? '❌ 连接失败' :
                  '🔄 未知'
                }
              </span>
            </div>
          </div>
          
          {/* 测试按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testSimpleConnection}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-semibold"
            >
              {loading ? '测试中...' : '🚨 简化连接测试'}
            </button>
            
            <button
              onClick={testBasicConnectionOnly}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '测试中...' : '基础连接测试'}
            </button>
            
            <button
              onClick={testAllTablesConnection}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '测试中...' : '所有表连接测试'}
            </button>
            
            <button
              onClick={testDatabaseOperations}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? '测试中...' : '完整CRUD测试'}
            </button>
            
            <button
              onClick={testDirectSupabase}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? '测试中...' : '直接Supabase测试'}
            </button>
          </div>
          
          {/* 清空按钮 */}
          <div className="mb-6">
            <button
              onClick={() => setResults([])}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              清空日志
            </button>
          </div>
          
          {/* 测试结果 */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div className="mb-2 text-gray-300">测试日志:</div>
            {results.length === 0 ? (
              <div className="text-gray-500">等待测试...</div>
            ) : (
              results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
          
          {/* 返回管理后台 */}
          <div className="mt-6 text-center">
            <a
              href="/admin"
              className="inline-block px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              返回管理后台
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 