"use client"

import { useEffect, useRef, useState } from "react"
import { Link2, Cpu, FileCheck } from "lucide-react"

const steps = [
  {
    icon: Link2,
    step: "01",
    title: "Paste your repo URL",
    description: "Simply paste any public GitHub repository URL into the analyzer.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI analyzes the code",
    description: "Our AI scans every file, commit, and contributor pattern in seconds.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Get your report",
    description: "Receive a comprehensive analysis with scores, insights, and recommendations.",
  },
]

export function HowItWorksSection() {
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
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className={`text-3xl md:text-4xl font-bold mb-4 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            How it works
          </h2>
          <p
            className={`text-muted-foreground max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Get comprehensive code analysis in three simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className={`relative text-center transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Step number badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border-2 border-primary/30 mb-6 relative z-10">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>

                <div className="text-sm font-mono text-primary mb-2">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
