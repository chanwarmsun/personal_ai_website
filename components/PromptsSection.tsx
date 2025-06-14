'use client'

import { motion } from 'framer-motion'
import { Hash, Download, Copy, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import contentData from '../data/content.json'
import CustomRequestModal from './CustomRequestModal'
import { promptOperations } from '../lib/database'

export default function PromptsSection() {
  const [allPrompts, setAllPrompts] = useState(contentData.prompts)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadCustomPrompts()
  }, [])

  // 从数据库加载自定义提示词
  const loadCustomPrompts = async () => {
    try {
      const dbPrompts = await promptOperations.getAll()
      setAllPrompts([...contentData.prompts, ...dbPrompts])
    } catch (error) {
      console.error('加载自定义提示词失败:', error)
      // 如果数据库加载失败，回退到localStorage
      if (typeof window !== 'undefined' && localStorage) {
        const customPrompts = localStorage.getItem('custom_prompts')
        if (customPrompts) {
          const parsed = JSON.parse(customPrompts)
          setAllPrompts([...contentData.prompts, ...parsed])
        }
      }
    }
  }

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleDownload = (prompt: any) => {
    const blob = new Blob([prompt.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${prompt.title}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatDownloads = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <section id="prompts" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            精选提示词
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            经过实践验证的高质量提示词，助您释放AI的无限潜能
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allPrompts.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bento-card group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-violet-100 rounded-xl">
                  <Hash size={24} className="text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {prompt.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {prompt.description}
                  </p>
                </div>
              </div>

              {/* 提示词内容预览 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                  {prompt.content}
                </p>
              </div>

              {/* 标签和下载统计 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-violet-50 text-violet-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp size={16} className="mr-1" />
                  {formatDownloads(prompt.downloads)} 下载
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(prompt.content, prompt.id)}
                  className="btn-bounce flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300"
                >
                  <Copy size={18} />
                  {copiedId === prompt.id ? '已复制!' : '复制'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownload(prompt)}
                  className="btn-bounce flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Download size={18} />
                  下载
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 更多提示词 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 mb-4">更多高质量提示词正在整理中...</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRequestModal(true)}
            className="btn-bounce inline-flex items-center px-6 py-3 border-2 border-violet-600 text-violet-600 rounded-xl font-medium hover:bg-violet-600 hover:text-white transition-all duration-300"
          >
            <Hash size={20} className="mr-2" />
            定制提示词
          </motion.button>
        </motion.div>
      </div>
      
      {/* 定制申请模态框 */}
      <CustomRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        type="prompt"
      />
    </section>
  )
} 