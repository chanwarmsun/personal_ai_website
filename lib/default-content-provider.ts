import { defaultContentOperations } from './carousel-operations'
import contentData from '../data/content.json'

// 全局默认内容缓存
let cachedDefaultContent: any = null
let isLoading = false

// 默认内容提供器
export const defaultContentProvider = {
  // 获取默认内容（优先从数据库，回退到静态文件）
  async getDefaultContent(): Promise<any> {
    // 如果正在加载，等待
    if (isLoading) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!isLoading) {
            resolve(cachedDefaultContent || contentData)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    // 如果已有缓存，直接返回
    if (cachedDefaultContent) {
      return cachedDefaultContent
    }

    isLoading = true

    try {
      console.log('🔄 加载默认内容...')
      
      // 优先从数据库加载
      const dbContent = await defaultContentOperations.get('website_default')
      
      if (dbContent) {
        console.log('✅ 从数据库获取默认内容')
        
        // 确保数据格式正确，处理字段映射
        const normalizedContent = {
          personalInfo: dbContent.personalInfo || contentData.personalInfo,
          agents: dbContent.agents || contentData.agents,
          prompts: dbContent.prompts || contentData.prompts,
          teachingResources: dbContent.teachingResources || dbContent.resources || contentData.teachingResources,
          carousel: dbContent.carousel || contentData.carousel
        }
        
        cachedDefaultContent = normalizedContent
        console.log('🔄 数据库内容已缓存')
      } else {
        console.log('⚠️ 数据库中没有默认内容，使用静态文件')
        cachedDefaultContent = contentData
      }
    } catch (error) {
      console.error('❌ 加载默认内容失败，使用静态文件:', error)
      cachedDefaultContent = contentData
    } finally {
      isLoading = false
    }

    return cachedDefaultContent
  },

  // 清除缓存（当管理员修改内容时调用）
  clearCache() {
    console.log('🧹 清除默认内容缓存')
    cachedDefaultContent = null
  },

  // 获取特定类型的内容
  async getAgents() {
    const content = await this.getDefaultContent()
    return content.agents || []
  },

  async getPrompts() {
    const content = await this.getDefaultContent()
    return content.prompts || []
  },

  async getTeachingResources() {
    const content = await this.getDefaultContent()
    return content.teachingResources || []
  },

  async getSkills() {
    const content = await this.getDefaultContent()
    return content.skills || []
  },

  async getCarousel() {
    const content = await this.getDefaultContent()
    return content.carousel || []
  },

  async getPersonalInfo() {
    const content = await this.getDefaultContent()
    return content.personalInfo || contentData.personalInfo
  }
} 