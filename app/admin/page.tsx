'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FileUploadComponent from '../../components/FileUploadComponent'
import { agentOperations, promptOperations, resourceOperations, requestOperations } from '../../lib/database'

const modules = [
  { key: 'agents', name: '智能体', desc: '管理AI智能体，支持增删改查', icon: '🤖' },
  { key: 'prompts', name: '提示词', desc: '管理AI提示词，支持增删改查', icon: '💡' },
  { key: 'resources', name: 'AI教学资源', desc: '管理教学资源，支持增删改查', icon: '📚' },
  { key: 'requests', name: '定制申请', desc: '查看用户定制申请，支持状态管理', icon: '📝' },
]

const defaultAgent = { 
  id: '', 
  name: '', 
  description: '', 
  image: '', 
  type: 'chat', 
  url: '', 
  tags: [] 
}

const defaultPrompt = {
  id: '',
  title: '',
  description: '',
  content: '',
  tags: [],
  downloads: 0
}

const defaultResource = {
  id: '',
  title: '',
  description: '',
  type: '课件',
  difficulty: '教师用',
  size: '',
  downloadUrl: '',
  downloads: 0
}

export default function AdminPage() {
  const [active, setActive] = useState('agents')
  const [agents, setAgents] = useState<any[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<any>(defaultAgent)
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin-login')
      return
    }
    // 加载数据
    loadAgents()
    loadPrompts()
    loadResources()
    loadRequests()
  }, [])

  const loadAgents = async () => {
    try {
      const dbAgents = await agentOperations.getAll()
      setAgents(dbAgents)
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
      setResources(dbResources)
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
    if (active === 'agents') return agents
    if (active === 'prompts') return prompts
    return resources
  }

  const getCurrentDefault = () => {
    if (active === 'agents') return defaultAgent
    if (active === 'prompts') return defaultPrompt
    return defaultResource
  }

  const handleSwitchModule = (moduleKey: string) => {
    setActive(moduleKey)
    setEditingIndex(null)
    setForm(moduleKey === 'agents' ? defaultAgent : moduleKey === 'prompts' ? defaultPrompt : defaultResource)
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
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((f: any) => ({ ...f, tags: [...f.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setForm((f: any) => ({ ...f, tags: f.tags.filter((t: string) => t !== tagToRemove) }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const requiredField = active === 'agents' ? 'name' : 'title'
    if (!form[requiredField]?.trim()) return
    
    try {
      if (editingIndex !== null) {
        // 更新现有项目
        if (active === 'agents') {
          const updated = await agentOperations.update(form.id, form)
          if (updated) {
            const newAgents = agents.map((item, i) => i === editingIndex ? updated : item)
            await saveAgents(newAgents)
            // 重新加载数据以确保同步
            await loadAgents()
          }
        } else if (active === 'prompts') {
          const updated = await promptOperations.update(form.id, form)
          if (updated) {
            const newPrompts = prompts.map((item, i) => i === editingIndex ? updated : item)
            await savePrompts(newPrompts)
            // 重新加载数据以确保同步
            await loadPrompts()
          }
        } else {
          const updated = await resourceOperations.update(form.id, {
            ...form,
            download_url: form.downloadUrl
          })
          if (updated) {
            const newResources = resources.map((item, i) => i === editingIndex ? updated : item)
            await saveResources(newResources)
            // 重新加载数据以确保同步
            await loadResources()
          }
        }
        setEditingIndex(null)
      } else {
        // 创建新项目
        if (active === 'agents') {
          const created = await agentOperations.create(form)
          if (created) {
            await saveAgents([...agents, created])
            // 重新加载数据以确保同步
            await loadAgents()
          }
        } else if (active === 'prompts') {
          const created = await promptOperations.create(form)
          if (created) {
            await savePrompts([...prompts, created])
            // 重新加载数据以确保同步
            await loadPrompts()
          }
        } else {
          const created = await resourceOperations.create({
            ...form,
            download_url: form.downloadUrl
          })
          if (created) {
            await saveResources([...resources, created])
            // 重新加载数据以确保同步
            await loadResources()
          }
        }
      }
      
      setForm(getCurrentDefault())
      setTagInput('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleEdit = (idx: number) => {
    setEditingIndex(idx)
    setForm(getCurrentData()[idx])
  }

  const handleDelete = async (idx: number) => {
    const itemName = active === 'agents' ? '智能体' : active === 'prompts' ? '提示词' : '教学资源'
    if (window.confirm(`确定要删除该${itemName}吗？`)) {
      try {
        const currentData = getCurrentData()
        const item = currentData[idx]
        
        // 从数据库删除
        if (active === 'agents') {
          const success = await agentOperations.delete(item.id)
          if (success) {
            const updated = currentData.filter((_, i) => i !== idx)
            await saveAgents(updated)
            // 重新加载数据以确保同步
            await loadAgents()
          }
        } else if (active === 'prompts') {
          const success = await promptOperations.delete(item.id)
          if (success) {
            const updated = currentData.filter((_, i) => i !== idx)
            await savePrompts(updated)
            // 重新加载数据以确保同步
            await loadPrompts()
          }
        } else {
          const success = await resourceOperations.delete(item.id)
          if (success) {
            const updated = currentData.filter((_, i) => i !== idx)
            await saveResources(updated)
            // 重新加载数据以确保同步
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
                {a.tags.map((tag: string) => (
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
            {form.tags.map((tag: string) => (
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
                  {p.tags.map((tag: string) => (
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
            {form.tags.map((tag: string) => (
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
                  提交时间: {new Date(req.createdAt).toLocaleString()}
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">管理后台</h1>
          <button onClick={logout} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">退出登录</button>
        </div>
        <div className="flex gap-6 justify-center mb-10">
          {modules.map(m => (
            <button
              key={m.key}
              onClick={() => handleSwitchModule(m.key)}
              className={`flex flex-col items-center px-6 py-4 rounded-2xl shadow transition-all duration-200 border-2 ${active === m.key ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-400 scale-105' : 'bg-white text-indigo-700 border-transparent hover:border-indigo-200'}`}
            >
              <span className="text-3xl mb-2">{m.icon}</span>
              <span className="font-bold text-lg">{m.name}</span>
              <span className="text-xs mt-1 opacity-70">{m.desc}</span>
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">
          {active === 'agents' && renderAgentModule()}
          {active === 'prompts' && renderPromptModule()}
          {active === 'resources' && renderResourceModule()}
          {active === 'requests' && renderRequestModule()}
        </div>
      </div>
    </div>
  )
} 