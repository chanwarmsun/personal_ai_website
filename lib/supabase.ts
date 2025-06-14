import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  downloadUrl: string
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