import { supabase } from './supabase'
import type { Agent, Prompt, TeachingResource, CustomRequest } from './supabase'

// 测试数据库连接
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('agents').select('count', { count: 'exact' })
    if (error) {
      console.error('数据库连接测试失败:', error)
      return false
    }
    console.log('数据库连接成功')
    return true
  } catch (error) {
    console.error('数据库连接异常:', error)
    return false
  }
}

// 智能体相关操作
export const agentOperations = {
  // 获取所有智能体
  async getAll(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('获取智能体失败:', error)
      return []
    }
    return data || []
  },

  // 创建智能体
  async create(agent: Omit<Agent, 'id' | 'created_at'>): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single()
    
    if (error) {
      console.error('创建智能体失败:', error)
      return null
    }
    return data
  },

  // 更新智能体
  async update(id: string, updates: Partial<Agent>): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('更新智能体失败:', error)
      return null
    }
    return data
  },

  // 删除智能体
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('删除智能体失败:', error)
      return false
    }
    return true
  }
}

// 提示词相关操作
export const promptOperations = {
  // 获取所有提示词
  async getAll(): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('获取提示词失败:', error)
      return []
    }
    return data || []
  },

  // 创建提示词
  async create(prompt: Omit<Prompt, 'id' | 'created_at'>): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .insert([prompt])
      .select()
      .single()
    
    if (error) {
      console.error('创建提示词失败:', error)
      return null
    }
    return data
  },

  // 更新提示词
  async update(id: string, updates: Partial<Prompt>): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('更新提示词失败:', error)
      return null
    }
    return data
  },

  // 删除提示词
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('删除提示词失败:', error)
      return false
    }
    return true
  }
}

// 教学资源相关操作
export const resourceOperations = {
  // 获取所有教学资源
  async getAll(): Promise<TeachingResource[]> {
    const { data, error } = await supabase
      .from('teaching_resources')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('获取教学资源失败:', error)
      return []
    }
    return data || []
  },

  // 创建教学资源
  async create(resource: Omit<TeachingResource, 'id' | 'created_at'>): Promise<TeachingResource | null> {
    const { data, error } = await supabase
      .from('teaching_resources')
      .insert([resource])
      .select()
      .single()
    
    if (error) {
      console.error('创建教学资源失败:', error)
      return null
    }
    return data
  },

  // 更新教学资源
  async update(id: string, updates: Partial<TeachingResource>): Promise<TeachingResource | null> {
    const { data, error } = await supabase
      .from('teaching_resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('更新教学资源失败:', error)
      return null
    }
    return data
  },

  // 删除教学资源
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('teaching_resources')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('删除教学资源失败:', error)
      return false
    }
    return true
  }
}

// 定制需求相关操作
export const requestOperations = {
  // 获取所有定制需求
  async getAll(): Promise<CustomRequest[]> {
    const { data, error } = await supabase
      .from('custom_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('获取定制需求失败:', error)
      return []
    }
    return data || []
  },

  // 创建定制需求
  async create(request: Omit<CustomRequest, 'id' | 'created_at'>): Promise<CustomRequest | null> {
    const { data, error } = await supabase
      .from('custom_requests')
      .insert([request])
      .select()
      .single()
    
    if (error) {
      console.error('创建定制需求失败:', error)
      return null
    }
    return data
  },

  // 更新定制需求状态
  async updateStatus(id: string, status: CustomRequest['status']): Promise<CustomRequest | null> {
    const { data, error } = await supabase
      .from('custom_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('更新定制需求状态失败:', error)
      return null
    }
    return data
  },

  // 删除定制需求
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('custom_requests')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('删除定制需求失败:', error)
      return false
    }
    return true
  }
} 