'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { useEffect } from 'react'
import { initializeDataService } from '../lib/optimized-data-service'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '陈老师AI进化论 - AI教育实践者',
  description: 'AI教育实践者，专注AI智能体开发和教学资源分享，助力教育工作者拥抱AI时代',
  keywords: 'AI教育,智能体,提示词,教学资源,AI进化论',
}

// 应用内容组件 - 在LoadingProvider内部使用
function AppContent({ children }: { children: React.ReactNode }) {
  const { preloadData } = useDataPreloader()

  // 在应用启动时初始化数据服务
  useEffect(() => {
    const initApp = async () => {
      console.log('🚀 应用启动，开始初始化数据服务...')
      
      // 使用预加载器统一管理加载状态
      await preloadData([initializeDataService])
      
      console.log('✅ 数据服务初始化完成')
    }

    initApp()
  }, [preloadData])

  return <>{children}</>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
})

  return (
    <html lang="zh-CN">
      <head>
        <title>陈老师AI进化论 - AI教育与数字化转型专家</title>
        <meta name="description" content="陈老师AI进化论：专注于AI教育培训、RPA机器人流程自动化、智能体定制开发。为职业教育赋能，引领教育数字化转型新时代。" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="AI教育,人工智能培训,RPA自动化,智能体开发,教育数字化,职业培训" />
        
        {/* 性能优化 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://mvrikhctrwowswcamkfj.supabase.co" />
        
        {/* 缓存策略 */}
        <meta httpEquiv="Cache-Control" content="public, max-age=31536000, immutable" />
        
        {/* Progressive Web App */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* 预加载关键资源 */}
        <link rel="preload" href="/images/my-avatar.jpg" as="image" />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
} 