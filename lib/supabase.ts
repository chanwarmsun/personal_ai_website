import { createClient } from '@supabase/supabase-js'
import { dbLogger } from './logger'

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 验证必需的环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少必需的Supabase环境变量。请检查.env.local文件中的NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY配置。')
}

// 创建增强配置的Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'ai-website-admin'
    }
  },
  // 添加连接池和重试配置
  db: {
    schema: 'public'
  }
})

// 数据库保活机制
class DatabaseKeepAlive {
  private static instance: DatabaseKeepAlive
  private keepAliveInterval: NodeJS.Timeout | null = null
  private readonly KEEP_ALIVE_INTERVAL = 5 * 60 * 1000 // 5分钟（提高频率确保连接稳定）
  private isActive = false

  static getInstance(): DatabaseKeepAlive {
    if (!DatabaseKeepAlive.instance) {
      DatabaseKeepAlive.instance = new DatabaseKeepAlive()
    }
    return DatabaseKeepAlive.instance
  }

  start() {
    if (this.keepAliveInterval || this.isActive) {
      dbLogger.log('DEBUG', 'KEEPALIVE', '保活机制已经运行中')
      return
    }

    this.isActive = true
    dbLogger.log('INFO', 'KEEPALIVE', '启动优化后的数据库保活机制', { 
      interval: this.KEEP_ALIVE_INTERVAL,
      intervalMinutes: this.KEEP_ALIVE_INTERVAL / 60000
    })
    
    this.keepAliveInterval = setInterval(async () => {
      const timer = dbLogger.startTimer('数据库保活查询')
      try {
        dbLogger.log('DEBUG', 'KEEPALIVE', '开始执行保活查询')
        
        // 使用轻量级查询，避免资源浪费
        const { data, error } = await supabase
          .from('agents')
          .select('id')
          .limit(1)
          .single()
        
        const duration = timer()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 是无数据错误，不算失败
          dbLogger.logError('KEEPALIVE', '保活查询失败', error, { duration })
          
          // 如果是暂停相关的错误，尝试唤醒
          if (error.message.includes('paused') || error.message.includes('inactive')) {
            dbLogger.log('WARN', 'KEEPALIVE', '检测到数据库暂停，触发唤醒流程')
            this.triggerWakeUp()
          }
        } else {
          dbLogger.logKeepAlive(true, { 
            hasData: !!data,
            duration,
            timestamp: new Date().toISOString()
          })
        }
      } catch (error: any) {
        timer()
        dbLogger.logKeepAlive(false, { 
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        })
        
        // 如果连接完全失败，降低频率避免过度请求
        if (error.message.includes('network') || error.message.includes('timeout')) {
          dbLogger.log('WARN', 'KEEPALIVE', '网络问题，暂时停止保活机制30秒')
          this.pause(30000)
        }
      }
    }, this.KEEP_ALIVE_INTERVAL)
  }

  // 新增：暂停保活机制
  pause(duration: number) {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
      
      setTimeout(() => {
        if (this.isActive) {
          this.start()
        }
      }, duration)
    }
  }

  // 新增：触发数据库唤醒
  private async triggerWakeUp() {
    dbLogger.log('INFO', 'KEEPALIVE', '开始自动数据库唤醒流程')
    
    try {
      // 发送多个简单查询来唤醒数据库
      const tables = ['agents', 'prompts', 'teaching_resources']
      
      for (const table of tables) {
        try {
          await supabase.from(table).select('id').limit(1)
          dbLogger.log('DEBUG', 'KEEPALIVE', `唤醒查询 ${table} 完成`)
          
          // 间隔1秒避免过度请求
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          dbLogger.log('DEBUG', 'KEEPALIVE', `唤醒查询 ${table} 失败`, { error })
        }
      }
      
      dbLogger.log('INFO', 'KEEPALIVE', '自动数据库唤醒流程完成')
    } catch (error) {
      dbLogger.logError('KEEPALIVE', '自动数据库唤醒失败', error)
    }
  }

  stop() {
    this.isActive = false
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
      dbLogger.log('INFO', 'KEEPALIVE', '数据库保活机制已停止')
    }
  }
}

// 导出保活实例
export const keepAlive = DatabaseKeepAlive.getInstance()

