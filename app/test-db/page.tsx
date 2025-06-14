'use client'

import { useState, useEffect } from 'react'
import { agentOperations, promptOperations, resourceOperations, testConnection } from '../../lib/database'

export default function TestDatabase() {
  const [connectionStatus, setConnectionStatus] = useState<string>('未测试')
  const [agents, setAgents] = useState<any[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDatabaseConnection = async () => {
    setLoading(true)
    addTestResult('开始测试数据库连接...')
    
    try {
      const isConnected = await testConnection()
      setConnectionStatus(isConnected ? '连接成功' : '连接失败')
      addTestResult(`数据库连接: ${isConnected ? '成功' : '失败'}`)
    } catch (error) {
      setConnectionStatus('连接异常')
      addTestResult(`数据库连接异常: ${error}`)
    }
    
    setLoading(false)
  }

  const loadAllData = async () => {
    setLoading(true)
    addTestResult('开始加载所有数据...')
    
    try {
      const [agentsData, promptsData, resourcesData] = await Promise.all([
        agentOperations.getAll(),
        promptOperations.getAll(),
        resourceOperations.getAll()
      ])
      
      setAgents(agentsData)
      setPrompts(promptsData)
      setResources(resourcesData)
      
      addTestResult(`加载完成 - 智能体: ${agentsData.length}, 提示词: ${promptsData.length}, 资源: ${resourcesData.length}`)
    } catch (error) {
      addTestResult(`加载数据失败: ${error}`)
    }
    
    setLoading(false)
  }

  const testCreateAgent = async () => {
    setLoading(true)
    addTestResult('测试创建智能体...')
    
    try {
      const testAgent = {
        name: `测试智能体_${Date.now()}`,
        description: '这是一个测试智能体',
        image: '/default-agent.png',
        type: 'chat' as const,
        url: 'https://example.com',
        tags: ['测试', '智能体']
      }
      
      const created = await agentOperations.create(testAgent)
      if (created) {
        addTestResult(`创建智能体成功: ${created.name} (ID: ${created.id})`)
        await loadAllData() // 重新加载数据
      } else {
        addTestResult('创建智能体失败: 返回null')
      }
    } catch (error) {
      addTestResult(`创建智能体异常: ${error}`)
    }
    
    setLoading(false)
  }

  const testCreatePrompt = async () => {
    setLoading(true)
    addTestResult('测试创建提示词...')
    
    try {
      const testPrompt = {
        title: `测试提示词_${Date.now()}`,
        description: '这是一个测试提示词',
        content: '你是一个测试助手，请帮助用户解决问题。',
        tags: ['测试', '提示词'],
        downloads: 0
      }
      
      const created = await promptOperations.create(testPrompt)
      if (created) {
        addTestResult(`创建提示词成功: ${created.title} (ID: ${created.id})`)
        await loadAllData() // 重新加载数据
      } else {
        addTestResult('创建提示词失败: 返回null')
      }
    } catch (error) {
      addTestResult(`创建提示词异常: ${error}`)
    }
    
    setLoading(false)
  }

  const testCreateResource = async () => {
    setLoading(true)
    addTestResult('测试创建教学资源...')
    
    try {
      const testResource = {
        title: `测试资源_${Date.now()}`,
        description: '这是一个测试教学资源',
        type: 'document',
        difficulty: 'beginner',
        size: '1MB',
        download_url: 'https://example.com/test.pdf',
        downloads: 0
      }
      
      const created = await resourceOperations.create(testResource)
      if (created) {
        addTestResult(`创建教学资源成功: ${created.title} (ID: ${created.id})`)
        await loadAllData() // 重新加载数据
      } else {
        addTestResult('创建教学资源失败: 返回null')
      }
    } catch (error) {
      addTestResult(`创建教学资源异常: ${error}`)
    }
    
    setLoading(false)
  }

  const deleteTestData = async () => {
    setLoading(true)
    addTestResult('开始删除测试数据...')
    
    try {
      // 删除所有包含"测试"的数据
      const testAgents = agents.filter(agent => agent.name.includes('测试'))
      const testPrompts = prompts.filter(prompt => prompt.title.includes('测试'))
      const testResources = resources.filter(resource => resource.title.includes('测试'))
      
      for (const agent of testAgents) {
        await agentOperations.delete(agent.id)
        addTestResult(`删除测试智能体: ${agent.name}`)
      }
      
      for (const prompt of testPrompts) {
        await promptOperations.delete(prompt.id)
        addTestResult(`删除测试提示词: ${prompt.title}`)
      }
      
      for (const resource of testResources) {
        await resourceOperations.delete(resource.id)
        addTestResult(`删除测试资源: ${resource.title}`)
      }
      
      await loadAllData() // 重新加载数据
      addTestResult('测试数据删除完成')
    } catch (error) {
      addTestResult(`删除测试数据异常: ${error}`)
    }
    
    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  useEffect(() => {
    testDatabaseConnection()
    loadAllData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">数据库测试页面</h1>
        
        {/* 连接状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">连接状态</h2>
          <div className={`inline-block px-4 py-2 rounded-full text-white ${
            connectionStatus === '连接成功' ? 'bg-green-500' : 
            connectionStatus === '连接失败' ? 'bg-red-500' : 'bg-yellow-500'
          }`}>
            {connectionStatus}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testDatabaseConnection}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              测试连接
            </button>
            <button
              onClick={loadAllData}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              加载数据
            </button>
            <button
              onClick={testCreateAgent}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              创建智能体
            </button>
            <button
              onClick={testCreatePrompt}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              创建提示词
            </button>
            <button
              onClick={testCreateResource}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              创建资源
            </button>
            <button
              onClick={deleteTestData}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              删除测试数据
            </button>
            <button
              onClick={clearResults}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              清空日志
            </button>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">智能体</h3>
            <p className="text-3xl font-bold text-blue-600">{agents.length}</p>
            <p className="text-gray-500">总数量</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">提示词</h3>
            <p className="text-3xl font-bold text-green-600">{prompts.length}</p>
            <p className="text-gray-500">总数量</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">教学资源</h3>
            <p className="text-3xl font-bold text-purple-600">{resources.length}</p>
            <p className="text-gray-500">总数量</p>
          </div>
        </div>

        {/* 测试日志 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试日志</h2>
          <div className="bg-gray-100 rounded p-4 h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">暂无日志</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1 text-sm font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 数据详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 智能体列表 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">智能体列表</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {agents.length === 0 ? (
                <p className="text-gray-500">暂无数据</p>
              ) : (
                agents.map((agent, index) => (
                  <div key={agent.id} className="border rounded p-2">
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500">ID: {agent.id}</p>
                    <p className="text-sm text-gray-500">类型: {agent.type}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 提示词列表 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">提示词列表</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {prompts.length === 0 ? (
                <p className="text-gray-500">暂无数据</p>
              ) : (
                prompts.map((prompt, index) => (
                  <div key={prompt.id} className="border rounded p-2">
                    <p className="font-medium">{prompt.title}</p>
                    <p className="text-sm text-gray-500">ID: {prompt.id}</p>
                    <p className="text-sm text-gray-500">下载: {prompt.downloads}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 教学资源列表 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">教学资源列表</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {resources.length === 0 ? (
                <p className="text-gray-500">暂无数据</p>
              ) : (
                resources.map((resource, index) => (
                  <div key={resource.id} className="border rounded p-2">
                    <p className="font-medium">{resource.title}</p>
                    <p className="text-sm text-gray-500">ID: {resource.id}</p>
                    <p className="text-sm text-gray-500">类型: {resource.type}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 