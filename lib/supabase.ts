import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvrikhctrwowswcamkfj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg'

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