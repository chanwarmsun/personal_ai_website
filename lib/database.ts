import { supabase, withRetry, DatabaseConnectionManager } from './supabase'
import type { Agent, Prompt, TeachingResource, CustomRequest } from './supabase'

// 连接管理器实例
const connectionManager = DatabaseConnectionManager.getInstance()

// 增强的数据库操作基类
class BaseOperations<T> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  // 检查连接并执行操作
  protected async executeWithConnection<R>(operation: () => Promise<R>): Promise<R> {
    const isConnected = await connectionManager.checkConnection()
    if (!isConnected) {
      throw new Error(`数据库连接失败，无法执行 ${this.tableName} 操作`)
    }
    
    return await withRetry(operation, 3, 1000)
  }

  // 通用获取所有记录
  async getAll(): Promise<T[]> {
    return this.executeWithConnection(async () => {
      console.log(`🔍 开始获取 ${this.tableName} 数据...`)
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error(`❌ 获取 ${this.tableName} 失败:`, error)
        throw new Error(`获取 ${this.tableName} 失败: ${error.message}`)
      }
      
      console.log(`✅ 成功获取 ${data?.length || 0} 条 ${this.tableName} 记录`)
      return data || []
    })
  }

  // 通用创建记录
  async create(record: Omit<T, 'id' | 'created_at'>): Promise<T | null> {
    return this.executeWithConnection(async () => {
      console.log(`📝 开始创建 ${this.tableName} 记录:`, record)
      
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([record])
        .select()
        .single()
      
      if (error) {
        console.error(`❌ 创建 ${this.tableName} 失败:`, error)
        throw new Error(`创建 ${this.tableName} 失败: ${error.message}`)
      }
      
      console.log(`✅ 成功创建 ${this.tableName}:`, data)
      return data
    })
  }

  // 通用更新记录
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    return this.executeWithConnection(async () => {
      console.log(`📝 开始更新 ${this.tableName} (ID: ${id}):`, updates)
      
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
      
      console.log(`✅ 成功更新 ${this.tableName}:`, data)
      return data
    })
  }

  // 通用删除记录
  async delete(id: string): Promise<boolean> {
    return this.executeWithConnection(async () => {
      console.log(`🗑️ 开始删除 ${this.tableName} (ID: ${id})`)
      
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error(`❌ 删除 ${this.tableName} 失败:`, error)
        throw new Error(`删除 ${this.tableName} 失败: ${error.message}`)
      }
      
      console.log(`✅ 成功删除 ${this.tableName} (ID: ${id})`)
      return true
    })
  }
}

// 测试数据库连接
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔄 测试数据库连接...')
    const isConnected = await connectionManager.checkConnection()
    
    if (isConnected) {
      console.log('✅ 数据库连接测试成功')
    } else {
      console.log('❌ 数据库连接测试失败')
    }
    
    return isConnected
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

// 导出操作实例
export const agentOperations = new AgentOperations()
export const promptOperations = new PromptOperations()
export const resourceOperations = new ResourceOperations()
export const requestOperations = new RequestOperations()

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

