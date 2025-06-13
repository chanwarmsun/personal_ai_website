import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '陈老师AI进化论 - AI教育实践者',
  description: 'AI教育实践者，专注AI智能体开发和教学资源分享，助力教育工作者拥抱AI时代',
  keywords: 'AI教育,智能体,提示词,教学资源,AI进化论',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
} 