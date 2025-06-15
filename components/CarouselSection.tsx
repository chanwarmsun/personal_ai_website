'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { defaultContentProvider } from '../lib/default-content-provider'
import { carouselOperations } from '../lib/carousel-operations'

export default function CarouselSection() {
  const [defaultCarousel, setDefaultCarousel] = useState<any[]>([])
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [customCarousel, setCustomCarousel] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [currentTranslate, setCurrentTranslate] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  
  // 处理客户端挂载
  useEffect(() => {
    setMounted(true)
    loadDefaultCarousel()
    loadCustomCarousel()
  }, [])

  // 从数据库加载默认轮播
  const loadDefaultCarousel = async () => {
    try {
      const carousel = await defaultContentProvider.getCarousel()
      setDefaultCarousel(carousel)
    } catch (error) {
      console.error('加载默认轮播失败:', error)
      setDefaultCarousel([])
    }
  }

  // 从数据库和localStorage加载自定义轮播图片
  const loadCustomCarousel = async () => {
    if (typeof window !== 'undefined') {
      try {
        // 首先尝试从数据库加载
        const dbCarousel = await carouselOperations.getAll()
        if (dbCarousel && dbCarousel.length > 0) {
          setCustomCarousel(dbCarousel)
          return
        }
      } catch (error) {
        console.log('从数据库加载轮播失败，尝试从localStorage加载')
      }
      
      // 回退到localStorage
      const localCarousel = JSON.parse(localStorage.getItem('custom_carousel') || '[]')
      setCustomCarousel(localCarousel)
    }
  }
  
  // 合并默认轮播和自定义轮播，复制多遍实现无限滚动
  const originalCarousel = mounted ? [...defaultCarousel, ...customCarousel] : defaultCarousel
  const carousel = [...originalCarousel, ...originalCarousel, ...originalCarousel] // 复制三遍用于无限滚动
  
  // 平缓自动滚动
  useEffect(() => {
    if (!isAutoPlaying || carousel.length === 0) {
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
  }, [isAutoPlaying, carousel.length, originalCarousel.length])

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

  if (carousel.length === 0) return null

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
              {carousel.map((item, index) => (
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