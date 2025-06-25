'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Phone, Megaphone, Download, ExternalLink, Bookmark, Users } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { defaultContentProvider } from '../lib/default-content-provider'

interface Skill {
  name: string;
  level: number;
}

interface PersonalInfoType {
  name: string;
  title: string;
  slogan: string;
  bio: string;
  avatar: string;
  skills: Skill[];
  links: {
    gongzhonghao: string;
    wechat: string;
    qq: string;
  };
}

export default function PersonalInfo() {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoType | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  
  // 为每个社交链接按钮创建ref
  const btnRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  useEffect(() => {
    loadPersonalInfo()
  }, [])

  const loadPersonalInfo = async () => {
    try {
      const info = await defaultContentProvider.getPersonalInfo()
      setPersonalInfo(info)
    } catch (error) {
      console.error('加载个人信息失败:', error)
    }
  }

  if (!personalInfo) {
    return <div className="pt-20 pb-16 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  }

  const socialLinks = [
    { icon: Megaphone, url: personalInfo.links.gongzhonghao, label: '公众号', qrCode: '/qr-gongzhonghao.png' },
    { icon: MessageCircle, url: personalInfo.links.wechat, label: '微信', qrCode: '/qr-wechat.png' },
    { icon: Users, url: personalInfo.links.qq, label: 'QQ', qrCode: '/qr-qq.png' },
    { icon: Bookmark, url: '#', label: '小红书', qrCode: '/qr-xiaohongshu.png' },
    { icon: ExternalLink, url: '#', label: '视频号', qrCode: '/qr-videohaо.png' },
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

                {/* 社交链接按钮 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-wrap gap-3"
                >
                  {socialLinks.map((link, index) => {
                    const isActive = hoveredIcon === link.label
                    const currentBtn = btnRefs.current[link.label]
                    return (
                    <motion.div
                      key={link.label}
                        className="relative inline-block"
                      onMouseEnter={() => setHoveredIcon(link.label)}
                      onMouseLeave={() => setHoveredIcon(null)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                      <motion.button
                          ref={(el) => { btnRefs.current[link.label] = el }}
                          animate={{ scale: isActive ? 1.12 : 1 }}
                          transition={{ duration: 0.08, type: 'spring', stiffness: 600, damping: 20 }}
                          className={`btn-bounce inline-flex items-center justify-center w-24 h-12 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform-gpu border-2 text-sm ${isActive ? 'border-transparent ring-2 ring-indigo-400 ring-offset-2' : 'border-transparent'}`}
                          style={{ position: 'relative', zIndex: 10 }}
                      >
                        <motion.div
                            animate={{ rotate: isActive ? [0, -3, 3, 0] : 0 }}
                            transition={{ duration: 0.08, ease: 'easeInOut' }}
                            className="mr-1.5"
                        >
                            <link.icon size={14} />
                        </motion.div>
                        <span className="whitespace-nowrap">{link.label}</span>
                      </motion.button>
                        {/* 二维码绝对定位到按钮右上角 */}
                        {isActive && currentBtn && (
                      <motion.div
                            initial={{ opacity: 0, scale: 0.1, x: 0, y: 0 }}
                            animate={{ opacity: 1, scale: 1, x: currentBtn.offsetWidth + 8, y: -16 }}
                            exit={{ opacity: 0, scale: 0.1, x: currentBtn.offsetWidth + 8, y: 0 }}
                            transition={{ duration: 0.08, type: 'spring', stiffness: 600, damping: 20 }}
                            className="absolute z-30"
                            style={{ top: 0, left: 0, pointerEvents: 'auto' }}
                      >
                            <Image
                              src={link.qrCode}
                              alt={`${link.label}二维码`}
                              width={180}
                              height={180}
                              className="rounded-lg shadow-lg"
                            />
                        </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
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