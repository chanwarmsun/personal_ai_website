'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import FileUploadComponent from '../../components/FileUploadComponent'
import { agentOperations, promptOperations, resourceOperations, requestOperations, testConnection } from '../../lib/database'
import { carouselOperations, defaultContentOperations } from '../../lib/carousel-operations'
import { defaultContentProvider } from '../../lib/default-content-provider'
import { DatabaseConnectionManager, smartConnection } from '../../lib/supabase'

const modules = [
  { key: 'carousel', name: '轮播管理', desc: '管理首页轮播图片，支持增删改查', icon: '🎠' },
  { key: 'agents', name: '智能体', desc: '管理AI智能体，支持增删改查', icon: '🤖' },
  { key: 'prompts', name: '提示词', desc: '管理AI提示词，支持增删改查', icon: '💡' },
  { key: 'resources', name: 'AI教学资源', desc: '管理教学资源，支持增删改查', icon: '📚' },
  { key: 'default-content', name: '默认内容', desc: '编辑网站默认内容（智能体、提示词、资源）', icon: '📋' },
  { key: 'requests', name: '定制申请', desc: '查看用户定制申请，支持状态管理', icon: '📝' },
  { key: 'analytics', name: '数据统计', desc: '查看网站访问统计和用户行为分析', icon: '📊' },
  { key: 'logs', name: '连接日志', desc: '查看数据库连接日志，排查连接问题', icon: '📋' },
]

