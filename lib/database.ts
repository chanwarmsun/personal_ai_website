import { supabase, withRetry, DatabaseConnectionManager, smartConnection, keepAlive } from './supabase'
import type { Agent, Prompt, TeachingResource, CustomRequest, Skill } from './supabase'
import { dbLogger } from './logger'

// 连接管理器实例
const connectionManager = DatabaseConnectionManager.getInstance()

// 启动保活机制
if (typeof window !== 'undefined') {
  keepAlive.start()
  dbLogger.log('INFO', 'KEEPALIVE', '客户端启动保活机制')
}

// 增强的数据库操作基类
class BaseOperations<T> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  // 检查连接并执行操作（智能切换）
  protected async executeWithConnection<R>(operation: () => Promise<R>): Promise<R> {
    const connectionMode = await smartConnection.getOptimalConnection()
    
    if (connectionMode === 'api') {
      console.log(`🔄 使用API模式执行 ${this.tableName} 操作`)
      return await this.executeWithAPI()
    } else {
      console.log(`🔄 使用SDK模式执行 ${this.tableName} 操作`)
      const isConnected = await connectionManager.checkConnection()
      if (!isConnected) {
        throw new Error(`数据库连接失败，无法执行 ${this.tableName} 操作`)
      }
      
      return await withRetry(operation, 3, 1000)
    }
  }

  // API模式执行器
  protected async executeWithAPI<R>(): Promise<R> {
    const apiClient = smartConnection.getApiClient()
    
    // 这里需要子类实现具体的API操作逻辑
    throw new Error('子类需要实现executeWithAPI方法')
  }

  // 通用获取所有记录
  async getAll(): Promise<T[]> {
    const timer = dbLogger.startTimer(`获取${this.tableName}数据`)
    const connectionMode = await smartConnection.getOptimalConnection()
    
    if (connectionMode === 'api') {
      dbLogger.log('DEBUG', 'QUERY', `API模式：开始获取 ${this.tableName} 数据`, {}, { 
        connectionMode: 'api', 
        tableName: this.tableName, 
        operation: 'getAll' 
      })
      
      try {
        const apiClient = smartConnection.getApiClient()
        const data = await apiClient.get(this.tableName, '*')
        const duration = timer()
        
        dbLogger.logDatabaseOperation(this.tableName, 'getAll', true, { 
          recordCount: data?.length || 0,
          mode: 'api'
        }, duration)
        
        return data || []
      } catch (error: any) {
        timer()
        dbLogger.logDatabaseOperation(this.tableName, 'getAll', false, { 
          mode: 'api',
          error: error.message 
        })
        throw error
      }
    } else {
      return this.executeWithConnection(async () => {
        dbLogger.log('DEBUG', 'QUERY', `SDK模式：开始获取 ${this.tableName} 数据`, {}, { 
          connectionMode: 'sdk', 
          tableName: this.tableName, 
          operation: 'getAll' 
        })
        
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false })
        
        const duration = timer()
        
        if (error) {
          dbLogger.logDatabaseOperation(this.tableName, 'getAll', false, { 
            mode: 'sdk',
            error: error.message,
            errorCode: error.code 
          }, duration)
          throw new Error(`获取 ${this.tableName} 失败: ${error.message}`)
        }
        
        dbLogger.logDatabaseOperation(this.tableName, 'getAll', true, { 
          recordCount: data?.length || 0,
          mode: 'sdk'
        }, duration)
        
        return data || []
      })
    }
  }

  // 通用创建记录
  async create(record: Omit<T, 'id' | 'created_at'>): Promise<T | null> {
    const connectionMode = await smartConnection.getOptimalConnection()
    
    if (connectionMode === 'api') {
      console.log(`📝 API模式：创建 ${this.tableName} 记录:`, record)
      const apiClient = smartConnection.getApiClient()
      const data = await apiClient.insert(this.tableName, record)
      console.log(`✅ API模式：成功创建 ${this.tableName}:`, data)
      return Array.isArray(data) ? data[0] : data
    } else {
      return this.executeWithConnection(async () => {
        console.log(`📝 SDK模式：开始创建 ${this.tableName} 记录:`, record)
        
        const { data, error } = await supabase
          .from(this.tableName)
          .insert([record])
          .select()
          .single()
        
        if (error) {
          console.error(`❌ 创建 ${this.tableName} 失败:`, error)
          throw new Error(`创建 ${this.tableName} 失败: ${error.message}`)
        }
        
        console.log(`✅ SDK模式：成功创建 ${this.tableName}:`, data)
        return data
      })
    }
  }

  // 通用更新记录
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const connectionMode = await smartConnection.getOptimalConnection()
    
    if (connectionMode === 'api') {
      console.log(`📝 API模式：更新 ${this.tableName} (ID: ${id}):`, updates)
      const apiClient = smartConnection.getApiClient()
      const data = await apiClient.update(this.tableName, id, updates)
      console.log(`✅ API模式：成功更新 ${this.tableName}:`, data)
      return Array.isArray(data) ? data[0] : data
    } else {
      return this.executeWithConnection(async () => {
        console.log(`📝 SDK模式：开始更新 ${this.tableName} (ID: ${id}):`, updates)
        
        const { data, error } = await supabase
          .from(this.tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
          console.error(`❌ 更新 ${this.tableName} 失败:`, error)
          throw new Error(`更新 ${this.tableName} 失败: ${error.message}`)
        }
        
        console.log(`✅ SDK模式：成功更新 ${this.tableName}:`, data)
        return data
      })
    }
  }

  // 通用删除记录
  async delete(id: string): Promise<boolean> {
    const connectionMode = await smartConnection.getOptimalConnection()
    
    if (connectionMode === 'api') {
      console.log(`🗑️ API模式：删除 ${this.tableName} (ID: ${id})`)
      const apiClient = smartConnection.getApiClient()
      await apiClient.delete(this.tableName, id)
      console.log(`✅ API模式：成功删除 ${this.tableName} (ID: ${id})`)
      return true
    } else {
      return this.executeWithConnection(async () => {
        console.log(`🗑️ SDK模式：开始删除 ${this.tableName} (ID: ${id})`)
        
        const { error } = await supabase
          .from(this.tableName)
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error(`❌ 删除 ${this.tableName} 失败:`, error)
          throw new Error(`删除 ${this.tableName} 失败: ${error.message}`)
        }
        
        console.log(`✅ SDK模式：成功删除 ${this.tableName} (ID: ${id})`)
        return true
      })
    }
  }
}

