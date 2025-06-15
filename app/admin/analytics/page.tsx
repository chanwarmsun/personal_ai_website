'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { analytics } from '../../../lib/analytics'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import * as XLSX from 'xlsx'

interface AnalyticsStats {
  totalPageViews: number
  totalUniqueVisitors: number
  topAgents: Record<string, number>
  topPrompts: Record<string, number>
  topResources: Record<string, number>
  topSearches: Record<string, number>
  dailyStats: Array<{
    date: string
    pageViews: number
    uniqueVisitors: number
    agentClicks: number
    downloads: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState(7)
  const router = useRouter()

  useEffect(() => {
    loadStats()
  }, [selectedDays])

  const loadStats = () => {
    setLoading(true)
    try {
      const data = analytics.getStats(selectedDays)
      setStats(data)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    try {
      const data = analytics.exportData()
      if (data) {
        const jsonString = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }, 100)
        
        console.log('✅ JSON数据导出成功')
      } else {
        alert('暂无数据可导出')
      }
    } catch (error) {
      console.error('导出数据失败:', error)
      alert('导出数据失败，请重试')
    }
  }

  const exportExcel = () => {
    try {
      if (!stats) {
        alert('暂无数据可导出')
        return
      }

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      
      // 1. 概览数据表
      const overviewData = [
        ['指标', '数值'],
        ['总页面访问量', stats.totalPageViews.toString()],
        ['独立访客数', stats.totalUniqueVisitors.toString()],
        ['智能体总点击', Object.values(stats.topAgents).reduce((a, b) => a + b, 0).toString()],
        ['提示词总下载', Object.values(stats.topPrompts).reduce((a, b) => a + b, 0).toString()],
        ['资源总下载', Object.values(stats.topResources).reduce((a, b) => a + b, 0).toString()],
        ['搜索总次数', Object.values(stats.topSearches).reduce((a, b) => a + b, 0).toString()]
      ]
      const overviewWS = XLSX.utils.aoa_to_sheet(overviewData)
      XLSX.utils.book_append_sheet(wb, overviewWS, '数据概览')

      // 2. 每日统计表
      const dailyData = [
        ['日期', '页面访问', '独立访客', '智能体点击', '下载量']
      ]
      stats.dailyStats.forEach(day => {
        dailyData.push([
          day.date,
          day.pageViews.toString(),
          day.uniqueVisitors.toString(),
          day.agentClicks.toString(),
          day.downloads.toString()
        ])
      })
      const dailyWS = XLSX.utils.aoa_to_sheet(dailyData)
      XLSX.utils.book_append_sheet(wb, dailyWS, '每日统计')

      // 3. 热门智能体表
      const agentsData = [['智能体名称', '点击次数']]
      Object.entries(stats.topAgents).forEach(([name, count]) => {
        agentsData.push([name.replace(/_/g, ' '), count.toString()])
      })
      const agentsWS = XLSX.utils.aoa_to_sheet(agentsData)
      XLSX.utils.book_append_sheet(wb, agentsWS, '热门智能体')

      // 4. 热门提示词表
      const promptsData = [['提示词名称', '下载次数']]
      Object.entries(stats.topPrompts).forEach(([name, count]) => {
        promptsData.push([name, count.toString()])
      })
      const promptsWS = XLSX.utils.aoa_to_sheet(promptsData)
      XLSX.utils.book_append_sheet(wb, promptsWS, '热门提示词')

      // 5. 热门资源表
      const resourcesData = [['资源名称', '下载次数']]
      Object.entries(stats.topResources).forEach(([name, count]) => {
        resourcesData.push([name, count.toString()])
      })
      const resourcesWS = XLSX.utils.aoa_to_sheet(resourcesData)
      XLSX.utils.book_append_sheet(wb, resourcesWS, '热门资源')

      // 6. 搜索关键词表
      const searchData = [['搜索关键词', '搜索次数']]
      Object.entries(stats.topSearches).forEach(([keyword, count]) => {
        searchData.push([keyword, count.toString()])
      })
      const searchWS = XLSX.utils.aoa_to_sheet(searchData)
      XLSX.utils.book_append_sheet(wb, searchWS, '搜索关键词')

      // 导出Excel文件
      const fileName = `网站数据统计-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      console.log('✅ Excel数据导出成功')
    } catch (error) {
      console.error('导出Excel失败:', error)
      alert('导出Excel失败，请重试')
    }
  }

  const clearData = () => {
    if (confirm('确定要清空所有统计数据吗？此操作不可恢复！')) {
      analytics.clearAllData()
      setStats(null)
      loadStats()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载统计数据中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">暂无统计数据</p>
            <button 
              onClick={loadStats}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              刷新数据
            </button>
          </div>
        </div>
      </div>
    )
  }

  const topAgentsData = Object.entries(stats.topAgents).map(([name, count]) => ({
    name: name.replace(/_/g, ' '),
    count
  }))

  const topPromptsData = Object.entries(stats.topPrompts).map(([name, count]) => ({
    name,
    count
  }))

  const topResourcesData = Object.entries(stats.topResources).map(([name, count]) => ({
    name,
    count
  }))

  const dailyTrendData = stats.dailyStats.map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  })).reverse()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和控制按钮 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回管理后台
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">数据统计</h1>
              <p className="text-gray-600 mt-2">网站访问和用户行为分析</p>
            </div>
          </div>
          <div className="flex gap-4">
            <select 
              value={selectedDays} 
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>最近7天</option>
              <option value={14}>最近14天</option>
              <option value={30}>最近30天</option>
            </select>
            <button 
              onClick={exportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              导出JSON
            </button>
            <button 
              onClick={exportExcel}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              导出Excel
            </button>
            <button 
              onClick={() => {
                analytics.generateDemoData()
                loadStats()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              生成演示数据
            </button>
            <button 
              onClick={clearData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              清空数据
            </button>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总页面访问</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPageViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">独立访客</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUniqueVisitors.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">智能体点击</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(stats.topAgents).reduce((a, b) => a + b, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总下载量</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(Object.values(stats.topPrompts).reduce((a, b) => a + b, 0) + 
                    Object.values(stats.topResources).reduce((a, b) => a + b, 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 趋势图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">访问趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="pageViews" stroke="#8884d8" name="页面访问" />
                <Line type="monotone" dataKey="uniqueVisitors" stroke="#82ca9d" name="独立访客" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">用户活动</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="agentClicks" fill="#8884d8" name="智能体点击" />
                <Bar dataKey="downloads" fill="#82ca9d" name="下载量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 热门内容排行 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">热门智能体</h3>
            <div className="space-y-3">
              {topAgentsData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="ml-3 text-sm text-gray-900 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">热门提示词</h3>
            <div className="space-y-3">
              {topPromptsData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="ml-3 text-sm text-gray-900 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">热门资源</h3>
            <div className="space-y-3">
              {topResourcesData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="ml-3 text-sm text-gray-900 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}