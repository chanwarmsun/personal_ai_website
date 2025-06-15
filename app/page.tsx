'use client'

import Header from '../components/Header'
import PersonalInfo from '../components/PersonalInfo'
import CarouselSection from '../components/CarouselSection'
import AgentsSection from '../components/AgentsSection'
import PromptsSection from '../components/PromptsSection'
import ResourcesSection from '../components/ResourcesSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <PersonalInfo />
      <CarouselSection />
      <AgentsSection />
      <PromptsSection />
      <ResourcesSection />
      <Footer />
    </main>
  )
} 