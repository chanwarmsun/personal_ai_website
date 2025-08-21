import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '陈老师AI进化论 - AI教育与数字化转型专家',
  description: '陈老师AI进化论：专注于AI教育培训、RPA机器人流程自动化、智能体定制开发。为职业教育赋能，引领教育数字化转型新时代。',
  keywords: 'AI教育,人工智能培训,RPA自动化,智能体开发,教育数字化,职业培训',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
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