// 测试数据库连接（增强版）
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔄 测试数据库连接...')
    const connectionMode = await smartConnection.getOptimalConnection()
    
    if (connectionMode === 'sdk') {
      const isConnected = await connectionManager.checkConnection()
      console.log(isConnected ? '✅ SDK连接测试成功' : '❌ SDK连接测试失败')
      return isConnected
    } else {
      const apiClient = smartConnection.getApiClient()
      const isConnected = await apiClient.testConnection()
      console.log(isConnected ? '✅ API连接测试成功' : '❌ API连接测试失败')
      return isConnected
    }
  } catch (error: any) {
    console.error('💥 数据库连接测试异常:', error)
    return false
  }
}

// 智能体操作类
class AgentOperations extends BaseOperations<Agent> {
  constructor() {
    super('agents')
  }

  // 智能体专用创建方法，包含字段验证
  async create(agent: Omit<Agent, 'id' | 'created_at'>): Promise<Agent | null> {
    // 验证必填字段
    if (!agent.name?.trim()) {
      throw new Error('智能体名称不能为空')
    }
    if (!agent.description?.trim()) {
      throw new Error('智能体描述不能为空')
    }
    if (!agent.url?.trim()) {
      throw new Error('智能体链接不能为空')
    }

    // 确保字段格式正确，仅包含数据库表中存在的字段
    const formattedAgent = {
      name: agent.name.trim(),
      description: agent.description.trim(),
      url: agent.url.trim(),
      image: agent.image || '',
      type: agent.type || 'chat' as const,
      tags: Array.isArray(agent.tags) ? agent.tags : []
    }

    return super.create(formattedAgent)
  }
}

// 提示词操作类
class PromptOperations extends BaseOperations<Prompt> {
  constructor() {
    super('prompts')
  }

  // 提示词专用创建方法，包含字段验证
  async create(prompt: Omit<Prompt, 'id' | 'created_at'>): Promise<Prompt | null> {
    // 验证必填字段
    if (!prompt.title?.trim()) {
      throw new Error('提示词标题不能为空')
    }
    if (!prompt.description?.trim()) {
      throw new Error('提示词描述不能为空')
    }
    if (!prompt.content?.trim()) {
      throw new Error('提示词内容不能为空')
    }

    // 确保字段格式正确，仅包含数据库表中存在的字段
    const formattedPrompt = {
      title: prompt.title.trim(),
      description: prompt.description.trim(),
      content: prompt.content.trim(),
      tags: Array.isArray(prompt.tags) ? prompt.tags : [],
      downloads: prompt.downloads || 0
    }

    return super.create(formattedPrompt)
  }
}

// 教学资源操作类
class ResourceOperations extends BaseOperations<TeachingResource> {
  constructor() {
    super('teaching_resources')
  }

  // 教学资源专用创建方法，包含字段验证
  async create(resource: Omit<TeachingResource, 'id' | 'created_at'>): Promise<TeachingResource | null> {
    // 验证必填字段
    if (!resource.title?.trim()) {
      throw new Error('资源标题不能为空')
    }
    if (!resource.description?.trim()) {
      throw new Error('资源描述不能为空')
    }

    // 确保字段格式正确，仅包含数据库表中存在的字段
    const formattedResource = {
      title: resource.title.trim(),
      description: resource.description.trim(),
      type: resource.type || '课件',
      difficulty: resource.difficulty || '教师用',
      size: resource.size || '',
      download_url: resource.download_url || '',
      downloads: resource.downloads || 0
    }

    return super.create(formattedResource)
  }
}

