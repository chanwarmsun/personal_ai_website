/**
 * 性能优化工具类
 * 用于管理缓存、图片优化、懒加载等性能相关功能
 */

// 缓存管理器
export class CacheManager {
  private static memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  static set(key: string, data: any, ttl: number = 300000): void { // 默认5分钟缓存
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    
    // 清理过期缓存
    this.cleanup()
  }
  
  static get<T>(key: string): T | null {
    const cached = this.memoryCache.get(key)
    
    if (!cached) {
      return null
    }
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.memoryCache.delete(key)
      return null
    }
    
    return cached.data as T
  }
  
  static clear(): void {
    this.memoryCache.clear()
    console.log('🗑️ 内存缓存已清空')
  }
  
  private static cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.memoryCache.delete(key)
      }
    }
  }
}

// 图片优化器
export class ImageOptimizer {
  /**
   * 压缩图片到指定大小和质量
   */
  static async compressImage(
    file: File, 
    maxWidth: number = 800, 
    quality: number = 0.8,
    format: string = 'image/jpeg'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        try {
          // 计算压缩后的尺寸
          let { width, height } = img
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          canvas.width = width
          canvas.height = height
          
          // 绘制压缩后的图片
          ctx?.drawImage(img, 0, 0, width, height)
          
          // 转换为base64，使用指定质量
          const compressedDataUrl = canvas.toDataURL(format, quality)
          resolve(compressedDataUrl)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 智能压缩：根据文件大小自动选择参数
   */
  static async smartCompress(file: File): Promise<string> {
    const fileSizeMB = file.size / (1024 * 1024)
    
    if (fileSizeMB > 5) {
      // 大文件：高压缩
      return this.compressImage(file, 600, 0.6)
    } else if (fileSizeMB > 2) {
      // 中等文件：中等压缩
      return this.compressImage(file, 800, 0.7)
    } else {
      // 小文件：轻度压缩
      return this.compressImage(file, 1000, 0.8)
    }
  }

  /**
   * 懒加载图片
   */
  static setupLazyLoading(selector: string = 'img[data-lazy]'): void {
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target as HTMLImageElement
            lazyImage.src = lazyImage.dataset.lazy || ''
            lazyImage.classList.remove('lazy')
            lazyImageObserver.unobserve(lazyImage)
          }
        })
      })

      document.querySelectorAll(selector).forEach((lazyImage) => {
        lazyImageObserver.observe(lazyImage)
      })
    }
  }
}

// 懒加载管理器
export class LazyLoader {
  /**
   * 懒加载函数执行器
   */
  static async loadWhenNeeded<T>(
    key: string,
    loader: () => Promise<T>,
    cacheTtl: number = 300000
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = CacheManager.get<T>(key)
    if (cached) {
      console.log(`⚡ 从缓存获取: ${key}`)
      return cached
    }
    
    console.log(`🔄 加载数据: ${key}`)
    const startTime = Date.now()
    
    try {
      const result = await loader()
      const duration = Date.now() - startTime
      
      // 缓存结果
      CacheManager.set(key, result, cacheTtl)
      console.log(`✅ 数据加载完成: ${key} (${duration}ms)`)
      
      return result
    } catch (error) {
      console.error(`❌ 数据加载失败: ${key}`, error)
      throw error
    }
  }

  /**
   * 批量懒加载
   */
  static async loadBatch<T>(
    loaders: Array<{
      key: string
      loader: () => Promise<T>
      cacheTtl?: number
    }>,
    concurrent: number = 3
  ): Promise<T[]> {
    const results: T[] = []
    
    // 分批执行以控制并发
    for (let i = 0; i < loaders.length; i += concurrent) {
      const batch = loaders.slice(i, i + concurrent)
      const batchPromises = batch.map(({ key, loader, cacheTtl }) =>
        this.loadWhenNeeded(key, loader, cacheTtl)
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }
}

// 性能监控器
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>()
  
  /**
   * 开始性能监控
   */
  static start(name: string): () => number {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration)
      return duration
    }
  }
  
  /**
   * 记录性能指标
   */
  static recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metrics = this.metrics.get(name)!
    metrics.push(duration)
    
    // 只保留最近50次记录
    if (metrics.length > 50) {
      metrics.shift()
    }
  }
  
  /**
   * 获取性能统计
   */
  static getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) {
      return null
    }
    
    const avg = metrics.reduce((sum, val) => sum + val, 0) / metrics.length
    const min = Math.min(...metrics)
    const max = Math.max(...metrics)
    
    return { avg, min, max, count: metrics.length }
  }
  
  /**
   * 打印性能报告
   */
  static printReport(): void {
    console.group('📊 性能监控报告')
    
    for (const [name, metrics] of this.metrics.entries()) {
      const stats = this.getStats(name)
      if (stats) {
        console.log(`${name}:`, {
          平均用时: `${stats.avg.toFixed(2)}ms`,
          最短用时: `${stats.min.toFixed(2)}ms`,
          最长用时: `${stats.max.toFixed(2)}ms`,
          调用次数: stats.count
        })
      }
    }
    
    console.groupEnd()
  }
}

// 防抖和节流工具
export class Throttle {
  private static debounceTimers = new Map<string, NodeJS.Timeout>()
  private static throttleTimers = new Map<string, boolean>()
  
  /**
   * 防抖
   */
  static debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      
      const timer = setTimeout(() => {
        func(...args)
        this.debounceTimers.delete(key)
      }, delay)
      
      this.debounceTimers.set(key, timer)
    }
  }
  
  /**
   * 节流
   */
  static throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (this.throttleTimers.get(key)) {
        return
      }
      
      this.throttleTimers.set(key, true)
      func(...args)
      
      setTimeout(() => {
        this.throttleTimers.delete(key)
      }, delay)
    }
  }
}

// 默认导出所有工具
export default {
  CacheManager,
  ImageOptimizer,
  LazyLoader,
  PerformanceMonitor,
  Throttle
}