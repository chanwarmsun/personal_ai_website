'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileText, Bot, Code, Hash } from 'lucide-react'
import Fuse from 'fuse.js'
import contentData from '../data/content.json'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  type: 'agent' | 'prompt' | 'resource'
  id: string
  title: string
  description: string
  tags?: string[]
  url?: string
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  // 创建搜索数据
  const searchData: SearchResult[] = [
    ...contentData.agents.map(agent => ({
      type: 'agent' as const,
      id: agent.id,
      title: agent.name,
      description: agent.description,
      tags: agent.tags,
      url: agent.url
    })),
    ...contentData.prompts.map(prompt => ({
      type: 'prompt' as const,
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      tags: prompt.tags
    })),
    ...contentData.teachingResources.map(resource => ({
      type: 'resource' as const,
      id: resource.id,
      title: resource.title,
      description: resource.description,
      url: resource.downloadUrl
    }))
  ]

  // 配置Fuse.js - 使用 useMemo 避免无限循环
  const fuse = useMemo(() => new Fuse(searchData, {
    keys: ['title', 'description', 'tags'],
    threshold: 0.3,
    includeScore: true
  }), [searchData])

  useEffect(() => {
    if (query.trim()) {
      const searchResults = fuse.search(query)
      setResults(searchResults.map(result => result.item))
    } else {
      setResults([])
    }
  }, [query, fuse])

  const getIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return <Bot size={20} className="text-blue-500" />
      case 'prompt':
        return <Hash size={20} className="text-purple-500" />
      case 'resource':
        return <FileText size={20} className="text-green-500" />
      default:
        return <Search size={20} className="text-gray-500" />
    }
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.url) {
      window.open(result.url, '_blank')
    } else {
      // 滚动到对应section
      const sectionMap = {
        agent: '#agents',
        prompt: '#prompts',
        resource: '#resources'
      }
      const section = document.querySelector(sectionMap[result.type])
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' })
      }
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* 搜索框 */}
              <div className="flex items-center p-4 border-b border-gray-100">
                <Search className="text-gray-400 mr-3" size={20} />
                <input
                  type="text"
                  placeholder="搜索智能体、提示词、教程..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 text-lg outline-none placeholder-gray-400"
                  autoFocus
                />
                <button
                  onClick={onClose}
                  className="ml-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 搜索结果 */}
              <div className="max-h-96 overflow-y-auto">
                {query.trim() === '' ? (
                  <div className="p-8 text-center text-gray-500">
                    <Search size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>输入关键词开始搜索</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>未找到相关结果</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {results.map((result, index) => (
                      <motion.div
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleResultClick(result)}
                        className="flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="mr-3 mt-1">
                          {getIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {result.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                          {result.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 