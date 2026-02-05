'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, Code, Zap, BookOpen, Database, Palette, Home, PenTool, TrendingUp, Clock, Grid, List, Filter, ChevronDown } from 'lucide-react'
import contentData from '../data/content.json'

interface Skill {
  id: string
  name: string
  description: string
  content: string
  image: string
  category: string  // 改为 string 以兼容 content.json
  version: string
  difficulty: string  // 改为 string 以兼容 content.json
  tags: string[]
  downloads: number
  file_url: string
}

const categories = [
  { id: '全部', name: '全部技能', icon: '🎯' },
  { id: '效率工具', name: '效率工具', icon: '⚡' },
  { id: '学习辅助', name: '学习辅助', icon: '📚' },
  { id: '数据处理', name: '数据处理', icon: '📊' },
  { id: '创意设计', name: '创意设计', icon: '🎨' },
  { id: '生活助手', name: '生活助手', icon: '🏠' },
  { id: '内容创作', name: '内容创作', icon: '✍️' }
]

const difficultyColors: { [key: string]: string } = {
  入门: 'bg-green-100 text-green-700',
  初级: 'bg-blue-100 text-blue-700',
  中级: 'bg-yellow-100 text-yellow-700',
  高级: 'bg-red-100 text-red-700'
}

export default function SkillsSection() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'downloads' | 'latest'>('latest')
  const [displayCount, setDisplayCount] = useState(8)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setLoading(true)
      // 直接从 content.json 加载数据
      const data = contentData.skills || []
      console.log('📥 加载技能数据:', data.length)
      setSkills(data)
    } catch (error) {
      console.error('加载技能失败:', error)
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (skill: Skill) => {
    try {
      // 记录下载
      await fetch('/api/skills/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: skill.id })
      })

      // 下载文件
      if (skill.file_url) {
        if (skill.file_url.startsWith('data:')) {
          // Base64 编码的文件
          const link = document.createElement('a')
          link.href = skill.file_url
          link.download = `${skill.name}.zip`
          link.click()
        } else {
          // URL 链接
          window.open(skill.file_url, '_blank')
        }
      }

      // 更新本地下载计数
      setSkills(prev => prev.map(s =>
        s.id === skill.id ? { ...s, downloads: (s.downloads || 0) + 1 } : s
      ))
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  // 过滤和排序技能
  const filteredSkills = skills
    .filter(skill => {
      const matchCategory = selectedCategory === '全部' || skill.category === selectedCategory
      const matchSearch = searchQuery === '' ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCategory && matchSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'downloads':
          return (b.downloads || 0) - (a.downloads || 0)
        case 'latest':
          return 0 // 默认顺序
        default:
          return 0
      }
    })

  const displaySkills = showAll ? filteredSkills : filteredSkills.slice(0, displayCount)

  if (loading) {
    return (
      <section id="skills" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (skills.length === 0 && !loading) {
    return null
  }

  return (
    <section id="skills" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-indigo-700 mb-4">AI 技能库</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            探索精选的 AI 技能，提升工作效率
          </p>
        </motion.div>

        {/* 搜索和筛选 */}
        <div className="mb-8 space-y-4">
          {/* 搜索框 */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索技能名称、描述或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
            />
          </div>

          {/* 分类和操作栏 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 分类选择 */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 排序和视图 */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 text-sm"
              >
                <option value="latest">最新</option>
                <option value="downloads">下载量</option>
                <option value="name">名称</option>
              </select>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 技能列表 */}
        {displaySkills.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500">未找到匹配的技能</p>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {displaySkills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden border border-gray-100 ${
                    viewMode === 'list' ? 'flex items-center gap-6 p-6' : ''
                  }`}
                >
                  {/* 技能卡片 */}
                  {skill.image && (
                    <div className={`relative ${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'h-48'}`}>
                      <img
                        src={skill.image}
                        alt={skill.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[skill.difficulty]}`}>
                          {skill.difficulty}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className={viewMode === 'list' ? 'flex-1' : 'p-5'}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{skill.name}</h3>
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs">
                        {skill.category}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{skill.description}</p>

                    {skill.tags && skill.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {skill.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                        {skill.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{skill.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>v{skill.version}</span>
                      <span className="flex items-center gap-1">
                        <Download size={14} />
                        {skill.downloads || 0}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownload(skill)}
                      className="w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      下载技能
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 加载更多按钮 */}
            {!showAll && filteredSkills.length > displayCount && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setDisplayCount(prev => prev + 8)}
                  className="px-8 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  加载更多
                </button>
              </div>
            )}

            {filteredSkills.length > displayCount && !showAll && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowAll(true)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  显示全部 {filteredSkills.length} 个技能
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
