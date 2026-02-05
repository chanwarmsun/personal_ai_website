// 优化的数据服务 - 统一管理数据加载，减少重复请求
import { cacheManager, CACHE_KEYS, CACHE_TTL } from './cache-manager'
import { agentOperations, promptOperations, resourceOperations, requestOperations } from './database'
import { carouselOperations } from './carousel-operations'
import { defaultContentProvider } from './default-content-provider'

// 加载状态管理
interface LoadingState {
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

class OptimizedDataService {
  private static instance: OptimizedDataService
  private loadingStates = new Map<string, LoadingState>()
  private preloadPromise: Promise<void> | null = null

  static getInstance(): OptimizedDataService {
    if (!OptimizedDataService.instance) {
      OptimizedDataService.instance = new OptimizedDataService()
    }
    return OptimizedDataService.instance
  }

  // 获取加载状态
  getLoadingState(key: string): LoadingState {
    return this.loadingStates.get(key) || {
      isLoading: false,
      error: null,
      lastUpdated: null
    }
  }

  // 设置加载状态
  private setLoadingState(key: string, state: Partial<LoadingState>): void {
    const currentState = this.getLoadingState(key)
    this.loadingStates.set(key, { ...currentState, ...state })
  }

  // 预加载所有数据 - 在应用启动时调用
  async preloadAllData(): Promise<void> {
    if (this.preloadPromise) {
      return this.preloadPromise
    }

    console.log('🚀 开始预加载网站数据...')
    
    this.preloadPromise = cacheManager.preload([
      {
        key: CACHE_KEYS.AGENTS,
        operation: () => this.loadAgentsData(),
        ttl: CACHE_TTL.MEDIUM
      },
      {
        key: CACHE_KEYS.PROMPTS,
        operation: () => this.loadPromptsData(),
        ttl: CACHE_TTL.MEDIUM
      },
      {
        key: CACHE_KEYS.RESOURCES,
        operation: () => this.loadResourcesData(),
        ttl: CACHE_TTL.MEDIUM
      },
      {
        key: CACHE_KEYS.CAROUSEL,
        operation: () => this.loadCarouselData(),
        ttl: CACHE_TTL.LONG
      },
      {
        key: CACHE_KEYS.DEFAULT_CONTENT,
        operation: () => this.loadDefaultContentData(),
        ttl: CACHE_TTL.VERY_LONG
      }
    ])

    await this.preloadPromise
    console.log('✅ 网站数据预加载完成')
  }

  // 获取智能体数据（缓存优化）
  async getAgents(forceRefresh: boolean = false): Promise<any[]> {
    if (forceRefresh) {
      cacheManager.delete(CACHE_KEYS.AGENTS)
    }

    return cacheManager.getOrSet(
      CACHE_KEYS.AGENTS,
      () => this.loadAgentsData(),
      CACHE_TTL.MEDIUM
    )
  }

  // 获取提示词数据（缓存优化）
  async getPrompts(forceRefresh: boolean = false): Promise<any[]> {
    if (forceRefresh) {
      cacheManager.delete(CACHE_KEYS.PROMPTS)
    }

    return cacheManager.getOrSet(
      CACHE_KEYS.PROMPTS,
      () => this.loadPromptsData(),
      CACHE_TTL.MEDIUM
    )
  }

  // 获取教学资源数据（缓存优化）
  async getResources(forceRefresh: boolean = false): Promise<any[]> {
    if (forceRefresh) {
      cacheManager.delete(CACHE_KEYS.RESOURCES)
    }

    return cacheManager.getOrSet(
      CACHE_KEYS.RESOURCES,
      () => this.loadResourcesData(),
      CACHE_TTL.MEDIUM
    )
  }

  // 获取技能数据（缓存优化）
  async getSkills(forceRefresh: boolean = false): Promise<any[]> {
    if (forceRefresh) {
      cacheManager.delete(CACHE_KEYS.SKILLS)
    }

    return cacheManager.getOrSet(
      CACHE_KEYS.SKILLS,
      () => this.loadSkillsData(),
      CACHE_TTL.MEDIUM
    )
  }

