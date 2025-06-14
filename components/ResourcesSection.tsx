'use client'

import { motion } from 'framer-motion'
import { FileText, Download, BookOpen, Award, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import contentData from '../data/content.json'
import CustomRequestModal from './CustomRequestModal'

export default function ResourcesSection() {
  const [allResources, setAllResources] = useState(contentData.teachingResources)
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    // 合并原始数据和自定义数据
    const customResources = localStorage.getItem('custom_resources')
    if (customResources) {
      const parsed = JSON.parse(customResources)
      setAllResources([...contentData.teachingResources, ...parsed])
    }
  }, [])

  const handleDownload = (resource: any) => {
    // 创建下载链接
    const link = document.createElement('a')
    link.href = resource.downloadUrl
    link.download = `${resource.title}.${resource.downloadUrl.split('.').pop()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '初级':
      case '学生用':
        return 'bg-green-100 text-green-700'
      case '中级':
      case '教师用':
        return 'bg-yellow-100 text-yellow-700'
      case '高级':
      case '通用':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '教程':
        return <BookOpen size={20} className="text-blue-500" />
      case '项目':
        return <Award size={20} className="text-green-500" />
      case '速查表':
        return <FileText size={20} className="text-purple-500" />
      case '模板':
        return <FileText size={20} className="text-orange-500" />
      case '课件':
        return <BookOpen size={20} className="text-indigo-500" />
      case '实训':
        return <Award size={20} className="text-red-500" />
      case '案例':
        return <FileText size={20} className="text-green-500" />
      case '工具':
        return <FileText size={20} className="text-purple-500" />
      default:
        return <FileText size={20} className="text-gray-500" />
    }
  }

  const formatDownloads = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <section id="resources" className="py-16 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            教学资源下载区
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            专为教师设计的AI教育资源包，助力现代化教学实践
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {allResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bento-card group cursor-pointer"
              onClick={() => handleDownload(resource)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  {getTypeIcon(resource.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(resource.difficulty)}`}>
                      {resource.difficulty}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {resource.type}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                    {resource.description}
                  </p>
                </div>
              </div>

              {/* 文件信息 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>大小: {resource.size}</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      <span>{formatDownloads(resource.downloads)} 下载</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Download size={14} />
                    <span>点击下载</span>
                  </div>
                </div>
              </div>

              {/* 下载按钮 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-bounce w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download size={18} />
                立即下载
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* 更多资源 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 mb-4">更多教学资源持续更新中...</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRequestModal(true)}
            className="btn-bounce inline-flex items-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-medium hover:bg-indigo-600 hover:text-white transition-all duration-300"
          >
            <BookOpen size={20} className="mr-2" />
            申请定制资源
          </motion.button>
        </motion.div>
      </div>
      
      {/* 定制申请模态框 */}
      <CustomRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        type="resource"
      />
    </section>
  )
} 