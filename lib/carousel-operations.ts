import { supabase } from './supabase'
import type { CarouselItem } from './supabase'

export const carouselOperations = {
  // 获取所有轮播项
  async getAll(): Promise<CarouselItem[]> {
    try {
      const { data, error } = await supabase
        .from('carousel_items')
        .select('*')
        .order('order_index')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取轮播数据失败:', error)
      return []
    }
  },

  // 创建新轮播项
  async create(item: Omit<CarouselItem, 'id' | 'created_at'>): Promise<CarouselItem | null> {
    try {
      const { data, error } = await supabase
        .from('carousel_items')
        .insert([{
          title: item.title,
          image: item.image,
          description: item.description,
          order_index: item.order_index || 0
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('创建轮播项失败:', error)
      return null
    }
  },

  // 更新轮播项
  async update(id: string, updates: Partial<CarouselItem>): Promise<CarouselItem | null> {
    try {
      const { data, error } = await supabase
        .from('carousel_items')
        .update({
          title: updates.title,
          image: updates.image,
          description: updates.description,
          order_index: updates.order_index
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('更新轮播项失败:', error)
      return null
    }
  },

  // 删除轮播项
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('carousel_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('删除轮播项失败:', error)
      return false
    }
  },

  // 批量更新轮播项顺序
  async updateOrder(items: { id: string; order_index: number }[]): Promise<boolean> {
    try {
      const promises = items.map(item =>
        supabase
          .from('carousel_items')
          .update({ order_index: item.order_index })
          .eq('id', item.id)
      )
      
      await Promise.all(promises)
      return true
    } catch (error) {
      console.error('更新轮播顺序失败:', error)
      return false
    }
  }
}

export const defaultContentOperations = {
  // 获取默认内容
  async get(contentType: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('default_content')
        .select('content_data')
        .eq('content_type', contentType)
        .single()
      
      if (error) throw error
      return data?.content_data || null
    } catch (error) {
      console.error('获取默认内容失败:', error)
      return null
    }
  },

  // 保存默认内容
  async save(contentType: string, contentData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('default_content')
        .upsert({
          content_type: contentType,
          content_data: contentData,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('保存默认内容失败:', error)
      return false
    }
  }
} 