  // 获取轮播数据（缓存优化）
  async getCarousel(forceRefresh: boolean = false): Promise<any[]> {
    if (forceRefresh) {
      cacheManager.delete(CACHE_KEYS.CAROUSEL)
    }

    return cacheManager.getOrSet(
      CACHE_KEYS.CAROUSEL,
      () => this.loadCarouselData(),
      CACHE_TTL.LONG
    )
  }

  // 获取默认内容数据（缓存优化）
  async getDefaultContent(forceRefresh: boolean = false): Promise<any> {
    if (forceRefresh) {
      cacheManager.delete(CACHE_KEYS.DEFAULT_CONTENT)
    }

    return cacheManager.getOrSet(
      CACHE_KEYS.DEFAULT_CONTENT,
      () => this.loadDefaultContentData(),
      CACHE_TTL.VERY_LONG
    )
  }

  // 获取定制申请数据（缓存优化）
  async getRequests(forceRefresh: boolean = false): Promise<any[]> {
    if (forceRefresh) {
      cacheManager.delete(CACHE_KEYS.REQUESTS)
    }

    return cacheManager.getOrSet(
      CACHE_KEYS.REQUESTS,
      () => this.loadRequestsData(),
      CACHE_TTL.SHORT // 定制申请数据更新频繁，使用短缓存
    )
  }

  // 获取统计数据（缓存优化）
  async getStats(forceRefresh: boolean = false): Promise<any> {
    if (forceRefresh) {
      cacheManager.delete(CACHE_KEYS.STATS)
    }

    return cacheManager.getOrSet(
      CACHE_KEYS.STATS,
      () => this.loadStatsData(),
      CACHE_TTL.SHORT
    )
  }

  // 批量刷新数据
  async refreshAllData(): Promise<void> {
    console.log('🔄 刷新所有数据...')
    
    // 清除所有缓存
    Object.values(CACHE_KEYS).forEach(key => {
      cacheManager.delete(key)
    })

    // 重新预加载
    this.preloadPromise = null
    await this.preloadAllData()
  }

  // 当数据更新时，清除相关缓存
  invalidateCache(type: 'agents' | 'prompts' | 'resources' | 'carousel' | 'requests' | 'all'): void {
    switch (type) {
      case 'agents':
        cacheManager.delete(CACHE_KEYS.AGENTS)
        cacheManager.delete(CACHE_KEYS.STATS)
        break
      case 'prompts':
        cacheManager.delete(CACHE_KEYS.PROMPTS)
        cacheManager.delete(CACHE_KEYS.STATS)
        break
      case 'resources':
        cacheManager.delete(CACHE_KEYS.RESOURCES)
        cacheManager.delete(CACHE_KEYS.STATS)
        break
      case 'carousel':
        cacheManager.delete(CACHE_KEYS.CAROUSEL)
        break
      case 'requests':
        cacheManager.delete(CACHE_KEYS.REQUESTS)
        cacheManager.delete(CACHE_KEYS.STATS)
        break
      case 'all':
        cacheManager.clear()
        break
    }
    
    console.log(`🗑️ 清除了 ${type} 相关缓存`)
  }

