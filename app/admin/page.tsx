'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import FileUploadComponent from '../../components/FileUploadComponent'
import { agentOperations, promptOperations, resourceOperations, requestOperations } from '../../lib/database'
import { carouselOperations, defaultContentOperations } from '../../lib/carousel-operations'

const modules = [
  { key: 'carousel', name: '轮播管理', desc: '管理首页轮播图片，支持增删改查', icon: '🎠' },
  { key: 'agents', name: '智能体', desc: '管理AI智能体，支持增删改查', icon: '🤖' },
  { key: 'prompts', name: '提示词', desc: '管理AI提示词，支持增删改查', icon: '💡' },
  { key: 'resources', name: 'AI教学资源', desc: '管理教学资源，支持增删改查', icon: '📚' },
  { key: 'default-content', name: '默认内容', desc: '编辑网站默认内容（智能体、提示词、资源）', icon: '📋' },
  { key: 'requests', name: '定制申请', desc: '查看用户定制申请，支持状态管理', icon: '📝' },
  { key: 'analytics', name: '数据统计', desc: '查看网站访问统计和用户行为分析', icon: '📊' },
]

const defaultAgent = { 
  name: '', 
  description: '', 
  image: '', 
  type: 'chat', 
  url: '', 
  tags: [] 
}

const defaultPrompt = {
  title: '',
  description: '',
  content: '',
  tags: [],
  downloads: 0
}

const defaultResource = {
  title: '',
  description: '',
  type: '课件',
  difficulty: '教师用',
  size: '',
  downloadUrl: '',
  download_url: '',
  downloads: 0
}

const defaultCarouselItem = {
  title: '',
  image: '',
  description: ''
}

