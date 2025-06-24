'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { dataService } from '../lib/optimized-data-service'

export default function CarouselSection() {
  const [carousel, setCarousel] = useState<any[]>([])
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTranslate, setCurrentTranslate] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  
  // 处理客户端挂载
  useEffect(() => {
    setMounted(true)
    loadCarouselFromAdmin()
  }, [])

  // 快速检查缓存，减少加载时间
  useEffect(() => {
    if (mounted) {
      // 先尝试从缓存获取数据，如果有就立即显示
      const tryGetCachedData = async () => {
        try {
          // 先检查是否有缓存的数据
          const cachedData = localStorage.getItem('carousel-cache')
          if (cachedData) {
            const parsed = JSON.parse(cachedData)
            if (parsed.data && parsed.expiry > Date.now()) {
              setCarousel(parsed.data)
              setIsLoading(false)
              console.log('✅ 从本地缓存快速加载轮播数据')
              return
            }
          }
        } catch (error) {
          console.log('本地缓存检查失败，继续常规加载')
        }
      }
      tryGetCachedData()
    }
  }, [mounted])

  // 使用优化的数据服务加载轮播数据
  const loadCarouselFromAdmin = async () => {
    if (typeof window !== 'undefined') {
      try {
        console.log('🔄 从缓存或数据库加载轮播数据...')
        // 使用优化的数据服务，自动处理缓存
        const carouselData = await dataService.getCarousel()
        setCarousel(carouselData)
        setIsLoading(false)
        
        // 缓存到本地存储，设置30分钟有效期
        try {
          const cacheData = {
            data: carouselData,
            expiry: Date.now() + 30 * 60 * 1000 // 30分钟缓存
          }
          localStorage.setItem('carousel-cache', JSON.stringify(cacheData))
        } catch (error) {
          console.log('缓存写入失败:', error)
        }
        
        console.log('✅ 轮播数据加载完成，数量:', carouselData.length)
      } catch (error) {
        console.error('❌ 轮播数据加载失败:', error)
        setCarousel([])
        setIsLoading(false)
      }
    }
  }
  
  // 复制轮播内容用于无限滚动（只复制管理后台的内容）
  const originalCarousel = mounted ? carousel : []
  const displayCarousel = originalCarousel.length > 0 ? 
    [...originalCarousel, ...originalCarousel, ...originalCarousel] : [] // 复制三遍用于无限滚动
  
  // 平缓自动滚动
  useEffect(() => {
    if (!isAutoPlaying || displayCarousel.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }
    
    const animate = () => {
      setCurrentTranslate(prev => {
        const itemWidth = 320 // 每个卡片的宽度
        const scrollSpeed = 0.5 // 滚动速度（像素/帧）
        const newTranslate = prev - scrollSpeed
        
        // 如果滚动到第二组的末尾，重置到第一组的开始
        const resetPoint = -(itemWidth * originalCarousel.length)
        if (newTranslate <= resetPoint) {
          return 0
        }
        
        return newTranslate
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isAutoPlaying, displayCarousel.length, originalCarousel.length])

  const scrollLeft = () => {
    setCurrentTranslate(prev => {
      const itemWidth = 320
      const newTranslate = prev + itemWidth
      
      if (newTranslate > 0) {
        return -(itemWidth * originalCarousel.length - itemWidth)
      }
      
      return newTranslate
    })
  }

  const scrollRight = () => {
    setCurrentTranslate(prev => {
      const itemWidth = 320
      const newTranslate = prev - itemWidth
      
      if (Math.abs(newTranslate) >= itemWidth * originalCarousel.length) {
        return 0
      }
      
      return newTranslate
    })
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  // 加载状态显示
  if (isLoading && mounted) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              精彩瞬间
            </h2>
            <div className="bg-white rounded-2xl p-12 shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
              <p className="text-lg text-gray-600">
                正在加载精彩内容...
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  // 如果管理后台没有轮播内容，显示提示信息
  if (originalCarousel.length === 0 && !isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              精彩瞬间
            </h2>
            <div className="bg-white rounded-2xl p-12 shadow-lg">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg text-gray-600">
                暂无轮播内容，请在管理后台添加轮播图片
              </p>
              <p className="text-sm text-gray-500 mt-2">
                管理员可以通过后台管理页面添加精彩的轮播图片
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            精彩瞬间
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            记录AI教育路上的每一个重要时刻
          </p>
        </motion.div>

        <div className="relative group">
          {/* 左右控制按钮 */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm text-gray-700 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm text-gray-700 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={24} />
          </button>

          {/* 自动播放控制 */}
          <button
            onClick={toggleAutoPlay}
            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            {isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* 滚动容器 */}
          <div className="overflow-hidden rounded-2xl">
            <div
              ref={scrollContainerRef}
              className="flex transition-none"
              style={{ transform: `translateX(${currentTranslate}px)` }}
            >
              {displayCarousel.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`}
                  className="flex-none w-80 mx-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative overflow-hidden rounded-xl shadow-lg bg-white">
                    {/* 图片区域 */}
                    <div className="relative h-48">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      {/* 渐变遮罩 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    
                    {/* 内容区域 */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    {/* 悬停效果 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 