  // 私有方法：实际的数据加载逻辑
  private async loadAgentsData(): Promise<any[]> {
    this.setLoadingState(CACHE_KEYS.AGENTS, { isLoading: true, error: null })
    
    try {
      console.log('📥 正在加载智能体数据...')
      
      // 并行加载默认智能体和自定义智能体
      const [defaultAgents, customAgents] = await Promise.all([
        defaultContentProvider.getAgents().catch(error => {
          console.warn('加载默认智能体失败:', error)
          return []
        }),
        agentOperations.getAll().catch(error => {
          console.warn('加载自定义智能体失败:', error)
          // 回退到localStorage
          if (typeof window !== 'undefined') {
            return JSON.parse(localStorage.getItem('custom_agents') || '[]')
          }
          return []
        })
      ])

      const agents = [...defaultAgents, ...customAgents]
      
      this.setLoadingState(CACHE_KEYS.AGENTS, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date() 
      })
      
      console.log(`✅ 智能体数据加载完成，数量: ${agents.length}`)
      return agents
    } catch (error: any) {
      this.setLoadingState(CACHE_KEYS.AGENTS, { 
        isLoading: false, 
        error: error.message 
      })
      console.error('❌ 智能体数据加载失败:', error)
      throw error
    }
  }

  private async loadPromptsData(): Promise<any[]> {
    this.setLoadingState(CACHE_KEYS.PROMPTS, { isLoading: true, error: null })
    
    try {
      console.log('📥 正在加载提示词数据...')
      
      const [defaultPrompts, customPrompts] = await Promise.all([
        defaultContentProvider.getPrompts().catch(error => {
          console.warn('加载默认提示词失败:', error)
          return []
        }),
        promptOperations.getAll().catch(error => {
          console.warn('加载自定义提示词失败:', error)
          if (typeof window !== 'undefined') {
            return JSON.parse(localStorage.getItem('custom_prompts') || '[]')
          }
          return []
        })
      ])

      const prompts = [...defaultPrompts, ...customPrompts]
      
      this.setLoadingState(CACHE_KEYS.PROMPTS, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date() 
      })
      
      console.log(`✅ 提示词数据加载完成，数量: ${prompts.length}`)
      return prompts
    } catch (error: any) {
      this.setLoadingState(CACHE_KEYS.PROMPTS, { 
        isLoading: false, 
        error: error.message 
      })
      console.error('❌ 提示词数据加载失败:', error)
      throw error
    }
  }

  private async loadResourcesData(): Promise<any[]> {
    this.setLoadingState(CACHE_KEYS.RESOURCES, { isLoading: true, error: null })
    
    try {
      console.log('📥 正在加载教学资源数据...')
      
      const [defaultResources, customResources] = await Promise.all([
        defaultContentProvider.getTeachingResources().catch((error: any) => {
          console.warn('加载默认教学资源失败:', error)
          return []
        }),
        resourceOperations.getAll().catch(error => {
          console.warn('加载自定义教学资源失败:', error)
          if (typeof window !== 'undefined') {
            return JSON.parse(localStorage.getItem('custom_resources') || '[]')
          }
          return []
        })
      ])

      const resources = [...defaultResources, ...customResources]
      
      this.setLoadingState(CACHE_KEYS.RESOURCES, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date() 
      })
      
      console.log(`✅ 教学资源数据加载完成，数量: ${resources.length}`)
      return resources
    } catch (error: any) {
      this.setLoadingState(CACHE_KEYS.RESOURCES, { 
        isLoading: false, 
        error: error.message 
      })
      console.error('❌ 教学资源数据加载失败:', error)
      throw error
    }
  }

  private async loadCarouselData(): Promise<any[]> {
    this.setLoadingState(CACHE_KEYS.CAROUSEL, { isLoading: true, error: null })

    try {
      console.log('📥 正在加载轮播数据...')

      const carousel = await carouselOperations.getAll().catch(error => {
        console.warn('加载轮播数据失败:', error)
        if (typeof window !== 'undefined') {
          return JSON.parse(localStorage.getItem('custom_carousel') || '[]')
        }
        return []
      })

      this.setLoadingState(CACHE_KEYS.CAROUSEL, {
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      })

      console.log(`✅ 轮播数据加载完成，数量: ${carousel.length}`)
      return carousel
    } catch (error: any) {
      this.setLoadingState(CACHE_KEYS.CAROUSEL, {
        isLoading: false,
        error: error.message
      })
      console.error('❌ 轮播数据加载失败:', error)
      throw error
    }
  }

  private async loadSkillsData(): Promise<any[]> {
    this.setLoadingState(CACHE_KEYS.SKILLS, { isLoading: true, error: null })

    try {
      console.log('📥 正在加载技能数据...')

      // 从默认内容提供者和数据库加载技能
      const [defaultSkills, customSkills] = await Promise.all([
        defaultContentProvider.getSkills().catch(error => {
          console.warn('加载默认技能失败:', error)
          return []
        }),
        // 如果有 skillOperations，从数据库加载
        Promise.resolve([]).catch(() => [])
      ])

      const skills = [...defaultSkills, ...customSkills]

      this.setLoadingState(CACHE_KEYS.SKILLS, {
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      })

      console.log(`✅ 技能数据加载完成，数量: ${skills.length}`)
      return skills
    } catch (error: any) {
      this.setLoadingState(CACHE_KEYS.SKILLS, {
        isLoading: false,
        error: error.message
      })
      console.error('❌ 技能数据加载失败:', error)
      throw error
    }
  }

  private async loadDefaultContentData(): Promise<any> {
    this.setLoadingState(CACHE_KEYS.DEFAULT_CONTENT, { isLoading: true, error: null })
    
    try {
      console.log('📥 正在加载默认内容数据...')
      
      const [agents, prompts, resources] = await Promise.all([
        defaultContentProvider.getAgents(),
        defaultContentProvider.getPrompts(),
        defaultContentProvider.getTeachingResources()
      ])

      const defaultContent = { agents, prompts, resources }
      
      this.setLoadingState(CACHE_KEYS.DEFAULT_CONTENT, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date() 
      })
      
      console.log('✅ 默认内容数据加载完成')
      return defaultContent
    } catch (error: any) {
      this.setLoadingState(CACHE_KEYS.DEFAULT_CONTENT, { 
        isLoading: false, 
        error: error.message 
      })
      console.error('❌ 默认内容数据加载失败:', error)
      throw error
    }
  }

  private async loadRequestsData(): Promise<any[]> {
    this.setLoadingState(CACHE_KEYS.REQUESTS, { isLoading: true, error: null })
    
    try {
      console.log('📥 正在加载定制申请数据...')
      
      const requests = await requestOperations.getAll().catch(error => {
        console.warn('加载定制申请失败:', error)
        if (typeof window !== 'undefined') {
          return JSON.parse(localStorage.getItem('custom_requests') || '[]')
        }
        return []
      })
      
      this.setLoadingState(CACHE_KEYS.REQUESTS, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date() 
      })
      
      console.log(`✅ 定制申请数据加载完成，数量: ${requests.length}`)
      return requests
    } catch (error: any) {
      this.setLoadingState(CACHE_KEYS.REQUESTS, { 
        isLoading: false, 
        error: error.message 
      })
      console.error('❌ 定制申请数据加载失败:', error)
      throw error
    }
  }

  private async loadStatsData(): Promise<any> {
    try {
      console.log('📊 正在计算统计数据...')
      
      // 并行获取所有数据
      const [agents, prompts, resources, requests] = await Promise.all([
        this.getAgents(),
        this.getPrompts(), 
        this.getResources(),
        this.getRequests()
      ])

      const stats = {
        agents: agents.length,
        prompts: prompts.length,
        resources: resources.length,
        requests: requests.length,
        total: agents.length + prompts.length + resources.length,
        lastUpdated: new Date()
      }
      
      console.log('✅ 统计数据计算完成:', stats)
      return stats
    } catch (error: any) {
      console.error('❌ 统计数据计算失败:', error)
      throw error
    }
  }
}

// 导出数据服务实例
export const dataService = OptimizedDataService.getInstance()

// 预加载钩子 - 在应用启动时调用
export const initializeDataService = async (): Promise<void> => {
  try {
    await dataService.preloadAllData()
  } catch (error) {
    console.error('数据服务初始化失败:', error)
    // 不抛出错误，允许应用继续运行
  }
} 