"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Github, 
  ArrowRight, 
  Sparkles, 
  LogOut, 
  Search, 
  Lock, 
  Unlock, 
  FolderGit, 
  UserCheck 
} from "lucide-react"

interface GitHubUser {
  username: string
  name: string
  avatarUrl: string
  profileUrl: string
}

interface Repository {
  id: number
  name: string
  fullName: string
  description: string
  htmlUrl: string
  isPrivate: boolean
  stars: number
  language: string
  updatedAt: string
}

export function HeroSection() {
  const [repoUrl, setRepoUrl] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Authentication & Repository States
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [repos, setRepos] = useState<Repository[]>([])
  const [repoSearch, setRepoSearch] = useState("")
  const [isReposLoading, setIsReposLoading] = useState(false)

  useEffect(() => {
    const checkAuthAndLoadRepos = async () => {
      try {
        const authRes = await fetch("/api/auth/me")
        const authData = await authRes.json()
        
        if (authData.authenticated) {
          setIsAuthenticated(true)
          setUser(authData.user)
          
          // Fetch repositories
          setIsReposLoading(true)
          const reposRes = await fetch("/api/github/repos")
          const reposData = await reposRes.json()
          
          if (reposData.success) {
            setRepos(reposData.repos)
          }
        }
      } catch (err) {
        console.error("Failed to initialize user session:", err)
      } finally {
        setIsReposLoading(false)
      }
    }

    checkAuthAndLoadRepos()
  }, [])

  const handleSubmit = async (targetUrl?: string) => {
    const urlToAnalyze = targetUrl || repoUrl
    if (!urlToAnalyze.trim()) {
      setError("Please enter or select a repository URL")
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
        body: JSON.stringify({ repoUrl: urlToAnalyze }),
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

  // Filter repositories based on search input
  const filteredRepos = repos.filter(
    (repo) =>
      repo.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
      repo.language.toLowerCase().includes(repoSearch.toLowerCase()) ||
      repo.description.toLowerCase().includes(repoSearch.toLowerCase())
  )

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(oklch(0.723_0.219_149.579_/_0.03)_1px,transparent_1px),linear-gradient(90deg,oklch(0.723_0.219_149.579_/_0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      {/* Auth top bar header */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 bg-card/85 backdrop-blur-md border border-border px-4 py-1.5 rounded-full shadow-lg transition-all hover:bg-card">
            <img 
              src={user.avatarUrl} 
              alt={user.username} 
              className="w-7 h-7 rounded-full border border-primary/20" 
            />
            <div className="text-left hidden sm:block leading-tight">
              <p className="text-[10px] text-muted-foreground">Connected as</p>
              <p className="text-xs font-semibold text-foreground">{user.name}</p>
            </div>
            <div className="h-6 w-px bg-border/80 hidden sm:block mx-1" />
            <a 
              href="/api/auth/logout" 
              className="text-muted-foreground hover:text-destructive transition-colors p-1" 
              title="Disconnect Account"
            >
              <LogOut className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/auth/github'} 
            className="flex items-center gap-2 rounded-full border-border bg-card/50 backdrop-blur-sm text-foreground hover:bg-secondary/80 transition-all hover:scale-105"
          >
            <Github className="w-4 h-4" />
            Connect GitHub
          </Button>
        )}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
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
          Analyze any GitHub repository instantly. Uncover AI-generated code, security risks, and get hire-ready insights in seconds.
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
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground h-12 text-base w-full"
              />
            </div>
            <Button
              size="lg"
              onClick={() => handleSubmit()}
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
            {isAuthenticated 
              ? "Connected to GitHub. You can now analyze public and private repositories." 
              : "Free analysis for public repositories. Connect GitHub to analyze private repos."}
          </p>
        </div>

        {/* Repositories Explorer Selection Section */}
        {isAuthenticated && (
          <div className="mt-12 bg-card/65 backdrop-blur-md border border-border p-6 rounded-2xl shadow-xl w-full max-w-2xl mx-auto text-left reveal reveal-delay-3">
            <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">Select from your Repositories</h3>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium">
                {repos.length} repos loaded
              </span>
            </div>

            {/* Repository Search input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search repositories by name or language..."
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                className="pl-9 h-10 bg-secondary/30 border-border/80 focus-visible:ring-primary/20 text-sm rounded-xl placeholder:text-muted-foreground w-full"
              />
            </div>

            {/* Repository List Box */}
            {isReposLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Fetching your GitHub repositories...</p>
              </div>
            ) : filteredRepos.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      setRepoUrl(repo.htmlUrl)
                      handleSubmit(repo.htmlUrl)
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/15 hover:bg-secondary/40 hover:border-primary/30 transition-all text-left group w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden mr-4">
                      {repo.isPrivate ? (
                        <Lock className="w-4 h-4 text-amber-500/80 flex-shrink-0" />
                      ) : (
                        <Unlock className="w-4 h-4 text-emerald-500/80 flex-shrink-0" />
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {repo.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate -mt-0.5 max-w-md">
                          {repo.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {repo.language && (
                        <span className="text-[10px] bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-full border border-border/60">
                          {repo.language}
                        </span>
                      )}
                      {repo.isPrivate ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                          Private
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                          Public
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No matching repositories found.
              </div>
            )}
          </div>
        )}

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
