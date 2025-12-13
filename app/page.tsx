import { HeroSection } from "@/components/ui/hero-section"
import { FeaturesSection } from "@/components/ui/features-section"
import { AudienceSection } from "@/components/ui/audience-section"
import { HowItWorksSection } from "@/components/ui/how-it-works-section"
import { Footer } from "@/components/ui/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background animated-gradient">
      <HeroSection />
      <FeaturesSection />
      <AudienceSection />
      <HowItWorksSection />
      <Footer />
    </main>
  )
}
