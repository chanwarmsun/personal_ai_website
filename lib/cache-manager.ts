// 智能缓存管理器 - 减少数据库请求，提升加载速度
interface CacheItem<T> {
  data: T
  timestamp: number
  version: string
}

interface CacheConfig {
  defaultTTL: number // 默认缓存时间（毫秒）
  maxAge: number // 最大缓存时间
  enablePersist: boolean // 是否持久化到localStorage
}

class CacheManager {
  private static instance: CacheManager
  private cache = new Map<string, CacheItem<any>>()
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5分钟
    maxAge: 30 * 60 * 1000, // 30分钟最大缓存
    enablePersist: true
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromPersistentStorage()
      // 定期清理过期缓存
      setInterval(() => this.cleanup(), 60000) // 每分钟清理一次
    }
  }

  // 获取缓存数据
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (this.isExpired(item)) {
      this.cache.delete(key)
      this.removeFromPersistentStorage(key)
      return null
    }

    console.log(`🟢 缓存命中: ${key}`)
    return item.data
  }

  // 设置缓存数据
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version: this.generateVersion()
    }

    this.cache.set(key, cacheItem)
    
    if (this.config.enablePersist) {
      this.saveToPersistentStorage(key, cacheItem)
    }

    console.log(`🟡 缓存设置: ${key}, TTL: ${ttl || this.config.defaultTTL}ms`)
  }

  // 删除指定缓存
  delete(key: string): void {
    this.cache.delete(key)
    this.removeFromPersistentStorage(key)
  }

  // 清理所有缓存
  clear(): void {
    this.cache.clear()
    if (typeof window !== 'undefined' && this.config.enablePersist) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'))
      keys.forEach(key => localStorage.removeItem(key))
    }
    console.log('🔴 所有缓存已清理')
  }

  // 智能缓存：如果缓存存在且未过期，返回缓存；否则执行操作并缓存结果
  async getOrSet<T>(
    key: string, 
    operation: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    console.log(`🔄 缓存未命中，执行操作: ${key}`)
    try {
      const data = await operation()
      this.set(key, data, ttl)
      return data
    } catch (error) {
      console.error(`❌ 缓存操作失败: ${key}`, error)
      throw error
    }
  }

  // 预加载多个缓存项
  async preload(items: Array<{ key: string; operation: () => Promise<any>; ttl?: number }>): Promise<void> {
    console.log(`🚀 开始预加载 ${items.length} 个缓存项`)
    
    const promises = items.map(async item => {
      try {
        await this.getOrSet(item.key, item.operation, item.ttl)
      } catch (error) {
        console.error(`预加载失败: ${item.key}`, error)
      }
    })

    await Promise.allSettled(promises)
    console.log('✅ 预加载完成')
  }

  // 获取缓存统计信息
  getStats(): {
    totalItems: number
    memoryUsage: string
    hitRate: number
    oldestItem: string | null
  } {
    const totalItems = this.cache.size
    let oldestTimestamp = Date.now()
    let oldestKey: string | null = null

    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp
        oldestKey = key
      }
    })

    return {
      totalItems,
      memoryUsage: `${Math.round(JSON.stringify(Array.from(this.cache)).length / 1024)}KB`,
      hitRate: 0, // 需要额外追踪
      oldestItem: oldestKey
    }
  }

  // 私有方法
  private isExpired(item: CacheItem<any>): boolean {
    const age = Date.now() - item.timestamp
    return age > this.config.maxAge
  }

  private generateVersion(): string {
    return `v${Date.now().toString(36)}`
  }

  private cleanup(): void {
    const expiredKeys: string[] = []
    
    this.cache.forEach((item, key) => {
      if (this.isExpired(item)) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => {
      this.cache.delete(key)
      this.removeFromPersistentStorage(key)
    })

    if (expiredKeys.length > 0) {
      console.log(`🧹 清理了 ${expiredKeys.length} 个过期缓存项`)
    }
  }

  private loadFromPersistentStorage(): void {
    if (typeof window === 'undefined' || !this.config.enablePersist) return

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'))
      let loadedCount = 0

      keys.forEach(storageKey => {
        try {
          const cacheKey = storageKey.replace('cache_', '')
          const item = JSON.parse(localStorage.getItem(storageKey) || '{}')
          
          if (item.data && item.timestamp && !this.isExpired(item)) {
            this.cache.set(cacheKey, item)
            loadedCount++
          } else {
            localStorage.removeItem(storageKey)
          }
        } catch (error) {
          console.warn(`加载缓存失败: ${storageKey}`, error)
          localStorage.removeItem(storageKey)
        }
      })

      if (loadedCount > 0) {
        console.log(`📦 从本地存储加载了 ${loadedCount} 个缓存项`)
      }
    } catch (error) {
      console.error('从本地存储加载缓存失败:', error)
    }
  }

  private saveToPersistentStorage<T>(key: string, item: CacheItem<T>): void {
    if (typeof window === 'undefined' || !this.config.enablePersist) return

    // 对于大容量数据，跳过 localStorage 存储
    const largeDataKeys = ['agents_list', 'prompts_list', 'resources_list', 'skills_list', 'carousel_list', 'default_content']
    if (largeDataKeys.includes(key)) {
      // 大容量数据只在内存中缓存，不存储到 localStorage
      return
    }

    try {
      const storageKey = `cache_${key}`
      localStorage.setItem(storageKey, JSON.stringify(item))
    } catch (error) {
      // 静默处理，不显示警告
    }
  }

  private removeFromPersistentStorage(key: string): void {
    if (typeof window === 'undefined' || !this.config.enablePersist) return

    try {
      const storageKey = `cache_${key}`
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn(`从本地存储删除缓存失败: ${key}`, error)
    }
  }
}

// 导出缓存管理器实例
export const cacheManager = CacheManager.getInstance()

// 预定义的缓存键
export const CACHE_KEYS = {
  // 数据缓存
  AGENTS: 'agents_list',
  PROMPTS: 'prompts_list',
  RESOURCES: 'resources_list',
  SKILLS: 'skills_list',
  CAROUSEL: 'carousel_list',
  DEFAULT_CONTENT: 'default_content',
  REQUESTS: 'custom_requests',

  // 统计缓存
  STATS: 'admin_stats',

  // 连接状态缓存
  DB_CONNECTION: 'db_connection_status',

  // 用户数据缓存
  USER_PREFERENCES: 'user_preferences'
} as const

// 缓存配置常量
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,  // 2分钟 - 用于频繁变化的数据
  MEDIUM: 5 * 60 * 1000, // 5分钟 - 用于一般数据
  LONG: 15 * 60 * 1000,  // 15分钟 - 用于静态数据
  VERY_LONG: 60 * 60 * 1000 // 1小时 - 用于很少变化的数据
} as const 