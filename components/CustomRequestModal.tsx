'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, FileText, MessageSquare, Bot } from 'lucide-react'
import { requestOperations } from '../lib/database'

interface CustomRequestModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'agent' | 'prompt' | 'resource'
}

export default function CustomRequestModal({ isOpen, onClose, type }: CustomRequestModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    description: '',
    requirements: '',
    urgency: '普通',
    contact: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const getTypeInfo = () => {
    switch (type) {
      case 'agent':
        return {
          title: '定制智能体',
          icon: <Bot size={24} className="text-indigo-600" />,
          placeholder: '请详细描述您需要的智能体功能、使用场景、对话风格等要求...',
          examples: '例如：客服机器人、学习助手、代码审查助手等'
        }
      case 'prompt':
        return {
          title: '定制提示词',
          icon: <MessageSquare size={24} className="text-violet-600" />,
          placeholder: '请详细描述您需要的提示词应用场景、期望效果、输出格式等要求...',
          examples: '例如：论文写作、创意文案、数据分析、教学设计等'
        }
      case 'resource':
        return {
          title: '定制教学资源',
          icon: <FileText size={24} className="text-blue-600" />,
          placeholder: '请详细描述您需要的教学资源类型、学科、年级、教学目标等要求...',
          examples: '例如：PPT课件、实训案例、考试题库、教学视频等'
        }
    }
  }

  const typeInfo = getTypeInfo()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 准备提交数据
      const request = {
        type,
        name: form.name,
        email: form.email,
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        urgency: form.urgency,
        contact: form.contact,
        status: '待处理' as const
      }

      // 先尝试保存到数据库
      const dbResult = await requestOperations.create(request)
      
      if (dbResult) {
        console.log('✅ 定制申请已保存到数据库:', dbResult)
      } else {
        console.warn('⚠️ 数据库保存失败，回退到localStorage')
        // 如果数据库保存失败，回退到localStorage
        const localRequest = {
          id: Date.now().toString(),
          ...request,
          createdAt: new Date().toISOString()
        }
        const existingRequests = JSON.parse(localStorage.getItem('custom_requests') || '[]')
        localStorage.setItem('custom_requests', JSON.stringify([...existingRequests, localRequest]))
      }

      setIsSubmitting(false)
      setSubmitted(true)

      // 3秒后关闭模态框
      setTimeout(() => {
        setSubmitted(false)
        setForm({
          name: '',
          email: '',
          title: '',
          description: '',
          requirements: '',
          urgency: '普通',
          contact: ''
        })
        onClose()
      }, 3000)
    } catch (error) {
      console.error('❌ 提交定制申请失败:', error)
      // 发生错误时也回退到localStorage
      const localRequest = {
        id: Date.now().toString(),
        type,
        ...form,
        status: '待处理',
        createdAt: new Date().toISOString()
      }
      const existingRequests = JSON.parse(localStorage.getItem('custom_requests') || '[]')
      localStorage.setItem('custom_requests', JSON.stringify([...existingRequests, localRequest]))
      
      setIsSubmitting(false)
      setSubmitted(true)

      // 3秒后关闭模态框
      setTimeout(() => {
        setSubmitted(false)
        setForm({
          name: '',
          email: '',
          title: '',
          description: '',
          requirements: '',
          urgency: '普通',
          contact: ''
        })
        onClose()
      }, 3000)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 模态框 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
        >
          {!submitted ? (
            <>
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {typeInfo.icon}
                  <h2 className="text-2xl font-bold text-gray-900">{typeInfo.title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        您的姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="请输入您的姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        邮箱地址 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* 项目标题 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      定制标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder={`请简述您需要的${typeInfo.title.replace('定制', '')}`}
                    />
                  </div>

                  {/* 基本描述 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      基本描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                      placeholder={`请简要描述您的需求...`}
                    />
                  </div>

                  {/* 详细需求 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      详细需求 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="requirements"
                      value={form.requirements}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                      placeholder={typeInfo.placeholder}
                    />
                    <p className="text-xs text-gray-500 mt-1">{typeInfo.examples}</p>
                  </div>

                  {/* 紧急程度和联系方式 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        紧急程度
                      </label>
                      <select
                        name="urgency"
                        value={form.urgency}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="普通">普通 (1-2周)</option>
                        <option value="紧急">紧急 (3-5天)</option>
                        <option value="特急">特急 (1-2天)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        联系方式
                      </label>
                      <input
                        type="text"
                        name="contact"
                        value={form.contact}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="微信/QQ/手机号（可选）"
                      />
                    </div>
                  </div>

                  {/* 提交按钮 */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      {isSubmitting ? '提交中...' : '提交申请'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* 成功提交状态 */
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">提交成功！</h3>
              <p className="text-gray-600 mb-4">
                您的{typeInfo.title}申请已收到，我们会在24小时内与您联系。
              </p>
              <p className="text-sm text-gray-500">
                此窗口将在3秒后自动关闭...
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
} 