export default function AdminPage() {
  const [active, setActive] = useState('carousel')
  const [agents, setAgents] = useState<any[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [carousel, setCarousel] = useState<any[]>([])
  const [defaultContent, setDefaultContent] = useState<any>({})
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<any>({...defaultCarouselItem, tags: []})
  const [tagInput, setTagInput] = useState('')
  const [editingDefaultItem, setEditingDefaultItem] = useState<{type: string, index: number} | null>(null)
  const [defaultEditForm, setDefaultEditForm] = useState<any>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const defaultImageInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin-login')
      return
    }
    // 加载数据
    loadCarousel()
    loadAgents()
    loadPrompts()
    loadResources()
    loadRequests()
    loadDefaultContent()
  }, [])

  const loadAgents = async () => {
    try {
      console.log('🔍 开始加载智能体数据...')
      const dbAgents = await agentOperations.getAll()
      console.log('📊 从数据库获取的智能体:', dbAgents)
      setAgents(dbAgents)
      console.log('✅ 智能体状态已更新')
    } catch (error) {
      console.error('加载智能体失败:', error)
      // 回退到localStorage
      const saved = localStorage.getItem('custom_agents')
      if (saved) {
        setAgents(JSON.parse(saved))
      }
    }
  }

  const loadPrompts = async () => {
    try {
      const dbPrompts = await promptOperations.getAll()
      setPrompts(dbPrompts)
    } catch (error) {
      console.error('加载提示词失败:', error)
      // 回退到localStorage
      const saved = localStorage.getItem('custom_prompts')
      if (saved) {
        setPrompts(JSON.parse(saved))
      }
    }
  }

  const loadResources = async () => {
    try {
      const dbResources = await resourceOperations.getAll()
      // 处理字段映射：download_url -> downloadUrl
      const formattedResources = dbResources.map(resource => ({
        ...resource,
        downloadUrl: resource.download_url
      }))
      setResources(formattedResources)
    } catch (error) {
      console.error('加载教学资源失败:', error)
      // 回退到localStorage
      const saved = localStorage.getItem('custom_resources')
      if (saved) {
        setResources(JSON.parse(saved))
      }
    }
  }

  const loadRequests = async () => {
    try {
      const dbRequests = await requestOperations.getAll()
      setRequests(dbRequests)
    } catch (error) {
      console.error('加载定制申请失败:', error)
      // 回退到localStorage
      const saved = localStorage.getItem('custom_requests')
      if (saved) {
        setRequests(JSON.parse(saved))
      }
    }
  }

  const loadCarousel = async () => {
    try {
      const carouselData = await carouselOperations.getAll()
      const formattedData = carouselData.map(item => ({
        id: item.id,
        title: item.title,
        image: item.image,
        description: item.description
      }))
      setCarousel(formattedData)
    } catch (error) {
      console.error('加载轮播数据失败:', error)
      // 回退到localStorage
      const saved = localStorage.getItem('custom_carousel')
      if (saved) {
        setCarousel(JSON.parse(saved))
      }
    }
  }

  const loadDefaultContent = async () => {
    try {
      // 首先尝试从数据库加载
      const dbContent = await defaultContentOperations.get('website_default')
      if (dbContent) {
        setDefaultContent(dbContent)
        return
      }
      
      // 如果数据库没有，从文件加载
      const response = await fetch('/data/content.json')
      const data = await response.json()
      setDefaultContent(data)
    } catch (error) {
      console.error('加载默认内容失败:', error)
      // 如果无法加载，使用静态导入的备份
      try {
        const contentData = await import('../../data/content.json')
        setDefaultContent(contentData.default)
      } catch (importError) {
        console.error('导入备份内容失败:', importError)
      }
    }
  }

  const saveAgents = async (newAgents: any[]) => {
    setAgents(newAgents)
    // 同时保存到localStorage作为备份
    localStorage.setItem('custom_agents', JSON.stringify(newAgents))
  }

  const savePrompts = async (newPrompts: any[]) => {
    setPrompts(newPrompts)
    // 同时保存到localStorage作为备份
    localStorage.setItem('custom_prompts', JSON.stringify(newPrompts))
  }

  const saveResources = async (newResources: any[]) => {
    setResources(newResources)
    // 同时保存到localStorage作为备份
    localStorage.setItem('custom_resources', JSON.stringify(newResources))
  }

  const saveCarousel = async (newCarousel: any[]) => {
    setCarousel(newCarousel)
    // 同时保存到localStorage作为备份
    localStorage.setItem('custom_carousel', JSON.stringify(newCarousel))
    
    // 保存到数据库
    try {
      // 这里可以添加更复杂的同步逻辑
      console.log('轮播数据已保存到本地存储，数据库同步功能待实现')
    } catch (error) {
      console.error('保存轮播数据失败:', error)
    }
  }

  const saveDefaultContent = async (newContent: any) => {
    setDefaultContent(newContent)
    try {
      // 保存到数据库
      await defaultContentOperations.save('website_default', newContent)
      // 同时保存到localStorage作为备份
      localStorage.setItem('default_content_backup', JSON.stringify(newContent))
      console.log('默认内容已保存到数据库')
    } catch (error) {
      console.error('保存默认内容失败:', error)
      // 至少保存到localStorage
      localStorage.setItem('default_content_backup', JSON.stringify(newContent))
    }
  }

  const updateRequestStatus = (index: number, status: string) => {
    const updated = requests.map((req, i) => 
      i === index ? { ...req, status } : req
    )
    setRequests(updated)
    localStorage.setItem('custom_requests', JSON.stringify(updated))
  }

  const deleteRequest = (index: number) => {
    if (window.confirm('确定要删除该申请吗？')) {
      const updated = requests.filter((_, i) => i !== index)
      setRequests(updated)
      localStorage.setItem('custom_requests', JSON.stringify(updated))
    }
  }

  const getCurrentData = () => {
    if (active === 'carousel') return carousel
    if (active === 'agents') return agents
    if (active === 'prompts') return prompts
    if (active === 'resources') return resources
    if (active === 'default-content') return []
    return []
  }

  const getCurrentDefault = () => {
    if (active === 'carousel') return defaultCarouselItem
    if (active === 'agents') return defaultAgent
    if (active === 'prompts') return defaultPrompt
    if (active === 'resources') return defaultResource
    return defaultCarouselItem  // 默认返回轮播项
  }

  const handleSwitchModule = (moduleKey: string) => {
    setActive(moduleKey)
    setEditingIndex(null)
    
    // 如果是analytics模块，直接跳转到专门的页面
    if (moduleKey === 'analytics') {
      router.push('/admin/analytics')
      return
    }
    
    let defaultForm: any = getCurrentDefault()
    // 确保tags字段存在
    if (moduleKey === 'agents' || moduleKey === 'prompts') {
      defaultForm = { ...defaultForm, tags: defaultForm.tags || [] }
    }
    setForm(defaultForm)
    setTagInput('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm((f: any) => ({ ...f, [name]: value }))
  }

  const handleImage = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev: any) => {
        setForm((f: any) => ({ ...f, image: ev.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !(form.tags || []).includes(tagInput.trim())) {
      setForm((f: any) => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setForm((f: any) => ({ ...f, tags: (f.tags || []).filter((t: string) => t !== tagToRemove) }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
    // 验证必填字段
    let requiredField = ''
    if (active === 'carousel') requiredField = 'title'
    else if (active === 'agents') requiredField = 'name'
    else requiredField = 'title'
    
    if (!form[requiredField]?.trim()) {
      alert(`请填写${requiredField === 'name' ? '名称' : '标题'}`)
      return
    }
    
    console.log('🚀 开始提交表单:', { active, form, editingIndex })
    console.log('📋 表单完整内容:', JSON.stringify(form, null, 2))
    console.log('🏷️ 表单tags字段:', form.tags, '类型:', typeof form.tags)
    
    try {
      if (editingIndex !== null) {
        // 更新现有项目
        if (active === 'carousel') {
          const updated = await carouselOperations.update(form.id, {
            title: form.title,
            image: form.image,
            description: form.description
          })
          if (updated) {
            await loadCarousel()
          }
        } else if (active === 'agents') {
          const updated = await agentOperations.update(form.id, form)
          if (updated) {
            // 直接重新加载数据，不需要手动更新状态
            await loadAgents()
          }
        } else if (active === 'prompts') {
          const updated = await promptOperations.update(form.id, form)
          if (updated) {
            // 直接重新加载数据，不需要手动更新状态
            await loadPrompts()
          }
        } else {
          const { downloadUrl, ...updateData } = form
          const updated = await resourceOperations.update(form.id, {
            ...updateData,
            download_url: downloadUrl || form.download_url
          })
          if (updated) {
            // 直接重新加载数据，不需要手动更新状态
            await loadResources()
          }
        }
        setEditingIndex(null)
      } else {
        // 创建新项目
        if (active === 'carousel') {
          const created = await carouselOperations.create({
            title: form.title,
            image: form.image,
            description: form.description,
            order_index: carousel.length
          })
          if (created) {
            await loadCarousel()
          }
        } else if (active === 'agents') {
          console.log('📝 创建智能体:', form)
          // 验证必须字段
          if (!form.name?.trim()) {
            alert('请填写智能体名称')
            return
          }
          if (!form.description?.trim()) {
            alert('请填写智能体描述')
            return
          }
          if (!form.url?.trim()) {
            alert('请填写智能体链接')
            return
          }
          
          // 确保不包含id字段
          const { id, ...agentData } = form
          console.log('📝 清理后的数据:', agentData)
          const created = await agentOperations.create(agentData)
          console.log('✅ 创建结果:', created)
          if (created) {
            // 直接重新加载数据，不需要手动更新状态
            await loadAgents()
            console.log('🔄 重新加载智能体完成')
            alert('智能体创建成功！')
          } else {
            alert('智能体创建失败，请检查控制台错误信息')
          }
        } else if (active === 'prompts') {
          console.log('📝 创建提示词:', form)
          // 验证必须字段
          if (!form.title?.trim()) {
            alert('请填写提示词标题')
            return
          }
          if (!form.description?.trim()) {
            alert('请填写提示词描述')
            return
          }
          if (!form.content?.trim()) {
            alert('请填写提示词内容')
            return
          }
          
          // 确保不包含id字段
          const { id, ...promptData } = form
          console.log('📝 清理后的数据:', promptData)
          const created = await promptOperations.create(promptData)
          console.log('✅ 创建结果:', created)
          if (created) {
            // 直接重新加载数据，不需要手动更新状态
            await loadPrompts()
            console.log('🔄 重新加载提示词完成')
            alert('提示词创建成功！')
          } else {
            alert('提示词创建失败，请检查控制台错误信息')
          }
        } else {
          console.log('📝 创建教学资源:', form)
          // 验证必须字段
          if (!form.title?.trim()) {
            alert('请填写资源标题')
            return
          }
          if (!form.description?.trim()) {
            alert('请填写资源描述')
            return
          }
          
          // 确保不包含id字段，并处理字段映射
          const { id, downloadUrl, ...resourceData } = form
          const finalData = {
            ...resourceData,
            download_url: downloadUrl || form.download_url || ''
          }
          console.log('📝 清理后的数据:', finalData)
          const created = await resourceOperations.create(finalData)
          console.log('✅ 创建结果:', created)
          if (created) {
            // 直接重新加载数据，不需要手动更新状态
            await loadResources()
            console.log('🔄 重新加载教学资源完成')
            alert('教学资源创建成功！')
          } else {
            alert('教学资源创建失败，请检查控制台错误信息')
          }
        }
      }
      
      setForm(getCurrentDefault())
      setTagInput('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试。错误详情: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const handleEdit = (idx: number) => {
    setEditingIndex(idx)
    setForm(getCurrentData()[idx])
  }

  const handleDelete = async (idx: number) => {
    let itemName = ''
    if (active === 'carousel') itemName = '轮播图片'
    else if (active === 'agents') itemName = '智能体'
    else if (active === 'prompts') itemName = '提示词'
    else itemName = '教学资源'
    
    if (window.confirm(`确定要删除该${itemName}吗？`)) {
      try {
        const currentData = getCurrentData()
        const item = currentData[idx]
        
        // 从数据库删除
        if (active === 'carousel') {
          const item = carousel[idx]
          const success = await carouselOperations.delete(item.id)
          if (success) {
            await loadCarousel()
          }
        } else if (active === 'agents') {
          const success = await agentOperations.delete(item.id)
          if (success) {
            // 直接重新加载数据，不需要手动更新状态
            await loadAgents()
          }
        } else if (active === 'prompts') {
          const success = await promptOperations.delete(item.id)
          if (success) {
            // 直接重新加载数据，不需要手动更新状态
            await loadPrompts()
          }
        } else {
          const success = await resourceOperations.delete(item.id)
          if (success) {
            // 直接重新加载数据，不需要手动更新状态
            await loadResources()
          }
        }
        
        setEditingIndex(null)
        setForm(getCurrentDefault())
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (error) {
        console.error('删除失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setForm(getCurrentDefault())
    setTagInput('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    router.push('/')
  }

  const handleDefaultContentEdit = (type: string, index: number, item: any) => {
    setEditingDefaultItem({ type, index })
    setDefaultEditForm({ ...item })
  }

  const handleDefaultContentSave = async () => {
    if (!editingDefaultItem) return
    
    const { type, index } = editingDefaultItem
    const updatedContent = { ...defaultContent }
    
    if (type === 'agents') {
      updatedContent.agents[index] = { ...defaultEditForm }
    } else if (type === 'prompts') {
      updatedContent.prompts[index] = { ...defaultEditForm }
    } else if (type === 'teachingResources') {
      updatedContent.teachingResources[index] = { ...defaultEditForm }
    }
    
    await saveDefaultContent(updatedContent)
    setEditingDefaultItem(null)
    setDefaultEditForm({})
  }

  const handleDefaultContentCancel = () => {
    setEditingDefaultItem(null)
    setDefaultEditForm({})
  }

  const handleDefaultFormChange = (e: any) => {
    const { name, value } = e.target
    setDefaultEditForm((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleDefaultImageUpload = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setDefaultEditForm((prev: any) => ({ ...prev, image: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addDefaultTag = (tagValue: string) => {
    if (tagValue.trim() && !defaultEditForm.tags?.includes(tagValue.trim())) {
      setDefaultEditForm((prev: any) => ({
        ...prev,
        tags: [...(prev.tags || []), tagValue.trim()]
      }))
    }
  }

  const removeDefaultTag = (tagToRemove: string) => {
    setDefaultEditForm((prev: any) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag: string) => tag !== tagToRemove)
    }))
  }

  const renderCarouselModule = () => (
    <div>
      <h2 className="text-xl font-bold mb-4 text-indigo-600">轮播管理</h2>
      <p className="text-sm text-gray-500 mb-6">管理首页轮播图片，新增的图片将显示在首页轮播中</p>
      
      {/* 图片尺寸提示 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">💡</span>
          <div className="text-sm text-blue-800">
            <strong>图片尺寸建议：</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>推荐尺寸：800x400 像素（2:1 比例）</li>
              <li>最小尺寸：600x300 像素</li>
              <li>文件格式：JPG、PNG、WebP</li>
              <li>文件大小：建议不超过 2MB</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 列表 */}
      <div className="mb-8">
        {carousel.length === 0 && <div className="text-gray-400 text-center py-8">暂无自定义轮播图片</div>}
        {carousel.map((item, i) => (
          <div key={i} className="flex items-center gap-4 border-b py-3">
            <img src={item.image || '/placeholder.png'} alt="轮播图" className="w-20 h-12 rounded-lg object-cover bg-gray-100 border" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-indigo-700 truncate">{item.title}</div>
              <div className="text-gray-500 text-sm truncate">{item.description}</div>
            </div>
            <button onClick={() => handleEdit(i)} className="px-3 py-1 text-xs rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 mr-2">编辑</button>
            <button onClick={() => handleDelete(i)} className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button>
          </div>
        ))}
      </div>
      
      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
        <div className="flex gap-4 items-start">
          <div>
            <label className="block text-sm font-medium mb-1">图片</label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} className="block w-24 text-xs" />
            {form.image && <img src={form.image} alt="预览" className="w-20 h-12 rounded-lg mt-2 object-cover border" />}
          </div>
          <div className="flex-1 space-y-2">
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              placeholder="轮播标题" 
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" 
            />
            <input 
              name="image" 
              value={form.image} 
              onChange={handleChange} 
              placeholder="图片URL" 
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" 
            />
          </div>
        </div>
        <textarea 
          name="description" 
          value={form.description} 
          onChange={handleChange} 
          placeholder="图片描述" 
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" 
          rows={3} 
        />
        <div className="flex gap-3 justify-end">
          {editingIndex !== null && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">取消</button>}
          <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow hover:shadow-lg transition-all duration-200">
            {editingIndex !== null ? '保存修改' : '新增轮播'}
          </button>
        </div>
      </form>
    </div>
  )

  const renderDefaultContentModule = () => (
    <div>
      <h2 className="text-xl font-bold mb-4 text-indigo-600">默认内容管理</h2>
      <p className="text-sm text-gray-500 mb-6">编辑网站默认内容，这些修改将直接影响首页显示</p>
      
      <div className="space-y-8">
        {/* 默认智能体 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">默认智能体</h3>
          <div className="space-y-4">
            {defaultContent?.agents?.map((agent: any, i: number) => (
              <div key={i} className="border rounded-lg bg-gray-50 overflow-hidden">
                {editingDefaultItem?.type === 'agents' && editingDefaultItem?.index === i ? (
                  // 编辑模式
                  <div className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">智能体名称</label>
                          <input
                            name="name"
                            value={defaultEditForm.name || ''}
                            onChange={handleDefaultFormChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                            placeholder="输入智能体名称"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                          <textarea
                            name="description"
                            value={defaultEditForm.description || ''}
                            onChange={handleDefaultFormChange}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                            placeholder="输入智能体描述"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">链接地址</label>
                          <input
                            name="url"
                            value={defaultEditForm.url || ''}
                            onChange={handleDefaultFormChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                            placeholder="输入链接地址"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                          <select
                            name="type"
                            value={defaultEditForm.type || 'chat'}
                            onChange={handleDefaultFormChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                          >
                            <option value="chat">对话类型</option>
                            <option value="download">下载类型</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">封面图片</label>
                          <input
                            type="file"
                            accept="image/*"
                            ref={defaultImageInputRef}
                            onChange={handleDefaultImageUpload}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                          />
                          {defaultEditForm.image && (
                            <div className="mt-2">
                              <img src={defaultEditForm.image} alt="预览" className="w-24 h-24 rounded-lg object-cover border" />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="输入标签"
                              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addDefaultTag((e.target as HTMLInputElement).value)
                                  ;(e.target as HTMLInputElement).value = ''
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                                if (input) {
                                  addDefaultTag(input.value)
                                  input.value = ''
                                }
                              }}
                              className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                            >
                              添加
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(defaultEditForm.tags || []).map((tag: string) => (
                              <span key={tag} className="px-3 py-1 bg-indigo-100 text-indigo-600 text-sm rounded-full flex items-center gap-2">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeDefaultTag(tag)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                      <button
                        onClick={handleDefaultContentCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleDefaultContentSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        保存修改
                      </button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <div className="flex items-center gap-4 p-4">
                    <img src={agent.image} alt="智能体" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{agent.name}</div>
                      <div className="text-gray-600 text-sm">{agent.description}</div>
                      <div className="flex gap-1 mt-1">
                        {(agent.tags || []).map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDefaultContentEdit('agents', i, agent)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      编辑
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 默认提示词 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">默认提示词</h3>
          <div className="space-y-4">
            {defaultContent?.prompts?.map((promptItem: any, i: number) => (
              <div key={i} className="border rounded-lg bg-gray-50 overflow-hidden">
                {editingDefaultItem?.type === 'prompts' && editingDefaultItem?.index === i ? (
                  // 编辑模式
                  <div className="p-6 bg-white">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">提示词标题</label>
                        <input
                          name="title"
                          value={defaultEditForm.title || ''}
                          onChange={handleDefaultFormChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                          placeholder="输入提示词标题"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                        <textarea
                          name="description"
                          value={defaultEditForm.description || ''}
                          onChange={handleDefaultFormChange}
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                          placeholder="输入提示词描述"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">提示词内容</label>
                        <textarea
                          name="content"
                          value={defaultEditForm.content || ''}
                          onChange={handleDefaultFormChange}
                          rows={4}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                          placeholder="输入提示词内容"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="输入标签"
                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addDefaultTag((e.target as HTMLInputElement).value)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                              if (input) {
                                addDefaultTag(input.value)
                                input.value = ''
                              }
                            }}
                            className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                          >
                            添加
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(defaultEditForm.tags || []).map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-green-100 text-green-600 text-sm rounded-full flex items-center gap-2">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeDefaultTag(tag)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                      <button
                        onClick={handleDefaultContentCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleDefaultContentSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        保存修改
                      </button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-gray-800">{promptItem.title}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">下载: {promptItem.downloads}</span>
                        <button
                          onClick={() => handleDefaultContentEdit('prompts', i, promptItem)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                    <div className="text-gray-600 text-sm mb-2">{promptItem.description}</div>
                    <div className="flex gap-1">
                      {(promptItem.tags || []).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 默认教学资源 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">默认教学资源</h3>
          <div className="space-y-4">
            {defaultContent?.teachingResources?.map((resource: any, i: number) => (
              <div key={i} className="border rounded-lg bg-gray-50 overflow-hidden">
                {editingDefaultItem?.type === 'teachingResources' && editingDefaultItem?.index === i ? (
                  // 编辑模式
                  <div className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">资源标题</label>
                          <input
                            name="title"
                            value={defaultEditForm.title || ''}
                            onChange={handleDefaultFormChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                            placeholder="输入资源标题"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                          <textarea
                            name="description"
                            value={defaultEditForm.description || ''}
                            onChange={handleDefaultFormChange}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                            placeholder="输入资源描述"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">下载链接</label>
                          <input
                            name="downloadUrl"
                            value={defaultEditForm.downloadUrl || ''}
                            onChange={handleDefaultFormChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                            placeholder="输入下载链接"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">资源类型</label>
                          <select
                            name="type"
                            value={defaultEditForm.type || '课件'}
                            onChange={handleDefaultFormChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                          >
                            <option value="课件">课件</option>
                            <option value="教案">教案</option>
                            <option value="视频">视频</option>
                            <option value="文档">文档</option>
                            <option value="工具">工具</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">适用对象</label>
                          <select
                            name="difficulty"
                            value={defaultEditForm.difficulty || '教师用'}
                            onChange={handleDefaultFormChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                          >
                            <option value="教师用">教师用</option>
                            <option value="学生用">学生用</option>
                            <option value="通用">通用</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">文件大小</label>
                          <input
                            name="size"
                            value={defaultEditForm.size || ''}
                            onChange={handleDefaultFormChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                            placeholder="例如: 2.5MB"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                      <button
                        onClick={handleDefaultContentCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleDefaultContentSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        保存修改
                      </button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-gray-800">{resource.title}</div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded">{resource.type}</span>
                        <span className="text-sm text-gray-500">下载: {resource.downloads}</span>
                        <button
                          onClick={() => handleDefaultContentEdit('teachingResources', i, resource)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                    <div className="text-gray-600 text-sm">{resource.description}</div>
                    <div className="text-xs text-gray-500 mt-1">大小: {resource.size}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-yellow-600">⚠️</span>
          <div className="text-sm text-yellow-800">
            <strong>注意：</strong>默认内容的修改会保存到数据库中，如果数据库不可用则保存到本地存储。
          </div>
        </div>
      </div>
    </div>
  )

  const renderAgentModule = () => (
    <div>
      <h2 className="text-xl font-bold mb-4 text-indigo-600">智能体管理</h2>
      <p className="text-sm text-gray-500 mb-6">新增的智能体将自动显示在首页（需要刷新页面查看效果）</p>
      {/* 列表 */}
      <div className="mb-8">
        {agents.length === 0 && <div className="text-gray-400 text-center py-8">暂无自定义智能体</div>}
        {agents.map((a, i) => (
          <div key={i} className="flex items-center gap-4 border-b py-3">
            <img src={a.image || '/placeholder.png'} alt="头像" className="w-14 h-14 rounded-lg object-cover bg-gray-100 border" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-indigo-700 truncate">{a.name}</div>
              <div className="text-gray-500 text-sm truncate">{a.description}</div>
              <div className="flex gap-1 mb-1">
                {(a.tags || []).map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded">{tag}</span>
                ))}
              </div>
              <a href={a.url} target="_blank" className="text-xs text-indigo-400 hover:underline break-all">{a.url}</a>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${a.type === 'chat' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              {a.type === 'chat' ? '对话' : '下载'}
            </span>
            <button onClick={() => handleEdit(i)} className="px-3 py-1 text-xs rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 mr-2">编辑</button>
            <button onClick={() => handleDelete(i)} className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button>
          </div>
        ))}
      </div>
      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
        <div className="flex gap-4 items-start">
          <div>
            <label className="block text-sm font-medium mb-1">图片</label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} className="block w-24 text-xs" />
            {form.image && <img src={form.image} alt="预览" className="w-16 h-16 rounded-lg mt-2 object-cover border" />}
          </div>
          <div className="flex-1 space-y-2">
            <input name="name" value={form.name} onChange={handleChange} placeholder="智能体名称" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" />
            <input name="url" value={form.url} onChange={handleChange} placeholder="链接地址" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" />
            <select name="type" value={form.type} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200">
              <option value="chat">对话类型</option>
              <option value="download">下载类型</option>
            </select>
          </div>
        </div>
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="智能体描述" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" rows={3} />
        {/* 标签管理 */}
        <div>
          <label className="block text-sm font-medium mb-1">标签</label>
          <div className="flex gap-2 mb-2">
            <input 
              value={tagInput} 
              onChange={(e) => setTagInput(e.target.value)} 
              placeholder="输入标签" 
              className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200">添加</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(form.tags || []).map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-sm rounded flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-red-500 hover:text-red-700">×</button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          {editingIndex !== null && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">取消</button>}
          <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow hover:shadow-lg transition-all duration-200">{editingIndex !== null ? '保存修改' : '新增智能体'}</button>
        </div>
      </form>
    </div>
  )

  const renderPromptModule = () => (
    <div>
      <h2 className="text-xl font-bold mb-4 text-indigo-600">提示词管理</h2>
      <p className="text-sm text-gray-500 mb-6">新增的提示词将自动显示在首页（需要刷新页面查看效果）</p>
      {/* 列表 */}
      <div className="mb-8">
        {prompts.length === 0 && <div className="text-gray-400 text-center py-8">暂无自定义提示词</div>}
        {prompts.map((p, i) => (
          <div key={i} className="border-b py-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="font-bold text-indigo-700 text-lg">{p.title}</div>
                <div className="text-gray-500 text-sm mb-2">{p.description}</div>
                <div className="flex gap-1 mb-2">
                  {(p.tags || []).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded">{tag}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-400">下载量: {p.downloads}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(i)} className="px-3 py-1 text-xs rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100">编辑</button>
                <button onClick={() => handleDelete(i)} className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 line-clamp-3">{p.content}</div>
          </div>
        ))}
      </div>
      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="title" value={form.title} onChange={handleChange} placeholder="提示词标题" className="px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" />
          <input name="downloads" type="number" value={form.downloads} onChange={handleChange} placeholder="下载量" className="px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" />
        </div>
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="提示词描述" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" rows={2} />
        <textarea name="content" value={form.content} onChange={handleChange} placeholder="提示词内容" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" rows={6} />
        {/* 标签管理 */}
        <div>
          <label className="block text-sm font-medium mb-1">标签</label>
          <div className="flex gap-2 mb-2">
            <input 
              value={tagInput} 
              onChange={(e) => setTagInput(e.target.value)} 
              placeholder="输入标签" 
              className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200">添加</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(form.tags || []).map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-sm rounded flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-red-500 hover:text-red-700">×</button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          {editingIndex !== null && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">取消</button>}
          <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow hover:shadow-lg transition-all duration-200">{editingIndex !== null ? '保存修改' : '新增提示词'}</button>
        </div>
      </form>
    </div>
  )

  const renderResourceModule = () => (
    <div>
      <h2 className="text-xl font-bold mb-4 text-indigo-600">AI教学资源管理</h2>
      <p className="text-sm text-gray-500 mb-6">新增的教学资源将自动显示在首页（需要刷新页面查看效果）</p>
      {/* 列表 */}
      <div className="mb-8">
        {resources.length === 0 && <div className="text-gray-400 text-center py-8">暂无自定义教学资源</div>}
        {resources.map((r, i) => (
          <div key={i} className="border-b py-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-bold text-indigo-700 text-lg">{r.title}</div>
                <div className="text-gray-500 text-sm mb-2">{r.description}</div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">{r.type}</span>
                  <span className="px-2 py-1 bg-green-50 text-green-600 rounded">{r.difficulty}</span>
                  <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded">{r.size}</span>
                  <span className="text-gray-400">下载量: {r.downloads}</span>
                </div>
                {r.downloadUrl && (
                  <a href={r.downloadUrl} target="_blank" className="text-xs text-indigo-400 hover:underline break-all block mt-1">{r.downloadUrl}</a>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(i)} className="px-3 py-1 text-xs rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100">编辑</button>
                <button onClick={() => handleDelete(i)} className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <input name="title" value={form.title} onChange={handleChange} placeholder="资源标题" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="资源描述" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" rows={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="type" value={form.type} onChange={handleChange} className="px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200">
            <option value="课件">课件</option>
            <option value="实训">实训</option>
            <option value="案例">案例</option>
            <option value="工具">工具</option>
          </select>
          <select name="difficulty" value={form.difficulty} onChange={handleChange} className="px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200">
            <option value="教师用">教师用</option>
            <option value="学生用">学生用</option>
            <option value="通用">通用</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="downloads" type="number" value={form.downloads} onChange={handleChange} placeholder="下载量" className="px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" />
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">文件大小:</span>
            <span className="text-sm text-gray-700">{form.size || '未设置'}</span>
          </div>
        </div>
        
        {/* 文件上传区域 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            上传文件 <span className="text-gray-500">(可选，也可以手动输入下载链接)</span>
          </label>
          <FileUploadComponent
            onFileReady={(fileUrl, fileName, fileSize) => {
              setForm((f: any) => ({
                ...f,
                downloadUrl: fileUrl,
                size: fileSize
              }))
            }}
            maxSize={50}
            acceptedTypes={['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.rar', '.mp4', '.avi', '.mov']}
          />
        </div>

        {/* 手动输入下载链接 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            或手动输入下载链接
          </label>
          <input 
            name="downloadUrl" 
            value={form.downloadUrl} 
            onChange={handleChange} 
            placeholder="https://example.com/file.pdf" 
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" 
          />
          <p className="text-xs text-gray-500 mt-1">支持网盘链接、CDN链接等任何可直接下载的链接</p>
        </div>

        <div className="flex gap-3 justify-end">
          {editingIndex !== null && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">取消</button>}
          <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow hover:shadow-lg transition-all duration-200">{editingIndex !== null ? '保存修改' : '新增教学资源'}</button>
        </div>
      </form>
    </div>
  )

  const renderRequestModule = () => (
    <div>
      <h2 className="text-xl font-bold mb-4 text-indigo-600">定制申请管理</h2>
      <p className="text-sm text-gray-500 mb-6">用户通过首页定制按钮提交的申请列表</p>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
          <div className="text-sm text-blue-700">总申请数</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === '待处理').length}</div>
          <div className="text-sm text-yellow-700">待处理</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === '已完成').length}</div>
          <div className="text-sm text-green-700">已完成</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{requests.filter(r => r.status === '已取消').length}</div>
          <div className="text-sm text-red-700">已取消</div>
        </div>
      </div>

      {/* 申请列表 */}
      <div className="space-y-4">
        {requests.length === 0 && <div className="text-gray-400 text-center py-8">暂无定制申请</div>}
        {requests.map((req, i) => (
          <div key={i} className="border rounded-lg p-6 bg-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    req.type === 'agent' ? 'bg-indigo-100 text-indigo-700' :
                    req.type === 'prompt' ? 'bg-violet-100 text-violet-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {req.type === 'agent' ? '智能体定制' : req.type === 'prompt' ? '提示词定制' : '教学资源定制'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    req.status === '待处理' ? 'bg-yellow-100 text-yellow-700' :
                    req.status === '处理中' ? 'bg-blue-100 text-blue-700' :
                    req.status === '已完成' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {req.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    req.urgency === '特急' ? 'bg-red-100 text-red-700' :
                    req.urgency === '紧急' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {req.urgency}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{req.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{req.description}</p>
                <div className="text-xs text-gray-500 mb-3">
                  申请人: {req.name} | 邮箱: {req.email} | 
                  {req.contact && ` 联系: ${req.contact} |`} 
                  提交时间: {req.created_at ? new Date(req.created_at).toLocaleString() : '未知时间'}
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">查看详细需求</summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-gray-700">
                    {req.requirements}
                  </div>
                </details>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <select 
                  value={req.status} 
                  onChange={(e) => updateRequestStatus(i, e.target.value)}
                  className="px-3 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="待处理">待处理</option>
                  <option value="处理中">处理中</option>
                  <option value="已完成">已完成</option>
                  <option value="已取消">已取消</option>
                </select>
                <button 
                  onClick={() => deleteRequest(i)}
                  className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 批量操作 */}
      {requests.length > 0 && (
        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              if (window.confirm('确定要清空所有已完成的申请吗？')) {
                const updated = requests.filter(r => r.status !== '已完成')
                setRequests(updated)
                localStorage.setItem('custom_requests', JSON.stringify(updated))
              }
            }}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            清空已完成申请
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">管理后台</h1>
          <button onClick={logout} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">退出登录</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 justify-center mb-10">
          {modules.map(m => (
            <button
              key={m.key}
              onClick={() => handleSwitchModule(m.key)}
              className={`flex flex-col items-center px-4 py-4 rounded-2xl shadow transition-all duration-200 border-2 min-h-[120px] w-full ${active === m.key ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-400 scale-105' : 'bg-white text-indigo-700 border-transparent hover:border-indigo-200'}`}
            >
              <span className="text-2xl mb-2">{m.icon}</span>
              <span className="font-bold text-sm whitespace-nowrap">{m.name}</span>
              <span className="text-xs mt-1 opacity-70 text-center leading-tight">{m.desc}</span>
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">
          {active === 'carousel' && renderCarouselModule()}
          {active === 'agents' && renderAgentModule()}
          {active === 'prompts' && renderPromptModule()}
          {active === 'resources' && renderResourceModule()}
          {active === 'default-content' && renderDefaultContentModule()}
          {active === 'requests' && renderRequestModule()}
        </div>
      </div>
    </div>
  )
} 