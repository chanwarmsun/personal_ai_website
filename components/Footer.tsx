'use client'

import { motion } from 'framer-motion'
import { Heart, Mail, MessageCircle, Phone, Megaphone } from 'lucide-react'
import contentData from '../data/content.json'

export default function Footer() {
  const { personalInfo } = contentData
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { icon: MessageCircle, url: personalInfo.links.wechat, label: '微信' },
    { icon: Megaphone, url: personalInfo.links.gongzhonghao, label: '公众号' },
  ]

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="md:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">陈</span>
              </div>
              <span className="text-xl font-bold">陈老师AI进化论</span>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
              {personalInfo.title}
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              致力于AI技术的普及和应用，帮助更多人在AI时代找到自己的位置。
            </p>
          </motion.div>

          {/* 快速链接 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">快速导航</h3>
            <div className="space-y-2">
              {[
                { name: '智能体', href: '#agents' },
                { name: '提示词', href: '#prompts' },
                { name: 'AI教学资源', href: '#resources' },
                { name: '关于我', href: '#home' }
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-gray-300 hover:text-white transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>

          {/* 联系方式 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">联系我</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-300 text-sm">hello@peanut.ai</span>
              </div>
              <div className="flex space-x-3">
                {socialLinks.map((link) => (
                  <motion.a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <link.icon size={16} className="text-gray-300" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 底部分割线和版权 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="border-t border-gray-700 mt-8 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-2 md:mb-0">
              © {currentYear} 陈老师AI进化论. 保留所有权利.
            </p>
            <div className="flex items-center text-gray-400 text-sm">
              <span>用</span>
              <Heart size={16} className="mx-1 text-red-400" />
              <span>构建</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
} 