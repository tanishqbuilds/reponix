"use client"

import { useEffect, useRef, useState } from "react"
import { Briefcase, Rocket, Code2, GraduationCap } from "lucide-react"

const audiences = [
  {
    icon: Briefcase,
    title: "Recruiters",
    description: "Validate candidate portfolios and assess real coding abilities before interviews.",
  },
  {
    icon: Rocket,
    title: "Founders",
    description: "Evaluate technical co-founders, contractors, or audit codebases before acquisition.",
  },
  {
    icon: Code2,
    title: "Freelancers",
    description: "Showcase verified code quality to win more clients and premium projects.",
  },
  {
    icon: GraduationCap,
    title: "Students",
    description: "Get actionable feedback to improve your code and build a stronger portfolio.",
  },
]

export function AudienceSection() {
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
    <section ref={sectionRef} className="py-24 px-4 bg-secondary/30 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className={`text-3xl md:text-4xl font-bold mb-4 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Built for everyone who cares about code
          </h2>
          <p
            className={`text-muted-foreground max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Whether you're hiring, building, or learning — Devlyzer gives you the insights you need.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((audience, index) => (
            <div
              key={audience.title}
              className={`group text-center p-8 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_oklch(0.723_0.219_149.579_/_0.1)] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <audience.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{audience.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{audience.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
