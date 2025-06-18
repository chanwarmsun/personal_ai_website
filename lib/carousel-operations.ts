import { supabase } from './supabase'
import type { CarouselItem } from './supabase'
import { dbLogger } from './logger'

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
        .order('updated_at', { ascending: false })
        .limit(1)
      
      if (error) throw error
      return data && data.length > 0 ? data[0].content_data : null
    } catch (error) {
      console.error('获取默认内容失败:', error)
      return null
    }
  },

  // 保存默认内容
  async save(contentType: string, contentData: any): Promise<boolean> {
    try {
      console.log(`🔄 开始保存默认内容，类型: ${contentType}`)
      
      // 先检查是否已存在该类型的记录
      const { data: existing, error: selectError } = await supabase
        .from('default_content')
        .select('id')
        .eq('content_type', contentType)
        .limit(1)
      
      if (selectError) {
        console.error('❌ 查询现有默认内容记录失败:', selectError)
        throw selectError
      }
      
      if (existing && existing.length > 0) {
        // 更新现有记录
        console.log(`🔄 更新现有默认内容记录，ID: ${existing[0].id}`)
        
        const { error: updateError } = await supabase
          .from('default_content')
          .update({
            content_data: contentData,
            updated_at: new Date().toISOString()
          })
          .eq('content_type', contentType)
        
        if (updateError) {
          console.error('❌ 更新默认内容失败:', updateError)
          throw updateError
        }
        
        console.log('✅ 默认内容更新成功')
      } else {
        // 创建新记录
        console.log(`🔄 创建新的默认内容记录`)
        
        const { error: insertError } = await supabase
          .from('default_content')
          .insert({
            content_type: contentType,
            content_data: contentData,
            updated_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.error('❌ 创建默认内容失败:', insertError)
          throw insertError
        }
        
        console.log('✅ 默认内容创建成功')
      }
      
      // 可选：尝试记录到日志系统（如果可用的话）
      try {
        if (dbLogger && typeof dbLogger.logDatabaseOperation === 'function') {
          dbLogger.logDatabaseOperation('default_content', existing ? 'update' : 'insert', true, { 
            contentType 
          })
        }
      } catch (logError: any) {
        // 日志记录失败不影响主要功能
        console.warn('⚠️ 日志记录失败（不影响保存）:', logError.message)
      }
      
      return true
    } catch (error) {
      console.error('❌ 保存默认内容失败:', error)
      
      // 可选：尝试记录错误到日志系统
      try {
        if (dbLogger && typeof dbLogger.logError === 'function') {
          dbLogger.logError('QUERY', '保存默认内容失败', error, { 
            contentType,
            tableName: 'default_content' 
          })
        }
             } catch (logError: any) {
         // 日志记录失败不影响错误处理
         console.warn('⚠️ 错误日志记录失败:', logError.message)
      }
      
      return false
    }
  }
} 