// 连接状态管理（增强版）
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected'
  private lastConnectionCheck = 0
  private readonly CONNECTION_CHECK_INTERVAL = 3 * 60 * 1000 // 3分钟（进一步减少检查频率）
  private retryCount = 0
  private readonly MAX_RETRIES = 3 // 减少最大重试次数，避免过度请求
  private consecutiveFailures = 0
  private readonly MAX_CONSECUTIVE_FAILURES = 3

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager()
    }
    return DatabaseConnectionManager.instance
  }

  async checkConnection(): Promise<boolean> {
    const previousStatus = this.connectionStatus
    this.connectionStatus = 'connecting'
    this.lastConnectionCheck = Date.now()
    
    const timer = dbLogger.startTimer('数据库连接检查')
    dbLogger.logConnectionChange(previousStatus, 'connecting', '开始连接检查')

    try {
      dbLogger.log('DEBUG', 'CONNECTION', '执行数据库查询测试', { table: 'agents', retryCount: this.retryCount })
      
      const { data, error } = await supabase
        .from('agents')
        .select('count', { count: 'exact' })
        .limit(1)

      const duration = timer()

      if (error) {
        this.connectionStatus = 'error'
        this.retryCount++
        
        dbLogger.logError('CONNECTION', '数据库连接检查失败', error, { 
          retryCount: this.retryCount, 
          duration,
          previousStatus 
        })
        
        // 如果是暂停错误，尝试唤醒数据库
        if (error.message.includes('paused') || error.message.includes('inactive')) {
          dbLogger.log('WARN', 'CONNECTION', '检测到数据库暂停，开始唤醒流程', { errorMessage: error.message })
          await this.wakeUpDatabase()
        }
        
        dbLogger.logConnectionChange('connecting', 'error', `连接失败: ${error.code || 'UNKNOWN'}`)
        return false
      }

      this.connectionStatus = 'connected'
      const oldRetryCount = this.retryCount
      this.retryCount = 0
      
      dbLogger.log('INFO', 'CONNECTION', '数据库连接检查成功', { 
        recordCount: data?.length || 0, 
        duration,
        retriesCleared: oldRetryCount > 0 ? oldRetryCount : undefined
      })
      
      dbLogger.logConnectionChange('connecting', 'connected', '连接成功')
      return true
    } catch (error: any) {
      timer()
      this.connectionStatus = 'error'
      this.retryCount++
      
      dbLogger.logError('CONNECTION', '数据库连接检查异常', error, { 
        retryCount: this.retryCount,
        previousStatus 
      })
      
      dbLogger.logConnectionChange('connecting', 'error', `连接异常: ${error.message}`)
      return false
    }
  }

  // 数据库唤醒机制
  private async wakeUpDatabase(): Promise<void> {
    const timer = dbLogger.startTimer('数据库唤醒')
    dbLogger.log('INFO', 'CONNECTION', '开始数据库唤醒流程')
    
    try {
      // 多次尝试连接以唤醒数据库
      for (let i = 0; i < 3; i++) {
        const attemptTimer = dbLogger.startTimer(`唤醒尝试${i + 1}`)
        dbLogger.log('DEBUG', 'CONNECTION', `执行唤醒尝试 ${i + 1}/3`)
        
        try {
          await supabase.from('agents').select('id').limit(1)
          const attemptDuration = attemptTimer()
          dbLogger.log('DEBUG', 'CONNECTION', `唤醒尝试 ${i + 1} 完成`, { duration: attemptDuration })
        } catch (attemptError: any) {
          attemptTimer()
          dbLogger.log('WARN', 'CONNECTION', `唤醒尝试 ${i + 1} 失败`, { error: attemptError.message })
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      const totalDuration = timer()
      dbLogger.log('INFO', 'CONNECTION', '数据库唤醒流程完成', { totalDuration })
    } catch (error: any) {
      timer()
      dbLogger.logError('CONNECTION', '数据库唤醒失败', error)
    }
  }

  getStatus(): string {
    return this.connectionStatus
  }

  getRetryCount(): number {
    return this.retryCount
  }

  shouldUseApiMode(): boolean {
    return this.retryCount >= this.MAX_RETRIES
  }
}

// 重试机制
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  operationName: string = '数据库操作'
): Promise<T> {
  const timer = dbLogger.startTimer(`重试操作: ${operationName}`)
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      const duration = timer()
      
      if (attempt > 1) {
        dbLogger.log('INFO', 'RETRY', `重试操作成功: ${operationName}`, { 
          finalAttempt: attempt, 
          totalDuration: duration 
        }, { operation: operationName, retryCount: attempt })
      }
      
      return result
    } catch (error: any) {
      dbLogger.logRetry(operationName, attempt, maxRetries, error)
      
      if (attempt === maxRetries) {
        timer()
        const finalError = new Error(`操作在 ${maxRetries} 次尝试后仍然失败: ${error.message}`)
        dbLogger.logError('RETRY', `重试操作最终失败: ${operationName}`, finalError, { 
          maxRetries, 
          originalError: error.message 
        })
        throw finalError
      }
      
      // 指数退避
      const waitTime = delay * Math.pow(2, attempt - 1)
      dbLogger.log('DEBUG', 'RETRY', `等待 ${waitTime}ms 后重试 ${operationName}`, { 
        waitTime, 
        attempt, 
        maxRetries 
      })
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  timer()
  const error = new Error('重试机制异常')
  dbLogger.logError('RETRY', `重试机制异常: ${operationName}`, error)
  throw error
}

// 数据库表类型定义
export interface Agent {
  id: string
  name: string
  description: string
  image: string
  type: 'chat' | 'download'
  url: string
  tags: string[]
  created_at?: string
}

export interface Prompt {
  id: string
  title: string
  description: string
  content: string
  tags: string[]
  downloads: number
  created_at?: string
}