// 添加显示下载URL的工具函数
const formatDownloadUrl = (url: string, maxLength: number = 50): { display: string, type: 'base64' | 'url', preview?: string } => {
  if (!url) return { display: '无', type: 'url' }
  
  // 检查是否是base64格式
  if (url.startsWith('data:')) {
    const parts = url.split(',')
    if (parts.length === 2) {
      const mimeType = parts[0].split(':')[1]?.split(';')[0] || '未知格式'
      const sizeInBytes = Math.ceil(parts[1].length * 0.75) // base64编码后大小约为原文件的4/3倍
      const sizeFormatted = sizeInBytes > 1024 * 1024 
        ? `${(sizeInBytes / (1024 * 1024)).toFixed(1)}MB`
        : sizeInBytes > 1024 
        ? `${(sizeInBytes / 1024).toFixed(1)}KB`
        : `${sizeInBytes}B`
      
      return {
        display: `📎 上传文件 (${mimeType}, ${sizeFormatted})`,
        type: 'base64',
        preview: url.substring(0, 100) + '...'
      }
    }
  }
  
  // 普通URL处理
  if (url.length > maxLength) {
    return {
      display: url.substring(0, maxLength) + '...',
      type: 'url',
      preview: url
    }
  }
  
  return {
    display: url,
    type: 'url'
  }
}

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

  // 数据库连接状态管理
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [dbStatusMessage, setDbStatusMessage] = useState<string>('检查连接中...')
  const connectionManager = DatabaseConnectionManager.getInstance()

  const [stats, setStats] = useState({
    agents: 0,
    prompts: 0,
    resources: 0,
    requests: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean
    mode: 'sdk' | 'api'
    lastCheck: Date | null
  }>({
    isConnected: false,
    mode: 'sdk',
    lastCheck: null
  })

  // 检查数据库连接状态
  const checkConnectionStatus = async () => {
    try {
      const mode = await smartConnection.getOptimalConnection()
      const isConnected = await testConnection()
      setConnectionStatus({
        isConnected,
        mode,
        lastCheck: new Date()
      })
    } catch (error) {
      console.error('连接状态检查失败:', error)
      setConnectionStatus({
        isConnected: false,
        mode: 'sdk',
        lastCheck: new Date()
      })
    }
  }

  // 加载统计数据（只统计管理后台添加的自定义内容）
  const loadStats = async () => {
    try {
      setIsLoading(true)
      console.log('🔄 开始加载统计数据...')
      
      // 只加载数据库中的自定义内容（不包含默认内容）
      const [agentsData, promptsData, resourcesData, requestsData] = await Promise.all([
        agentOperations.getAll(),
        promptOperations.getAll(),
        resourceOperations.getAll(),
        requestOperations.getAll()
      ])
      
      // 统计数据只包含管理后台添加的自定义内容
      const customStats = {
        agents: agentsData.length,
        prompts: promptsData.length,
        resources: resourcesData.length,
        requests: requestsData.length
      }
      
      console.log('📊 管理后台自定义内容统计:', customStats)
      setStats(customStats)
      
    } catch (error) {
      console.error('❌ 加载统计数据失败:', error)
      // 出错时设置默认值
      setStats({
        agents: 0,
        prompts: 0,
        resources: 0,
        requests: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 优化加载顺序：减少并发查询，串行加载统计数据
    const initializeAdmin = async () => {
      console.log('🚀 开始初始化管理后台...')
      const startTime = Date.now()
      
      try {
        // 1. 先检查连接状态
        await checkConnectionStatus()
        
        // 2. 只加载必要的统计数据（减少数据库查询）
        await loadStats()
        
        console.log(`✅ 管理后台初始化完成，耗时: ${Date.now() - startTime}ms`)
      } catch (error) {
        console.error('❌ 管理后台初始化失败:', error)
      }
    }
    
    initializeAdmin()
    
    // 减少连接状态检查频率：从30秒改为60秒
    const statusInterval = setInterval(checkConnectionStatus, 60000)
    
    return () => {
      clearInterval(statusInterval)
    }
  }, [])

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin-login')
      return
    }
    
    // 优化初始化流程：延迟加载非关键数据
    const initializeData = async () => {
      console.log('📊 开始初始化数据加载...')
      
      try {
        // 1. 先检查数据库连接
        await checkDatabaseConnection()
        
        // 2. 延迟加载默认内容（仅在需要时加载）
        // loadDefaultContent() - 注释掉，减少初始加载时间
        
        // 3. 默认先显示轮播管理，延迟加载其他数据
        if (active === 'carousel') {
          await loadCarousel()
        }
        // 其他数据在用户切换到对应模块时再加载
        
      } catch (error) {
        console.error('❌ 数据初始化失败:', error)
      }
    }
    
    initializeData()
    
    // 减少连接检查频率：从30秒改为2分钟
    const connectionInterval = setInterval(checkDatabaseConnection, 120000)
    
    return () => clearInterval(connectionInterval)
  }, [])

  // 数据库连接检查函数
  const checkDatabaseConnection = async () => {
    try {
      console.log('🔄 开始检查数据库连接...')
      setDbConnectionStatus('connecting')
      setDbStatusMessage('检查数据库连接...')
      
      // 添加超时保护，防止卡住
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('连接检查超时')), 10000)
      )
      
      const connectionPromise = connectionManager.checkConnection()
      
      const isConnected = await Promise.race([connectionPromise, timeoutPromise])
      
      if (isConnected) {
        console.log('✅ 数据库连接检查成功')
        setDbConnectionStatus('connected')
        setDbStatusMessage('数据库连接正常')
      } else {
        console.log('❌ 数据库连接检查失败')
        setDbConnectionStatus('disconnected')
        setDbStatusMessage('数据库连接失败，请检查网络或Supabase配置')
      }
    } catch (error: any) {
      console.error('💥 数据库连接检查异常:', error)
      setDbConnectionStatus('disconnected')
      setDbStatusMessage(`数据库连接异常: ${error.message}`)
    }
  }

  const loadAgents = async () => {
    try {
      console.log('🔍 开始加载智能体数据...')
      const dbAgents = await agentOperations.getAll()
      console.log('📊 从数据库获取的智能体:', dbAgents)
      setAgents(dbAgents)
      console.log('✅ 智能体状态已更新')
    } catch (error: any) {
      console.error('❌ 加载智能体失败:', error)
      alert(`加载智能体失败: ${error.message}`)
      // 不再回退到localStorage，确保全部使用数据库
      setAgents([])
    }
  }

  const loadPrompts = async () => {
    try {
      console.log('🔍 开始加载提示词数据...')
      const dbPrompts = await promptOperations.getAll()
      console.log('📊 从数据库获取的提示词:', dbPrompts)
      setPrompts(dbPrompts)
      console.log('✅ 提示词状态已更新')
    } catch (error: any) {
      console.error('❌ 加载提示词失败:', error)
      alert(`加载提示词失败: ${error.message}`)
      // 不再回退到localStorage，确保全部使用数据库
      setPrompts([])
    }
  }

  const loadResources = async () => {
    try {
      console.log('🔍 开始加载教学资源数据...')
      const dbResources = await resourceOperations.getAll()
      console.log('📊 从数据库获取的教学资源:', dbResources)
      // 处理字段映射：download_url -> downloadUrl
      const formattedResources = dbResources.map(resource => ({
        ...resource,
        downloadUrl: resource.download_url
      }))
      setResources(formattedResources)
      console.log('✅ 教学资源状态已更新')
    } catch (error: any) {
      console.error('❌ 加载教学资源失败:', error)
      alert(`加载教学资源失败: ${error.message}`)
      // 不再回退到localStorage，确保全部使用数据库
      setResources([])
    }
  }

  const loadRequests = async () => {
    try {
      console.log('🔍 开始加载定制申请数据...')
      const dbRequests = await requestOperations.getAll()
      console.log('📊 从数据库获取的定制申请:', dbRequests)
      setRequests(dbRequests)
      console.log('✅ 定制申请状态已更新')
    } catch (error: any) {
      console.error('❌ 加载定制申请失败:', error)
      alert(`加载定制申请失败: ${error.message}`)
      // 不再回退到localStorage，确保全部使用数据库
      setRequests([])
    }
  }

  const loadCarousel = async () => {
    try {
      console.log('🔄 开始加载轮播数据...')
      
      // 只从数据库加载管理后台添加的轮播（不包含默认内容）
      const carouselData = await carouselOperations.getAll()
      console.log('📊 从数据库获取的轮播数据:', carouselData)
      
      // 格式化数据，标记为自定义内容
      const formattedCarousels = carouselData.map(item => ({
        id: item.id,
        title: item.title,
        image: item.image,
        description: item.description,
        isDefault: false // 全部为自定义内容
      }))
      
      console.log('🎠 格式化后的轮播数据:', formattedCarousels)
      setCarousel(formattedCarousels)
      
    } catch (error) {
      console.error('❌ 加载轮播数据失败:', error)
      // 回退到localStorage（如果有的话）
      try {
        const saved = localStorage.getItem('custom_carousel')
        if (saved) {
          const localData = JSON.parse(saved)
          setCarousel(localData.map((item: any) => ({ ...item, isDefault: false })))
        } else {
          setCarousel([])
        }
      } catch (localError) {
        console.error('从localStorage加载轮播也失败:', localError)
        setCarousel([])
      }
    }
  }

  const loadDefaultContent = async () => {
    try {
      console.log('🔄 开始加载默认内容...')
      
      // 优先从数据库加载已保存的内容
      const dbContent = await defaultContentOperations.get('website_default')
      if (dbContent) {
        console.log('✅ 从数据库加载默认内容:', dbContent)
        
        // 确保数据格式正确，处理字段映射
        const normalizedContent = {
          agents: dbContent.agents || [],
          prompts: dbContent.prompts || [],
          // 处理教学资源的字段映射：teachingResources <-> resources
          teachingResources: dbContent.teachingResources || dbContent.resources || [],
          carousel: dbContent.carousel || []
        }
        
        console.log('🔄 格式化后的默认内容:', normalizedContent)
        setDefaultContent(normalizedContent)
        return
      }
      
      console.log('⚠️ 数据库中没有保存的默认内容，从文件加载初始内容')
      
      // 如果数据库没有，从文件加载初始内容
      const response = await fetch('/data/content.json')
      if (response.ok) {
        const fileData = await response.json()
        console.log('📁 从文件加载默认内容:', fileData)
        
        // 转换数据格式以匹配前端期望
        const transformedData = {
          agents: fileData.agents || [],
          prompts: fileData.prompts || [],
          teachingResources: fileData.teachingResources || [], // 统一使用teachingResources字段
          carousel: fileData.carousel || []
        }
        
        console.log('🔄 转换后的数据格式:', transformedData)
        setDefaultContent(transformedData)
        
        // 首次加载时，将转换后的内容保存到数据库
        console.log('💾 首次加载，将转换后的内容保存到数据库...')
        await defaultContentOperations.save('website_default', transformedData)
      } else {
        throw new Error('无法从文件加载内容')
      }
    } catch (error) {
      console.error('加载默认内容失败:', error)
      // 如果无法加载，使用静态导入的备份
      try {
        const contentData = await import('../../data/content.json')
        console.log('📦 使用静态导入的备份内容')
        
        // 转换数据格式
        const transformedData = {
          agents: contentData.default.agents || [],
          prompts: contentData.default.prompts || [],
          teachingResources: contentData.default.teachingResources || [], // 统一使用teachingResources字段
          carousel: contentData.default.carousel || []
        }
        
        setDefaultContent(transformedData)
      } catch (importError) {
        console.error('导入备份内容失败:', importError)
      }
    }
  }

  // 移除localStorage保存逻辑，所有数据都通过数据库操作
  // 这些函数已不再需要，直接通过数据库CRUD操作管理数据

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
    } catch (error: any) {
      console.error('保存默认内容失败:', error)
      // 至少保存到localStorage
      localStorage.setItem('default_content_backup', JSON.stringify(newContent))
    }
  }

  const updateRequestStatus = async (index: number, status: string) => {
    try {
      const request = requests[index]
      console.log('🔄 更新申请状态:', request.id, '新状态:', status)
      
      const updated = await requestOperations.updateStatus(request.id, status as any)
      if (updated) {
        // 重新加载数据确保同步
        await loadRequests()
        console.log('✅ 申请状态更新成功')
      } else {
        alert('更新申请状态失败，请检查控制台错误信息')
      }
    } catch (error: any) {
      console.error('更新申请状态失败:', error)
      alert('更新失败，请重试。错误详情: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const deleteRequest = async (index: number) => {
    if (window.confirm('确定要删除该申请吗？')) {
      try {
        const request = requests[index]
        console.log('🗑️ 删除申请:', request.id)
        
        const success = await requestOperations.delete(request.id)
        if (success) {
          // 重新加载数据确保同步
          await loadRequests()
          console.log('✅ 申请删除成功')
        } else {
          alert('删除申请失败，请检查控制台错误信息')
        }
              } catch (error: any) {
          console.error('删除申请失败:', error)
          alert('删除失败，请重试。错误详情: ' + (error instanceof Error ? error.message : '未知错误'))
        }
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

  const handleSwitchModule = async (moduleKey: string) => {
    setActive(moduleKey)
    setEditingIndex(null)
    
    // 如果是analytics模块，直接跳转到专门的页面
    if (moduleKey === 'analytics') {
      router.push('/admin/analytics')
      return
    }
    
    // 如果是logs模块，直接跳转到日志页面
    if (moduleKey === 'logs') {
      window.open('/admin/logs', '_blank')
      return
    }
    
    // 懒加载：只在切换到新模块时才加载对应数据
    console.log(`🔄 切换到模块: ${moduleKey}，开始加载数据...`)
    const startTime = Date.now()
    
    try {
      switch (moduleKey) {
        case 'carousel':
          await loadCarousel()
          break
        case 'agents':
          await loadAgents()
          break
        case 'prompts':
          await loadPrompts()
          break
        case 'resources':
          await loadResources()
          break
        case 'requests':
          await loadRequests()
          break
        case 'default-content':
          await loadDefaultContent()
          break
      }
      
      console.log(`✅ 模块 ${moduleKey} 数据加载完成，耗时: ${Date.now() - startTime}ms`)
    } catch (error) {
      console.error(`❌ 模块 ${moduleKey} 数据加载失败:`, error)
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
    
    const fieldValue = form[requiredField]
    if (!fieldValue || fieldValue.trim().length === 0) {
      alert(`请填写${requiredField === 'name' ? '名称' : '标题'}`)
      return
    }
    
    // 清理字符串数据，移除首尾空格但保留中间空格
    const cleanForm = { ...form }
    Object.keys(cleanForm).forEach(key => {
      if (typeof cleanForm[key] === 'string') {
        cleanForm[key] = cleanForm[key].trim()
      }
    })
    
    console.log('🧹 清理后的表单数据:', JSON.stringify(cleanForm, null, 2))
    
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
          console.log('📝 创建轮播图:', form)
          
          try {
            const created = await carouselOperations.create({
              title: form.title,
              image: form.image,
              description: form.description,
              order_index: carousel.length
            })
            
            if (created) {
              console.log('🔄 开始重新加载轮播数据...')
              await loadCarousel()
              console.log('🔄 重新加载轮播完成')
              
              // 重置表单状态，确保下次输入正常
              setForm(getCurrentDefault())
              setTagInput('')
              if (fileInputRef.current) fileInputRef.current.value = ''
              
              console.log('✅ 轮播图创建成功，表单已重置')
              alert('轮播图创建成功！')
              return // 提早返回，避免重复重置表单
            } else {
              console.error('❌ 创建返回null，但没有抛出异常')
              alert('轮播图创建失败：服务器返回空结果，请检查网络连接或重试')
            }
          } catch (createError: any) {
            console.error('💥 创建轮播图时发生异常:', createError)
            alert(`轮播图创建失败：${createError.message || '未知错误'}`)
          }
        } else if (active === 'agents') {
          console.log('📝 创建智能体:', form)
          console.log('🌐 当前环境:', process.env.NODE_ENV)
          
          // 验证必须字段
          if (!cleanForm.name?.trim()) {
            alert('请填写智能体名称')
            return
          }
          if (!cleanForm.description?.trim()) {
            alert('请填写智能体描述')
            return
          }
          if (!cleanForm.url?.trim()) {
            alert('请填写智能体链接')
            return
          }
          
          try {
            // 构建正确的智能体数据结构（只包含数据库表中的字段）
            const agentData = {
              name: cleanForm.name.trim(),
              description: cleanForm.description.trim(),
              image: cleanForm.image || '',
              type: cleanForm.type || 'chat',
              url: cleanForm.url.trim(),
              tags: Array.isArray(cleanForm.tags) ? cleanForm.tags : []
            }
            
            console.log('📝 智能体数据结构:', JSON.stringify(agentData, null, 2))
            console.log('📡 开始调用数据库创建操作...')
            
            // 使用正确的数据结构创建智能体
            const created = await agentOperations.create(agentData)
            console.log('✅ 智能体创建成功:', created)
            
            // 重新加载数据
            await loadAgents()
            
            // 重置表单状态
            setForm(getCurrentDefault())
            setTagInput('')
            if (fileInputRef.current) fileInputRef.current.value = ''
            
            alert('智能体创建成功！')
            return
          } catch (createError: any) {
            console.error('💥 创建智能体失败:', createError)
            alert(`智能体创建失败：${createError.message}`)
          }
        } else if (active === 'prompts') {
          console.log('📝 创建提示词:', form)
          
          // 验证必须字段
          if (!cleanForm.title?.trim()) {
            alert('请填写提示词标题')
            return
          }
          if (!cleanForm.description?.trim()) {
            alert('请填写提示词描述')
            return
          }
          if (!cleanForm.content?.trim()) {
            alert('请填写提示词内容')
            return
          }
          
          try {
            // 构建正确的提示词数据结构（只包含数据库表中的字段）
            const promptData = {
              title: cleanForm.title.trim(),
              description: cleanForm.description.trim(),
              content: cleanForm.content.trim(),
              tags: Array.isArray(cleanForm.tags) ? cleanForm.tags : [],
              downloads: cleanForm.downloads || 0
            }
            
            console.log('📝 提示词数据结构:', JSON.stringify(promptData, null, 2))
            
            // 使用正确的数据结构创建提示词
            const created = await promptOperations.create(promptData)
            console.log('✅ 提示词创建成功:', created)
            
            // 重新加载数据
            await loadPrompts()
            
            // 重置表单状态
            setForm(getCurrentDefault())
            setTagInput('')
            if (fileInputRef.current) fileInputRef.current.value = ''
            
            alert('提示词创建成功！')
            return
          } catch (createError: any) {
            console.error('💥 创建提示词失败:', createError)
            alert(`提示词创建失败：${createError.message}`)
          }
        } else {
          console.log('📝 创建教学资源:', form)
          
          // 验证必须字段
          if (!cleanForm.title?.trim()) {
            alert('请填写资源标题')
            return
          }
          if (!cleanForm.description?.trim()) {
            alert('请填写资源描述')
            return
          }
          
          try {
            // 构建正确的教学资源数据结构（只包含数据库表中的字段）
            const resourceData = {
              title: cleanForm.title.trim(),
              description: cleanForm.description.trim(),
              type: cleanForm.type || '课件',
              difficulty: cleanForm.difficulty || '教师用',
              size: cleanForm.size || '',
              download_url: cleanForm.downloadUrl || cleanForm.download_url || '',
              downloads: cleanForm.downloads || 0
            }
            
            console.log('📝 教学资源数据结构:', JSON.stringify(resourceData, null, 2))
            
            // 使用正确的数据结构创建教学资源
            const created = await resourceOperations.create(resourceData)
            console.log('✅ 教学资源创建成功:', created)
            
            // 重新加载数据
            await loadResources()
            
            // 重置表单状态
            setForm(getCurrentDefault())
            setTagInput('')
            if (fileInputRef.current) fileInputRef.current.value = ''
            
            alert('教学资源创建成功！')
            return
          } catch (createError: any) {
            console.error('💥 创建教学资源失败:', createError)
            alert(`教学资源创建失败：${createError.message}`)
          }
        }
      }
      
      // 仅在编辑或失败情况下重置表单（成功创建已经在各自的分支中重置了）
      if (editingIndex !== null) {
        setForm(getCurrentDefault())
        setTagInput('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('保存失败:', error)
      alert('保存失败，请重试。错误详情: ' + (error instanceof Error ? error.message : '未知错误'))
      
      // 在发生错误时重置表单
      setForm(getCurrentDefault())
      setTagInput('')
      if (fileInputRef.current) fileInputRef.current.value = ''
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
          await agentOperations.delete(item.id)
          await loadAgents()
        } else if (active === 'prompts') {
          await promptOperations.delete(item.id)
          await loadPrompts()
        } else {
          await resourceOperations.delete(item.id)
          await loadResources()
        }
        
        setEditingIndex(null)
        setForm(getCurrentDefault())
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (error: any) {
        console.error('删除失败:', error)
        alert('删除失败，请重试。错误详情: ' + (error instanceof Error ? error.message : '未知错误'))
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
    
    try {
      console.log('🔄 开始保存默认内容修改...')
      console.log('编辑项目:', editingDefaultItem)
      console.log('表单数据:', defaultEditForm)
      
      const { type, index } = editingDefaultItem
      const updatedContent = { ...defaultContent }
      
      if (type === 'agents') {
        updatedContent.agents[index] = { ...defaultEditForm }
      } else if (type === 'prompts') {
        updatedContent.prompts[index] = { ...defaultEditForm }
      } else if (type === 'teachingResources') {
        updatedContent.teachingResources[index] = { ...defaultEditForm }
      }
      
      console.log('🔄 更新后的内容:', updatedContent)
      
      // 1. 首先尝试保存到数据库
      console.log('🔄 保存到数据库中...')
      const saveSuccess = await defaultContentOperations.save('website_default', updatedContent)
      
      if (!saveSuccess) {
        console.warn('⚠️ 数据库保存失败，但继续更新本地状态')
        // 数据库保存失败时，至少更新本地状态，跳过localStorage备份
        setDefaultContent(updatedContent)
        
        setEditingDefaultItem(null)
        setDefaultEditForm({})
        
        alert('⚠️ 数据库保存失败，但修改已保存到本地。请检查网络连接或联系技术支持。')
        return
      }
      
      // 2. 数据库保存成功，更新本地状态
      console.log('✅ 数据库保存成功，更新本地状态...')
      setDefaultContent(updatedContent)
      
      // 3. 智能备份到localStorage（压缩和分片存储）
      try {
        console.log('🔄 创建本地备份...')
        
        // 创建轻量级备份（只保存必要信息）
        const lightBackup = {
          timestamp: new Date().toISOString(),
          version: '2.0',
          summary: {
            agents: updatedContent.agents?.length || 0,
            prompts: updatedContent.prompts?.length || 0,
            teachingResources: updatedContent.teachingResources?.length || 0,
            carousel: updatedContent.carousel?.length || 0
          },
          lastEdit: {
            type,
            index,
            title: defaultEditForm.title || defaultEditForm.name || '未知项目'
          }
        }
        
        // 尝试存储轻量级备份
        localStorage.setItem('default_content_light_backup', JSON.stringify(lightBackup))
        
        // 尝试存储完整备份（如果空间足够）
        try {
          const fullBackupString = JSON.stringify(updatedContent)
          
          // 检查大小（大概估算）
          const sizeInBytes = new Blob([fullBackupString]).size
          const sizeInKB = Math.round(sizeInBytes / 1024)
          
          console.log(`备份数据大小: ${sizeInKB}KB`)
          
          // 如果数据过大（超过2MB），只保存轻量级备份
          if (sizeInBytes > 2 * 1024 * 1024) {
            console.warn('⚠️ 数据量过大，跳过完整备份，只保存轻量级备份')
            // 清除可能存在的旧的大备份
            localStorage.removeItem('default_content_backup')
          } else {
            localStorage.setItem('default_content_backup', fullBackupString)
            console.log('✅ 完整备份已保存')
          }
        } catch (storageError: any) {
          console.warn('⚠️ 完整备份失败，但轻量级备份已保存:', storageError.message)
          
          // 如果是配额错误，清理一些旧数据
          if (storageError.name === 'QuotaExceededError' || storageError.message.includes('quota')) {
            console.log('🧹 清理localStorage中的旧数据...')
            
            // 清理可能的旧备份
            try {
              localStorage.removeItem('default_content_backup')
              localStorage.removeItem('admin_backup_data')
              localStorage.removeItem('carousel_backup')
              localStorage.removeItem('agents_backup')
              localStorage.removeItem('prompts_backup')
              localStorage.removeItem('resources_backup')
              
              console.log('✅ 旧备份数据已清理')
            } catch (cleanupError) {
              console.warn('清理旧数据时出错:', cleanupError)
            }
          }
        }
        
      } catch (backupError: any) {
        console.warn('本地备份失败，这不影响数据库保存:', backupError.message)
      }
      
      // 4. 清除任何缓存（如果有的话）
      try {
        // 检查是否存在defaultContentProvider
        if (typeof window !== 'undefined' && (window as any).defaultContentProvider?.clearCache) {
          console.log('🔄 清除前端缓存...')
          ;(window as any).defaultContentProvider.clearCache()
        }
      } catch (cacheError) {
        console.warn('清除缓存失败，这不影响保存操作:', cacheError)
      }
      
      // 5. 重置编辑状态
      setEditingDefaultItem(null)
      setDefaultEditForm({})
      
      console.log('✅ 默认内容修改保存成功')
      alert('✅ 修改已成功保存！内容已实时更新。')
      
    } catch (error: any) {
      console.error('❌ 保存默认内容失败:', error)
      
      // 详细的错误信息，但过滤掉localStorage相关的错误提示
      let errorMessage = '保存失败，请重试。'
      
      // 如果是localStorage配额错误，给出友好提示
      if (error.name === 'QuotaExceededError' || 
          (error.message && error.message.includes('quota')) ||
          (error.message && error.message.includes('Storage'))) {
        
        // 数据可能已经保存到数据库了，检查一下
        console.log('🔍 检查数据库保存状态...')
        try {
          const { type, index } = editingDefaultItem
          const updatedContent = { ...defaultContent }
          
          if (type === 'agents') {
            updatedContent.agents[index] = { ...defaultEditForm }
          } else if (type === 'prompts') {
            updatedContent.prompts[index] = { ...defaultEditForm }
          } else if (type === 'teachingResources') {
            updatedContent.teachingResources[index] = { ...defaultEditForm }
          }
          
          // 尝试保存到数据库
          const saveSuccess = await defaultContentOperations.save('website_default', updatedContent)
          
          if (saveSuccess) {
            // 数据库保存成功
            setDefaultContent(updatedContent)
            setEditingDefaultItem(null)
            setDefaultEditForm({})
            
            errorMessage = '✅ 修改已成功保存到数据库！\n\n⚠️ 由于浏览器存储空间不足，本地备份未能创建，但这不影响数据的保存和使用。\n\n💡 建议清理浏览器缓存以释放存储空间。'
            alert(errorMessage)
            return
          }
        } catch (dbCheckError) {
          console.error('数据库保存检查失败:', dbCheckError)
        }
        
        errorMessage = '⚠️ 本地存储空间不足，保存可能受到影响。\n\n建议清理浏览器缓存后重试。'
      } else if (error.message) {
        // 过滤掉技术性的localStorage错误信息
        if (!error.message.includes('Storage') && !error.message.includes('quota')) {
          errorMessage += `\n错误详情: ${error.message}`
        }
      }
      
      if (error.code && !error.code.includes('QUOTA')) {
        errorMessage += `\n错误代码: ${error.code}`
      }
      
      alert(errorMessage)
    }
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
      <p className="text-sm text-gray-500 mb-6">管理首页轮播图片。系统包含默认轮播内容，您可以添加自定义轮播图片。标有"默认"的为系统预设内容，不可编辑。</p>
      
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
        {carousel.length === 0 && <div className="text-gray-400 text-center py-8">暂无轮播图片</div>}
        {carousel.map((item, i) => (
          <div key={i} className="flex items-center gap-4 border-b py-3">
            <img src={item.image || '/placeholder.png'} alt="轮播图" className="w-20 h-12 rounded-lg object-cover bg-gray-100 border" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-indigo-700 truncate">{item.title}</div>
                {/* 标识是否为默认内容 */}
                {item.isDefault && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">默认</span>
                )}
              </div>
              <div className="text-gray-500 text-sm truncate">{item.description}</div>
            </div>
            {/* 默认内容不能编辑和删除 */}
            {!item.isDefault && (
              <>
                <button onClick={() => handleEdit(i)} className="px-3 py-1 text-xs rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 mr-2">编辑</button>
                <button onClick={() => handleDelete(i)} className="px-3 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">删除</button>
              </>
            )}
            {item.isDefault && (
              <span className="text-xs text-gray-400 px-3 py-1">系统内容</span>
            )}
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
      
      {!defaultContent && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">正在加载默认内容...</p>
          </div>
        </div>
      )}
      
      {defaultContent && Object.keys(defaultContent).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">暂无默认内容数据</p>
          <button
            onClick={loadDefaultContent}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      )}
      
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">文件/下载链接</label>
                          <div className="space-y-3">
                            {/* 文件上传组件 */}
                            <FileUploadComponent
                              onFileReady={(fileUrl, fileName, fileSize) => {
                                setDefaultEditForm((prev: any) => ({
                                  ...prev,
                                  downloadUrl: fileUrl,
                                  fileName: fileName,
                                  size: fileSize
                                }))
                              }}
                              maxSize={100}
                              acceptedTypes={['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.rar', '.txt', '.mp4', '.avi', '.mp3', '.wav', '.jpg', '.png', '.gif', '.bmp']}
                              uploadMethod="base64"
                            />
                            {/* 或手动输入链接 */}
                            <div className="text-center text-gray-500 text-sm">或</div>
                            <input
                              name="downloadUrl"
                              value={defaultEditForm.downloadUrl || ''}
                              onChange={handleDefaultFormChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200"
                              placeholder="手动输入下载链接"
                            />
                          </div>
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
                  <div className="mt-1">
                    {(() => {
                      const urlInfo = formatDownloadUrl(r.downloadUrl)
                      return (
                        <div className="flex items-center gap-2">
                          {urlInfo.type === 'base64' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">{urlInfo.display}</span>
                              <details className="group">
                                <summary className="text-xs text-indigo-400 hover:underline cursor-pointer">查看编码</summary>
                                <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 max-w-md break-all">
                                  {urlInfo.preview}
                                </div>
                              </details>
                            </div>
                          ) : (
                            <a 
                              href={r.downloadUrl} 
                              target="_blank" 
                              className="text-xs text-indigo-400 hover:underline break-all"
                              title={urlInfo.preview || r.downloadUrl}
                            >
                              {urlInfo.display}
                            </a>
                          )}
                        </div>
                      )
                    })()}
                  </div>
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
          <input name="size" value={form.size} onChange={handleChange} placeholder="文件大小 (例如: 2.5MB)" className="px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-200" />
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
          
          {/* 当前下载链接预览 */}
          {form.downloadUrl && (
            <div className="mt-2 p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-700 mb-1">当前下载链接:</div>
              {(() => {
                const urlInfo = formatDownloadUrl(form.downloadUrl)
                return (
                  <div className="flex items-center gap-2">
                    {urlInfo.type === 'base64' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border">{urlInfo.display}</span>
                        <details className="group">
                          <summary className="text-xs text-indigo-400 hover:underline cursor-pointer">查看编码预览</summary>
                          <div className="mt-1 p-2 bg-white rounded text-xs font-mono text-gray-600 max-w-md break-all border">
                            {urlInfo.preview}
                          </div>
                        </details>
                      </div>
                    ) : (
                      <a 
                        href={form.downloadUrl} 
                        target="_blank" 
                        className="text-xs text-indigo-400 hover:underline break-all"
                        title={urlInfo.preview || form.downloadUrl}
                      >
                        {urlInfo.display}
                      </a>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <p className="mt-2 text-gray-600">欢迎使用陈老师AI进化论管理系统</p>
        </div>

        {/* 连接状态卡片 */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">数据库连接状态</h2>
              <button
                onClick={checkConnectionStatus}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                刷新状态
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">
                  {connectionStatus.isConnected ? '已连接' : '连接失败'}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">连接模式:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  connectionStatus.mode === 'sdk' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {connectionStatus.mode === 'sdk' ? 'SDK直连' : 'API模式'}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">最后检查:</span>
                <span className="text-sm">
                  {connectionStatus.lastCheck 
                    ? connectionStatus.lastCheck.toLocaleTimeString() 
                    : '未检查'}
                </span>
              </div>
            </div>

            {!connectionStatus.isConnected && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  ⚠️ 数据库连接异常，系统已自动尝试切换连接模式。
                  如果问题持续，请检查网络连接或联系技术支持。
                </p>
              </div>
            )}

            {connectionStatus.mode === 'api' && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-700">
                  📡 当前使用API模式连接，这是为了确保稳定性的备用方案。
                  系统会自动监控并在条件允许时切换回SDK模式。
                </p>
              </div>
            )}
          </div>
        </div>

                 {/* 统计卡片 */}
         <div className="mb-4">
           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
             <div className="flex items-start gap-2">
               <span className="text-blue-600">📊</span>
               <div className="text-sm text-blue-800">
                 <strong>统计说明：</strong>
                 以下数量包含系统默认内容和用户自定义内容的总数。默认内容来自网站预设，自定义内容通过管理后台添加。
               </div>
             </div>
           </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <div className="bg-white rounded-lg shadow-sm p-6 border">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">智能体</p>
                 <p className="text-2xl font-bold text-gray-900">
                   {isLoading ? '...' : stats.agents}
                 </p>
               </div>
               <div className="p-3 bg-blue-100 rounded-full">
                 <span className="text-blue-600 text-xl">🤖</span>
               </div>
             </div>
           </div>

           <div className="bg-white rounded-lg shadow-sm p-6 border">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">提示词</p>
                 <p className="text-2xl font-bold text-gray-900">
                   {isLoading ? '...' : stats.prompts}
                 </p>
               </div>
               <div className="p-3 bg-green-100 rounded-full">
                 <span className="text-green-600 text-xl">💡</span>
               </div>
             </div>
           </div>

           <div className="bg-white rounded-lg shadow-sm p-6 border">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">教学资源</p>
                 <p className="text-2xl font-bold text-gray-900">
                   {isLoading ? '...' : stats.resources}
                 </p>
               </div>
               <div className="p-3 bg-purple-100 rounded-full">
                 <span className="text-purple-600 text-xl">📚</span>
               </div>
             </div>
           </div>

           <div className="bg-white rounded-lg shadow-sm p-6 border">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">定制申请</p>
                 <p className="text-2xl font-bold text-gray-900">
                   {isLoading ? '...' : stats.requests}
                 </p>
               </div>
               <div className="p-3 bg-orange-100 rounded-full">
                 <span className="text-orange-600 text-xl">📋</span>
               </div>
             </div>
           </div>
         </div>

         {/* 原有模块导航 */}
         <div className="p-8">
           <div className="max-w-4xl mx-auto">
             {/* 数据库连接状态栏 */}
             <div className={`mb-4 p-3 rounded-lg border ${
               dbConnectionStatus === 'connected' ? 'bg-green-50 border-green-200' :
               dbConnectionStatus === 'connecting' ? 'bg-yellow-50 border-yellow-200' :
               'bg-red-50 border-red-200'
             }`}>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${
                     dbConnectionStatus === 'connected' ? 'bg-green-500' :
                     dbConnectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                     'bg-red-500'
                   }`}></div>
                   <span className={`font-medium ${
                     dbConnectionStatus === 'connected' ? 'text-green-700' :
                     dbConnectionStatus === 'connecting' ? 'text-yellow-700' :
                     'text-red-700'
                   }`}>
                     数据库状态: {dbStatusMessage}
                   </span>
                 </div>
                 <button
                   onClick={checkDatabaseConnection}
                   disabled={dbConnectionStatus === 'connecting'}
                   className={`text-xs px-3 py-1 rounded hover:opacity-80 ${
                     dbConnectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
                     dbConnectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
                     'bg-red-100 text-red-700'
                   }`}
                 >
                   {dbConnectionStatus === 'connecting' ? '检查中...' : '重新检查'}
                 </button>
               </div>
             </div>
             
             <div className="flex justify-between items-center mb-8">
               <h1 className="text-3xl font-bold text-indigo-700">管理后台</h1>
               <button onClick={logout} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">退出登录</button>
             </div>
             {/* 优化的模块按钮布局 - 响应式网格 */}
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 justify-center mb-10">
               {modules.map(m => (
                 <button
                   key={m.key}
                   onClick={() => handleSwitchModule(m.key)}
                   className={`flex flex-col items-center px-3 py-4 rounded-2xl shadow transition-all duration-200 border-2 min-h-[100px] w-full ${active === m.key ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-400 scale-105' : 'bg-white text-indigo-700 border-transparent hover:border-indigo-200 hover:shadow-md'}`}
                 >
                   <span className="text-xl mb-1">{m.icon}</span>
                   <span className="font-bold text-xs whitespace-nowrap mb-1">{m.name}</span>
                   <span className="text-[10px] opacity-70 text-center leading-tight hidden sm:block">{m.desc}</span>
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
      </div>
    </div>
  )
} 