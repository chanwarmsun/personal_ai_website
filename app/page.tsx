'use client'

import { useEffect } from 'react'
import Header from '../components/Header'
import PersonalInfo from '../components/PersonalInfo'
import CarouselSection from '../components/CarouselSection'
import AgentsSection from '../components/AgentsSection'
import PromptsSection from '../components/PromptsSection'
import ResourcesSection from '../components/ResourcesSection'
import SkillsSection from '../components/SkillsSection'
import Footer from '../components/Footer'
import { analytics } from '../lib/analytics'

export default function Home() {
  useEffect(() => {
    // 记录首页访问
    analytics.trackPageView('/', '陈老师AI进化论 - 首页')
  }, [])

  return (
    <main className="min-h-screen">
      <Header />
      <PersonalInfo />
      <CarouselSection />
      <AgentsSection />
      <PromptsSection />
      <ResourcesSection />
      <SkillsSection />
      <Footer />
    </main>
  )
} 