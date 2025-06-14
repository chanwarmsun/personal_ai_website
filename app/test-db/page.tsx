'use client'

import { useState, useEffect } from 'react'
import { agentOperations, promptOperations, resourceOperations } from '../../lib/database'

export default function TestDbPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 开始加载数据库数据...')
      
      const [agentsData, promptsData, resourcesData] = await Promise.all([
        agentOperations.getAll(),
        promptOperations.getAll(),
        resourceOperations.getAll()
      ])
      
      console.log('✅ 智能体数据:', agentsData)
      console.log('✅ 提示词数据:', promptsData)
      console.log('✅ 教学资源数据:', resourcesData)
      
      setAgents(agentsData)
      setPrompts(promptsData)
      setResources(resourcesData)
      
    } catch (err) {
      console.error('❌ 加载数据失败:', err)
      setError(err instanceof Error ? err.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const createTestAgent = async () => {
    try {
      const testAgent = {
        name: '测试智能体 ' + Date.now(),
        description: '这是一个测试智能体',
        image: '/test.png',
        type: 'chat' as const,
        url: 'https://example.com',
        tags: ['测试', '智能体']
      }
      
      console.log('🧪 创建测试智能体:', testAgent)
      const created = await agentOperations.create(testAgent)
      console.log('✅ 创建成功:', created)
      
      // 重新加载数据
      await loadAllData()
    } catch (err) {
      console.error('❌ 创建失败:', err)
      setError(err instanceof Error ? err.message : '创建失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">数据库连接测试</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">错误: {error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">智能体</h3>
              <p className="text-2xl font-bold text-blue-600">{agents.length}</p>
              <p className="text-sm text-blue-700">条记录</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">提示词</h3>
              <p className="text-2xl font-bold text-green-600">{prompts.length}</p>
              <p className="text-sm text-green-700">条记录</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">教学资源</h3>
              <p className="text-2xl font-bold text-purple-600">{resources.length}</p>
              <p className="text-sm text-purple-700">条记录</p>
            </div>
          </div>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={loadAllData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              重新加载数据
            </button>
            
            <button
              onClick={createTestAgent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              创建测试智能体
            </button>
          </div>
          
          {/* 智能体列表 */}
          {agents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">智能体列表</h3>
              <div className="space-y-2">
                {agents.map((agent, index) => (
                  <div key={agent.id || index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.description}</p>
                        <div className="flex gap-1 mt-1">
                          {agent.tags?.map((tag: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          agent.type === 'chat' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {agent.type}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {agent.created_at ? new Date(agent.created_at).toLocaleString() : '未知时间'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <a
              href="/admin-login"
              className="inline-flex items-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              前往管理后台
            </a>
            <span className="mx-4 text-gray-400">|</span>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-600 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 