export interface TeachingResource {
  id: string
  title: string
  description: string
  type: string
  difficulty: string
  size: string
  download_url: string
  downloads: number
  created_at?: string
}

export interface CustomRequest {
  id: string
  type: 'agent' | 'prompt' | 'resource'
  name: string
  email: string
  title: string
  description: string
  requirements: string
  urgency: string
  contact?: string
  status: '待处理' | '处理中' | '已完成' | '已取消'
  created_at: string
}

export interface CarouselItem {
  id: string
  title: string
  image: string
  description: string
  order_index?: number
  created_at?: string
}

export interface DefaultContent {
  id: string
  content_type: 'agents' | 'prompts' | 'teaching_resources' | 'carousel'
  content_data: any
  updated_at?: string
}

// API备用方案
export class SupabaseApiClient {
  private static instance: SupabaseApiClient
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvrikhctrwowswcamkfj.supabase.co'
    this.apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'
  }

  static getInstance(): SupabaseApiClient {
    if (!SupabaseApiClient.instance) {
      SupabaseApiClient.instance = new SupabaseApiClient()
    }
    return SupabaseApiClient.instance
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}/rest/v1/${endpoint}`
    
    const defaultHeaders = {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // 获取数据
  async get(table: string, select: string = '*', filters: Record<string, any> = {}): Promise<any[]> {
    let endpoint = `${table}?select=${select}`
    
    // 添加过滤条件
    Object.entries(filters).forEach(([key, value]) => {
      endpoint += `&${key}=eq.${value}`
    })

    return this.makeRequest(endpoint)
  }

  // 创建数据
  async insert(table: string, data: any): Promise<any> {
    return this.makeRequest(table, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // 更新数据
  async update(table: string, id: string, data: any): Promise<any> {
    return this.makeRequest(`${table}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  // 删除数据
  async delete(table: string, id: string): Promise<void> {
    await this.makeRequest(`${table}?id=eq.${id}`, {
      method: 'DELETE'
    })
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      await this.get('agents', 'count', {})
      return true
    } catch (error) {
      console.error('API连接测试失败:', error)
      return false
    }
  }
}

// 智能连接管理器 - 自动切换SDK和API
export class SmartConnectionManager {
  private static instance: SmartConnectionManager
  private connectionManager: DatabaseConnectionManager
  private apiClient: SupabaseApiClient
  private currentMode: 'sdk' | 'api' = 'sdk'

  constructor() {
    this.connectionManager = DatabaseConnectionManager.getInstance()
    this.apiClient = SupabaseApiClient.getInstance()
  }

  static getInstance(): SmartConnectionManager {
    if (!SmartConnectionManager.instance) {
      SmartConnectionManager.instance = new SmartConnectionManager()
    }
    return SmartConnectionManager.instance
  }

  // 自动选择最佳连接方式
  async getOptimalConnection(): Promise<'sdk' | 'api'> {
    const previousMode = this.currentMode
    const timer = dbLogger.startTimer('智能连接选择')
    
    dbLogger.log('INFO', 'SWITCH', '智能连接管理器开始检测最佳连接方式', { currentMode: previousMode })
    
    // 首先尝试SDK连接
    dbLogger.log('DEBUG', 'SWITCH', '开始测试SDK连接')
    const sdkConnected = await this.connectionManager.checkConnection()
    
    if (sdkConnected) {
      const duration = timer()
      if (previousMode !== 'sdk') {
        dbLogger.logModeSwitch(previousMode, 'sdk', 'SDK连接恢复正常')
      }
      dbLogger.log('INFO', 'SWITCH', 'SDK连接正常，使用SDK模式', { duration, previousMode })
      this.currentMode = 'sdk'
      return 'sdk'
    }

    // SDK失败，尝试API
    dbLogger.log('WARN', 'SWITCH', 'SDK连接失败，尝试API模式')
    const apiTimer = dbLogger.startTimer('API连接测试')
    const apiConnected = await this.apiClient.testConnection()
    const apiDuration = apiTimer()
    
    if (apiConnected) {
      const totalDuration = timer()
      if (previousMode !== 'api') {
        dbLogger.logModeSwitch(previousMode, 'api', 'SDK失败，切换到API模式')
      }
      dbLogger.log('INFO', 'SWITCH', 'API连接成功，切换到API模式', { 
        totalDuration, 
        apiDuration, 
        previousMode 
      })
      this.currentMode = 'api'
      return 'api'
    }

    const totalDuration = timer()
    dbLogger.logError('SWITCH', 'SDK和API都连接失败', new Error('全部连接方式失败'), { 
      totalDuration, 
      apiDuration,
      fallbackMode: 'sdk' 
    })
    this.currentMode = 'sdk' // 默认回退到SDK
    return 'sdk'
  }

  getCurrentMode(): 'sdk' | 'api' {
    return this.currentMode
  }

  getApiClient(): SupabaseApiClient {
    return this.apiClient
  }

  getConnectionManager(): DatabaseConnectionManager {
    return this.connectionManager
  }
}

// 导出智能连接管理器实例
export const smartConnection = SmartConnectionManager.getInstance()