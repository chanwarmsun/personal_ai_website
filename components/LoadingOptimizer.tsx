'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 加载状态上下文
interface LoadingContextType {
  isLoading: boolean
  loadingMessage: string
  setLoading: (loading: boolean, message?: string) => void
  incrementLoading: (message?: string) => void
  decrementLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

// 自定义Hook用于使用加载状态
export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading必须在LoadingProvider内使用')
  }
  return context
}

// 加载状态提供者组件
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('正在加载...')
  const [loadingCount, setLoadingCount] = useState(0)

  const setLoading = (loading: boolean, message: string = '正在加载...') => {
    setIsLoading(loading)
    setLoadingMessage(message)
    setLoadingCount(loading ? 1 : 0)
  }

  const incrementLoading = (message: string = '正在加载...') => {
    setLoadingCount(prev => {
      const newCount = prev + 1
      setIsLoading(newCount > 0)
      setLoadingMessage(message)
      return newCount
    })
  }

  const decrementLoading = () => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1)
      setIsLoading(newCount > 0)
      return newCount
    })
  }

  return (
    <LoadingContext.Provider value={{
      isLoading,
      loadingMessage,
      setLoading,
      incrementLoading,
      decrementLoading
    }}>
      {children}
      <GlobalLoadingOverlay />
    </LoadingContext.Provider>
  )
}

// 全局加载遮罩组件
function GlobalLoadingOverlay() {
  const { isLoading, loadingMessage } = useLoading()
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (isLoading) {
      // 延迟显示加载状态，避免闪烁
      timer = setTimeout(() => {
        setShowLoading(true)
      }, 300) // 300ms后才显示加载
    } else {
      setShowLoading(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isLoading])

  return (
    <AnimatePresence>
      {showLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4"
          >
            <div className="flex flex-col items-center space-y-4">
              {/* 加载动画 */}
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              
              {/* 加载文字 */}
              <div className="text-center">
                <p className="text-gray-800 font-medium text-lg">
                  {loadingMessage}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  请稍候，正在为您优化体验...
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 智能加载Hook - 自动管理加载状态
export const useSmartLoading = () => {
  const { incrementLoading, decrementLoading } = useLoading()
  
  const withLoading = async <T,>(
    operation: () => Promise<T>,
    message: string = '正在加载数据...'
  ): Promise<T> => {
    incrementLoading(message)
    try {
      const result = await operation()
      return result
    } finally {
      decrementLoading()
    }
  }

  return { withLoading }
}

// 页面加载优化Hook
export const usePageOptimization = () => {
  const [isPageReady, setIsPageReady] = useState(false)
  const { setLoading } = useLoading()

  useEffect(() => {
    // 页面加载优化
    const handlePageLoad = () => {
      setIsPageReady(true)
      setLoading(false)
    }

    // 检查页面是否已加载
    if (document.readyState === 'complete') {
      handlePageLoad()
    } else {
      window.addEventListener('load', handlePageLoad)
      return () => window.removeEventListener('load', handlePageLoad)
    }
  }, [setLoading])

  return { isPageReady }
}

// 数据预加载Hook
export const useDataPreloader = () => {
  const { setLoading } = useLoading()
  const [preloadComplete, setPreloadComplete] = useState(false)

  const preloadData = async (operations: Array<() => Promise<any>>) => {
    setLoading(true, '正在预加载数据...')
    
    try {
      // 并行执行所有预加载操作
      await Promise.allSettled(operations.map(op => op()))
      setPreloadComplete(true)
    } catch (error) {
      console.error('数据预加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return { preloadData, preloadComplete }
} 