"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Shield, Bug, Zap, Users, Award } from "lucide-react"

const features = [
  {
    icon: Bot,
    title: "AI Code Detection",
    description: "Identify AI-generated code patterns with our proprietary detection algorithms.",
    stat: "97%",
    statLabel: "Accuracy",
  },
  {
    icon: Shield,
    title: "Security Scan",
    description: "Detect vulnerabilities, exposed secrets, and security anti-patterns instantly.",
    stat: "500+",
    statLabel: "Vulnerability types",
  },
  {
    icon: Bug,
    title: "Bug Analysis",
    description: "Find potential bugs, code smells, and maintainability issues before they ship.",
    stat: "10x",
    statLabel: "Faster review",
  },
  {
    icon: Zap,
    title: "Performance Insights",
    description: "Get actionable optimization suggestions for better runtime performance.",
    stat: "40%",
    statLabel: "Avg. improvement",
  },
  {
    icon: Users,
    title: "Contributor Analysis",
    description: "Understand contribution patterns, code ownership, and team dynamics.",
    stat: "Real-time",
    statLabel: "Insights",
  },
  {
    icon: Award,
    title: "Hire Readiness Score",
    description: "Get a comprehensive score to evaluate candidates or project quality.",
    stat: "A-F",
    statLabel: "Grade system",
  },
]

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className={`text-3xl md:text-4xl font-bold mb-4 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Everything you need to analyze code
          </h2>
          <p
            className={`text-muted-foreground max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Comprehensive analysis powered by advanced AI models trained on millions of repositories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_oklch(0.723_0.219_149.579_/_0.1)] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{feature.stat}</div>
                  <div className="text-xs text-muted-foreground">{feature.statLabel}</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
