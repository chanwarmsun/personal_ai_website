'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Phone, Megaphone, Download, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import contentData from '../data/content.json'

export default function PersonalInfo() {
  const { personalInfo } = contentData
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)

  const socialLinks = [
    { icon: MessageCircle, url: personalInfo.links.wechat, label: '微信', qrCode: personalInfo.links.wechat },
    { icon: Phone, url: personalInfo.links.qq, label: 'QQ', qrCode: personalInfo.links.qq },
    { icon: Megaphone, url: personalInfo.links.gongzhonghao, label: '公众号', qrCode: personalInfo.links.gongzhonghao },
  ]

  return (
    <section id="home" className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 主要信息卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-8 bento-card"
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600 p-1">
                  <div className="w-full h-full rounded-3xl overflow-hidden">
                    <Image
                      src={personalInfo.avatar}
                      alt={personalInfo.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </motion.div>
              </motion.div>

              <div className="flex-1">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-3xl md:text-4xl font-bold text-gray-900 mb-2"
                >
                  {personalInfo.name}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-lg md:text-xl gradient-text font-semibold mb-3"
                >
                  {personalInfo.title}
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-gray-600 mb-4 leading-relaxed"
                >
                  {personalInfo.slogan}
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-gray-600 mb-6 leading-relaxed"
                >
                  {personalInfo.bio}
                </motion.p>

                {/* 操作按钮 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-wrap gap-3"
                >
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={personalInfo.links.resume}
                    className="btn-bounce inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl"
                  >
                    <Download size={20} className="mr-2" />
                    下载简历
                  </motion.a>
                  
                  {socialLinks.map((link, index) => (
                    <motion.div
                      key={link.label}
                      className="relative"
                      onMouseEnter={() => setHoveredIcon(link.label)}
                      onMouseLeave={() => setHoveredIcon(null)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-bounce inline-flex items-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl"
                      >
                        <link.icon size={20} className="mr-2" />
                        {link.label}
                      </motion.button>
                      
                      {/* 丝滑Q弹二维码气泡 */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ 
                          opacity: hoveredIcon === link.label ? 1 : 0,
                          scale: hoveredIcon === link.label ? 1 : 0.3,
                        }}
                        transition={{ 
                          duration: 0.5,
                          ease: [0.68, -0.55, 0.265, 1.55]
                        }}
                        className={`qr-tooltip ${hoveredIcon === link.label ? 'show' : ''}`}
                        style={{ pointerEvents: hoveredIcon === link.label ? 'auto' : 'none' }}
                      >
                        <div className="qr-card">
                          <div className="qr-shimmer"></div>
                          <div className="w-36 h-36 bg-white rounded-2xl flex items-center justify-center mb-3 border-2 border-gray-100 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-violet-50"></div>
                            <div className="relative z-10 text-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                <link.icon size={16} className="text-white" />
                              </div>
                              <div className="text-xs text-gray-700 font-medium">
                                {link.label}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                二维码
                              </div>
                            </div>
                          </div>
                          <motion.p 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ 
                              opacity: hoveredIcon === link.label ? 1 : 0,
                              y: hoveredIcon === link.label ? 0 : 5
                            }}
                            transition={{ delay: 0.2 }}
                            className="text-sm text-gray-700 text-center font-medium"
                          >
                            扫码添加{link.label}
                          </motion.p>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* 技能展示卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-4 bento-card"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">核心技能</h3>
            <div className="space-y-4">
              {personalInfo.skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{skill.name}</span>
                    <span className="text-sm text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ duration: 1.2, delay: 0.6 + index * 0.1, ease: "easeOut" }}
                      className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-sm"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 