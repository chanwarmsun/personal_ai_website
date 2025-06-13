'use client'

import { motion } from 'framer-motion'
import { Bot, ExternalLink, Download, Play, Filter, Grid, List, Search, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import contentData from '../data/content.json'

export default function AgentsSection() {
  const { agents } = contentData
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'downloads' | 'latest'>('latest')
  
  // 智能分类系统 - 基于功能而非技术标签
  const categories = [
    { id: '全部', name: '全部智能体', icon: '🤖', count: agents.length },
    { id: '工作效率', name: '工作效率', icon: '💼', keywords: ['写作', '编程', '分析', '办公'] },
    { id: '学习教育', name: '学习教育', icon: '📚', keywords: ['教学', '学习', '课程', '知识'] },
    { id: '创意设计', name: '创意设计', icon: '🎨', keywords: ['设计', '创意', '灵感', '美术'] },
    { id: '数据处理', name: '数据处理', icon: '📊', keywords: ['数据', '分析', '统计', '可视化'] },
    { id: '生活助手', name: '生活助手', icon: '🏠', keywords: ['生活', '健康', '娱乐', '助手'] }
  ]
  
  // 智能筛选和搜索
  const getFilteredAgents = () => {
    let filtered = agents
    
    // 按分类筛选
    if (selectedCategory !== '全部') {
      const category = categories.find(cat => cat.id === selectedCategory)
      if (category && category.keywords) {
        filtered = filtered.filter(agent => 
          agent.tags.some(tag => 
            category.keywords!.some(keyword => 
              tag.includes(keyword) || agent.name.includes(keyword) || agent.description.includes(keyword)
            )
          )
        )
      }
    }
    
    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'downloads':
          return parseInt(b.id) - parseInt(a.id) // 模拟下载量排序
        case 'latest':
        default:
          return parseInt(b.id) - parseInt(a.id)
      }
    })
    
    return filtered
  }
  
  const filteredAgents = getFilteredAgents()
  
  // 更新分类计数
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === '全部') return agents.length
    const category = categories.find(cat => cat.id === categoryId)
    if (!category || !category.keywords) return 0
    return agents.filter(agent => 
      agent.tags.some(tag => 
        category.keywords!.some(keyword => 
          tag.includes(keyword) || agent.name.includes(keyword) || agent.description.includes(keyword)
        )
      )
    ).length
  }

  const handleAgentClick = (agent: any) => {
    if (agent.type === 'download') {
      // 创建下载链接
      const link = document.createElement('a')
      link.href = agent.url
      link.download = `${agent.name}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // 打开外部链接
      window.open(agent.url, '_blank')
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'download':
        return <Download size={18} />
      case 'chat':
        return <Play size={18} />
      default:
        return <ExternalLink size={18} />
    }
  }

  const getActionText = (type: string) => {
    switch (type) {
      case 'download':
        return '下载使用'
      case 'chat':
        return '开始对话'
      default:
        return '打开使用'
    }
  }

  return (
    <section id="agents" className="py-16 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            我的AI智能体
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            精心开发的AI智能体，助力您的工作和学习效率
          </p>
          
          {/* 智能搜索和筛选系统 */}
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* 搜索栏 */}
            <div className="relative max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="搜索智能体名称、功能..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all duration-300 text-gray-700 placeholder-gray-400"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </motion.button>
                )}
              </motion.div>
            </div>

            {/* 功能分类按钮 - 居中显示 */}
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`relative inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <span className="text-base">{category.icon}</span>
                  <span>{category.name}</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {getCategoryCount(category.id)}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {/* 排序和视图控制 - 单独一行 */}
            <div className="flex items-center justify-center gap-4">
              {/* 排序选择 */}
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-md border border-gray-200">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'downloads' | 'latest')}
                  className="text-sm text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                >
                  <option value="latest">最新发布</option>
                  <option value="downloads">使用热度</option>
                  <option value="name">名称排序</option>
                </select>
              </div>
              
              {/* 视图切换 */}
              <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-md border border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-indigo-500 text-white shadow-md' 
                      : 'text-gray-500 hover:text-indigo-500'
                  }`}
                >
                  <Grid size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-indigo-500 text-white shadow-md' 
                      : 'text-gray-500 hover:text-indigo-500'
                  }`}
                >
                  <List size={16} />
                </motion.button>
              </div>
            </div>
            
            {/* 搜索结果提示 */}
            {(searchQuery || selectedCategory !== '全部') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-sm text-gray-600">
                  {searchQuery ? (
                    <>找到 <span className="font-semibold text-indigo-600">{filteredAgents.length}</span> 个包含 "<span className="font-medium">{searchQuery}</span>" 的智能体</>
                  ) : (
                    <>
                      <span className="font-medium">{categories.find(c => c.id === selectedCategory)?.name}</span> 
                      类别共有 <span className="font-semibold text-indigo-600">{filteredAgents.length}</span> 个智能体
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {filteredAgents.length === 0 ? (
          // 无结果状态
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <Bot size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无匹配的智能体</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery ? 
                `没有找到包含"${searchQuery}"的智能体，请尝试其他关键词` :
                `该分类下暂无智能体，更多智能体正在开发中`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery('')}
                  className="btn-bounce px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl"
                >
                  清除搜索
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedCategory('全部')
                  setSearchQuery('')
                }}
                className="btn-bounce px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-medium hover:bg-indigo-600 hover:text-white transition-all duration-300"
              >
                查看全部智能体
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6' 
              : 'space-y-4'
          }`}>
            {filteredAgents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`card-interactive group cursor-pointer ${
                viewMode === 'grid' ? 'bento-card' : 'bento-card flex gap-6 items-center'
              }`}
              onClick={() => handleAgentClick(agent)}
            >
              {viewMode === 'grid' ? (
                // 网格视图
                <>
                  <div className="relative overflow-hidden rounded-xl mb-4">
                    <Image
                      src={agent.image}
                      alt={agent.name}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Bot size={24} className="text-indigo-600" />
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-gray-600 line-clamp-2">
                        {agent.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {agent.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-bounce w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {getActionIcon(agent.type)}
                      {getActionText(agent.type)}
                    </motion.button>
                  </div>
                </>
              ) : (
                // 列表视图
                <>
                  <div className="relative overflow-hidden rounded-xl w-32 h-20 flex-shrink-0">
                    <Image
                      src={agent.image}
                      alt={agent.name}
                      width={128}
                      height={80}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {agent.name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-1">
                          {agent.description}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-bounce flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-sm font-medium shadow-lg hover:shadow-xl"
                      >
                        {getActionIcon(agent.type)}
                        {getActionText(agent.type)}
                      </motion.button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {agent.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
          </div>
        )}

        {/* 更多智能体提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 mb-4">持续更新中，敬请期待更多智能体...</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-bounce inline-flex items-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-medium hover:bg-indigo-600 hover:text-white transition-all duration-300"
          >
            <Bot size={20} className="mr-2" />
            定制智能体
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
} 