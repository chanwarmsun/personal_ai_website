'use client'

import { useState, useEffect } from 'react'

// 动态导入logger并添加错误处理
async function loadLogger() {
  try {
    const module = await import('../../../lib/logger')
    return module
  } catch (error) {
    console.error('Failed to load logger:', error)
    throw error
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState({
    level: '',
    category: '',
    since: '',
    limit: 100
  })
  const [stats, setStats] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbLogger, setDbLogger] = useState<any>(null)

  // 初始化logger
  useEffect(() => {
    async function initLogger() {
      try {
        setIsLoading(true)
        setError(null)
        
        const loggerModule = await loadLogger()
        setDbLogger(loggerModule.dbLogger)
        
        console.log('Logger loaded successfully')
      } catch (err: any) {
        console.error('Logger initialization failed:', err)
        setError(`Logger初始化失败: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }
    
    initLogger()
  }, [])

  // 加载日志
  const loadLogs = () => {
    if (!dbLogger) {
      setError('Logger未初始化')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const filterOptions: any = { limit: filter.limit }
      
      if (filter.level) filterOptions.level = filter.level as any
      if (filter.category) filterOptions.category = filter.category as any
      if (filter.since) filterOptions.since = new Date(filter.since)
      
      const filteredLogs = dbLogger.getLogs(filterOptions)
      setLogs(filteredLogs)
      
      const connectionStats = dbLogger.getConnectionStats()
      setStats(connectionStats)
      
      console.log('Logs loaded:', filteredLogs.length)
    } catch (error: any) {
      console.error('加载日志失败:', error)
      setError(`加载日志失败: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (dbLogger) {
      loadLogs()
    }
  }, [filter, dbLogger])

  // 清空日志
  const clearLogs = () => {
    if (!dbLogger) return
    
    if (confirm('确定要清空所有日志吗？')) {
      dbLogger.clearLogs()
      loadLogs()
    }
  }

  // 导出日志
  const exportLogs = () => {
    if (!dbLogger) return
    
    try {
      const logData = dbLogger.exportLogs()
      const blob = new Blob([logData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `db-logs-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      setError(`导出失败: ${error.message}`)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'DEBUG': return 'text-gray-600 bg-gray-100'
      case 'INFO': return 'text-blue-600 bg-blue-100'
      case 'WARN': return 'text-yellow-600 bg-yellow-100'
      case 'ERROR': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CONNECTION': return 'text-green-600 bg-green-100'
      case 'QUERY': return 'text-purple-600 bg-purple-100'
      case 'SWITCH': return 'text-orange-600 bg-orange-100'
      case 'KEEPALIVE': return 'text-teal-600 bg-teal-100'
      case 'RETRY': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // 如果正在加载且没有错误，显示加载状态
  if (isLoading && !error && !dbLogger) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">正在加载连接日志...</h1>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 text-center">正在初始化日志系统，请稍候...</p>
          </div>
        </div>
      </div>
    )
  }

  // 如果有错误，显示错误页面
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h1 className="text-2xl font-bold text-red-600 mb-4">连接日志加载失败</h1>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">诊断信息:</h3>
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                  <li>• 浏览器环境: {typeof window !== 'undefined' ? '✅ 客户端' : '❌ 服务端'}</li>
                  <li>• LocalStorage: {typeof localStorage !== 'undefined' ? '✅ 可用' : '❌ 不可用'}</li>
                  <li>• Logger状态: {dbLogger ? '✅ 已加载' : '❌ 未加载'}</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  重新加载
                </button>
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  返回管理后台
                </button>
                <button
                  onClick={() => window.location.href = '/admin/logs-test'}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  打开测试页面
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">数据库连接日志</h1>
              <p className="mt-2 text-gray-600">查看详细的数据库连接日志，帮助排查问题</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.close()}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                关闭窗口
              </button>
              <button
                onClick={() => window.open('/admin', '_blank')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <span>🏠</span>
                返回管理后台
              </button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-gray-600">总连接数</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalConnections || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-gray-600">成功连接</div>
            <div className="text-2xl font-bold text-green-600">{stats.successfulConnections || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-gray-600">失败连接</div>
            <div className="text-2xl font-bold text-red-600">{stats.failedConnections || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-gray-600">模式切换</div>
            <div className="text-2xl font-bold text-orange-600">{stats.modeSwitch || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-sm font-medium text-gray-600">平均响应时间</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.avgConnectionTime ? `${stats.avgConnectionTime.toFixed(0)}ms` : '0ms'}
            </div>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日志级别</label>
              <select
                value={filter.level}
                onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">全部级别</option>
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日志分类</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">全部分类</option>
                <option value="CONNECTION">连接</option>
                <option value="QUERY">查询</option>
                <option value="SWITCH">切换</option>
                <option value="KEEPALIVE">保活</option>
                <option value="RETRY">重试</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时间范围</label>
              <input
                type="datetime-local"
                value={filter.since}
                onChange={(e) => setFilter(prev => ({ ...prev, since: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">显示条数</label>
              <select
                value={filter.limit}
                onChange={(e) => setFilter(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value={50}>50条</option>
                <option value={100}>100条</option>
                <option value={200}>200条</option>
                <option value={500}>500条</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                刷新
              </button>
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                清空
              </button>
              <button
                onClick={exportLogs}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                导出
              </button>
            </div>
          </div>
        </div>

        {/* 日志列表 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              日志记录 ({logs.length} 条)
              {isLoading && <span className="text-sm text-gray-500 ml-2">加载中...</span>}
            </h2>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {log.timestamp.toLocaleString()}
                      </span>
                      {log.duration && (
                        <span className="text-xs text-gray-400">
                          {log.duration.toFixed(2)}ms
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-900 font-medium mb-2">
                      {log.message}
                    </div>

                    {log.metadata && (
                      <div className="text-xs text-gray-600 mb-2">
                        <strong>元数据:</strong> {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}

                    {log.details && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-800">详细信息</summary>
                        <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}

                    {log.stackTrace && log.level === 'ERROR' && (
                      <details className="text-xs text-red-600 mt-2">
                        <summary className="cursor-pointer hover:text-red-800">错误堆栈</summary>
                        <pre className="mt-2 bg-red-50 p-2 rounded overflow-x-auto text-xs">
                          {log.stackTrace}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && !isLoading && (
              <div className="p-12 text-center text-gray-500">
                <div className="text-lg font-medium mb-2">暂无日志记录</div>
                <div className="text-sm">尝试调整过滤条件或等待新的日志产生</div>
              </div>
            )}
          </div>
        </div>

        {/* 错误类型统计 */}
        {stats.errorTypes && Object.keys(stats.errorTypes).length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">错误类型统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.errorTypes).map(([errorType, count]) => (
                <div key={errorType} className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">{errorType}</div>
                  <div className="text-xl font-bold text-red-600">{count as number}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 