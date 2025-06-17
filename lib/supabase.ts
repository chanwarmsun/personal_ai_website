import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

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
  }
})

// 连接状态管理
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected'
  private lastConnectionCheck = 0
  private readonly CONNECTION_CHECK_INTERVAL = 30000 // 30秒

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager()
    }
    return DatabaseConnectionManager.instance
  }

  async checkConnection(): Promise<boolean> {
    console.log('🔍 DatabaseConnectionManager: 开始连接检查')
    this.connectionStatus = 'connecting'
    this.lastConnectionCheck = Date.now()

    try {
      console.log('📡 执行数据库查询测试...')
      const { data, error } = await supabase
        .from('agents')
        .select('count', { count: 'exact' })
        .limit(1)

      if (error) {
        console.error('❌ 数据库连接检查失败:', error)
        console.error('错误详情:', JSON.stringify(error, null, 2))
        this.connectionStatus = 'disconnected'
        return false
      }

      console.log('✅ 数据库连接检查成功，查询结果:', data)
      this.connectionStatus = 'connected'
      return true
    } catch (error: any) {
      console.error('💥 数据库连接检查异常:', error)
      console.error('异常详情:', error.stack)
      this.connectionStatus = 'disconnected'
      return false
    }
  }

  getStatus(): string {
    return this.connectionStatus
  }
}

// 重试机制
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      return result
    } catch (error: any) {
      console.warn(`操作失败，第 ${attempt} 次尝试:`, error.message)
      
      if (attempt === maxRetries) {
        throw new Error(`操作在 ${maxRetries} 次尝试后仍然失败: ${error.message}`)
      }
      
      // 指数退避
      const waitTime = delay * Math.pow(2, attempt - 1)
      console.log(`等待 ${waitTime}ms 后重试...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw new Error('重试机制异常')
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