// 定制申请操作类
class RequestOperations extends BaseOperations<CustomRequest> {
  constructor() {
    super('custom_requests')
  }

  // 更新状态的专用方法
  async updateStatus(id: string, status: CustomRequest['status']): Promise<CustomRequest | null> {
    return this.update(id, { status })
  }
}

// 技能库操作类
class SkillOperations extends BaseOperations<Skill> {
  constructor() {
    super('skills')
  }

  // 技能专用创建方法，包含字段验证
  async create(skill: Omit<Skill, 'id' | 'created_at'>): Promise<Skill | null> {
    // 验证必填字段
    if (!skill.name?.trim()) {
      throw new Error('技能名称不能为空')
    }
    if (!skill.description?.trim()) {
      throw new Error('技能描述不能为空')
    }
    if (!skill.content?.trim()) {
      throw new Error('技能内容不能为空')
    }
    if (!skill.category) {
      throw new Error('技能分类不能为空')
    }
    if (!skill.version?.trim()) {
      throw new Error('技能版本不能为空')
    }
    if (!skill.difficulty) {
      throw new Error('技能难度不能为空')
    }

    // 验证分类和难度值
    const validCategories = ['效率工具', '学习辅助', '数据处理', '创意设计', '生活助手', '内容创作']
    const validDifficulties = ['入门', '初级', '中级', '高级']

    if (!validCategories.includes(skill.category)) {
      throw new Error(`无效的技能分类: ${skill.category}`)
    }
    if (!validDifficulties.includes(skill.difficulty)) {
      throw new Error(`无效的技能难度: ${skill.difficulty}`)
    }

    // 确保字段格式正确
    const formattedSkill = {
      name: skill.name.trim(),
      description: skill.description.trim(),
      content: skill.content.trim(),
      image: skill.image || '',
      category: skill.category,
      version: skill.version.trim(),
      difficulty: skill.difficulty,
      tags: Array.isArray(skill.tags) ? skill.tags : [],
      downloads: skill.downloads || 0,
      file_url: skill.file_url || ''
    }

    return super.create(formattedSkill)
  }

  // 更新下载次数
  async incrementDownloads(id: string): Promise<Skill | null> {
    try {
      const { data: current } = await supabase
        .from(this.tableName)
        .select('downloads')
        .eq('id', id)
        .single()

      if (current) {
        return this.update(id, {
          downloads: (current.downloads || 0) + 1
        })
      }
      return null
    } catch (error: any) {
      throw new Error(`更新下载次数失败: ${error.message}`)
    }
  }
}

// 导出操作实例
export const agentOperations = new AgentOperations()
export const promptOperations = new PromptOperations()
export const resourceOperations = new ResourceOperations()
export const requestOperations = new RequestOperations()
export const skillOperations = new SkillOperations()

// 批量操作工具
export const batchOperations = {
  // 批量删除
  async batchDelete(tableName: string, ids: string[]): Promise<boolean> {
    return connectionManager.checkConnection().then(async (isConnected) => {
      if (!isConnected) {
        throw new Error('数据库连接失败，无法执行批量删除操作')
      }

      return withRetry(async () => {
        console.log(`🗑️ 开始批量删除 ${tableName}:`, ids)
        
        const { error } = await supabase
          .from(tableName)
          .delete()
          .in('id', ids)
        
        if (error) {
          console.error(`❌ 批量删除 ${tableName} 失败:`, error)
          throw new Error(`批量删除 ${tableName} 失败: ${error.message}`)
        }
        
        console.log(`✅ 成功批量删除 ${ids.length} 条 ${tableName} 记录`)
        return true
      }, 3, 1000)
    })
  },

  // 获取数据库统计信息
  async getStatistics(): Promise<{agents: number, prompts: number, resources: number, requests: number}> {
    return connectionManager.checkConnection().then(async (isConnected) => {
      if (!isConnected) {
        throw new Error('数据库连接失败，无法获取统计信息')
      }

      return withRetry(async () => {
        console.log('📊 开始获取数据库统计信息...')
        
        const [agentsResult, promptsResult, resourcesResult, requestsResult] = await Promise.all([
          supabase.from('agents').select('count', { count: 'exact' }),
          supabase.from('prompts').select('count', { count: 'exact' }),
          supabase.from('teaching_resources').select('count', { count: 'exact' }),
          supabase.from('custom_requests').select('count', { count: 'exact' })
        ])

        const stats = {
          agents: agentsResult.count || 0,
          prompts: promptsResult.count || 0,
          resources: resourcesResult.count || 0,
          requests: requestsResult.count || 0
        }

        console.log('📊 数据库统计信息:', stats)
        return stats
      }, 3, 1000)
    })
  }
}

