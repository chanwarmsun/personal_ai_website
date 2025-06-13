'use client'

import { motion } from 'framer-motion'
import { Bot, ExternalLink, Download, Play, Filter, Grid, List } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import contentData from '../data/content.json'

export default function AgentsSection() {
  const { agents } = contentData
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTag, setSelectedTag] = useState<string>('全部')
  
  // 获取所有标签
  const allTags = ['全部', ...Array.from(new Set(agents.flatMap(agent => agent.tags)))]
  
  // 筛选智能体
  const filteredAgents = selectedTag === '全部' 
    ? agents 
    : agents.filter(agent => agent.tags.includes(selectedTag))

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
          
          {/* 筛选器和视图切换 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            {/* 标签筛选 */}
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <motion.button
                  key={tag}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedTag === tag
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200'
                  }`}
                >
                  {tag}
                </motion.button>
              ))}
            </div>
            
            {/* 视图切换 */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-md border border-gray-200">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-indigo-500'
                }`}
              >
                <Grid size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-indigo-500'
                }`}
              >
                <List size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>

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