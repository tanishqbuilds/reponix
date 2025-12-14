"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Github, ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  const [repoUrl, setRepoUrl] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze repository")
      }

      // Store results in sessionStorage
      sessionStorage.setItem("analysisResults", JSON.stringify(data))

      // Navigate to results page
      window.location.href = "/results"

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(oklch(0.723_0.219_149.579_/_0.03)_1px,transparent_1px),linear-gradient(90deg,oklch(0.723_0.219_149.579_/_0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-border bg-secondary/50 backdrop-blur-sm reveal">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">AI-Powered Code Analysis</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance reveal reveal-delay-1">
          <span className="text-foreground">Code Never Lies</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 text-pretty reveal reveal-delay-2">
          Analyze any GitHub repository instantly. Uncover AI-generated code, security risks, and get hire-ready
          insights in seconds.
        </p>

        {/* Input and CTA */}
        <div className="max-w-2xl mx-auto reveal reveal-delay-3">
          <div
            className={`flex flex-col sm:flex-row gap-3 p-2 rounded-xl bg-card border transition-all duration-300 ${isFocused
              ? "border-primary/50 shadow-[0_0_30px_oklch(0.723_0.219_149.579_/_0.15)]"
              : "border-border glow-input"
              }`}
          >
            <div className="flex-1 flex items-center gap-3 px-4">
              <Github className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <Input
                type="url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground h-12 text-base"
              />
            </div>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isLoading || !repoUrl.trim()}
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-button font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive mt-4">
              {error}
            </p>
          )}

          <p className="text-sm text-muted-foreground mt-4">
            Free analysis for public repositories. No sign-up required.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 reveal reveal-delay-4">
          <p className="text-sm text-muted-foreground mb-6">Who can use Reponix</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            {["Recruiters", "Startup Founders", "Professors", "Students"].map((company) => (
              <span
                key={company}
                className="text-lg text-foreground/60 hover:text-foreground/80 transition-colors"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
