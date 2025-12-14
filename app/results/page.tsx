"use client"

import type React from "react"

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import {
    ArrowLeft,
    Shield,
    Code,
    Bot,
    XCircle,
    TrendingUp,
    Activity,
    AlertTriangle,
    AlertCircle,
    Zap,
    Info,
    Lightbulb,
    Sparkles,
    ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AnalysisData {
    success: boolean
    repository: string
    summary: {
        statistics: {
            totalFilesInRepo: number
            processedFiles: number
            skippedFiles: number
            totalSize: string
        }
        fileTypes: Record<string, number>
    }
    analysis: {
        overall: {
            score: number
            summary: string
            aiDetectionProbability: number
        }
        security: {
            vulnerabilities: Array<{
                severity: "low" | "medium" | "high" | "critical"
                file: string
                line?: number
                description: string
                recommendation: string
            }>
            score: number
        }
        codeQuality: {
            issues: Array<{
                type: "bug" | "code-smell" | "performance" | "best-practice"
                file: string
                description: string
                suggestion: string
            }>
            score: number
        }
        aiGenerated: {
            suspiciousFiles: Array<{
                file: string
                confidence: number
                reasons: string[]
            }>
            patterns: string[]
        }
        recommendations: string[]
    }
    metadata: {
        processedAt: string
        analyzedBy: string
        model: string
    }
}

export default function ResultsPage() {
    const [data, setData] = useState<AnalysisData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get results from sessionStorage
        const results = sessionStorage.getItem("analysisResults")
        if (results) {
            setData(JSON.parse(results))
        }
        setLoading(false)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading results...</p>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
                    <p className="text-muted-foreground mb-6">Please analyze a repository first</p>
                    <Link href="/">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500"
        if (score >= 60) return "text-amber-500"
        if (score >= 40) return "text-orange-500"
        return "text-rose-500"
    }

    const getScoreRingColor = (score: number) => {
        if (score >= 80) return "stroke-emerald-500"
        if (score >= 60) return "stroke-amber-500"
        if (score >= 40) return "stroke-orange-500"
        return "stroke-rose-500"
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-rose-500/10 text-rose-500 border-rose-500/20"
            case "high":
                return "bg-orange-500/10 text-orange-500 border-orange-500/20"
            case "medium":
                return "bg-amber-500/10 text-amber-500 border-amber-500/20"
            case "low":
                return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "critical":
                return <AlertTriangle className="w-5 h-5 text-rose-500" />
            case "high":
                return <AlertCircle className="w-5 h-5 text-orange-500" />
            case "medium":
                return <Zap className="w-5 h-5 text-amber-500" />
            case "low":
                return <Info className="w-5 h-5 text-blue-500" />
            default:
                return <Info className="w-5 h-5 text-muted-foreground" />
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border/40 bg-card/30 backdrop-blur-xl sticky top-0 z-10">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                        </Link>
                        <div className="text-center flex-1">
                            <div className="inline-flex items-center gap-2 mb-1">
                                <Activity className="w-4 h-4 text-primary" />
                                <h1 className="text-lg font-bold text-balance">{data.repository}</h1>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(data.metadata.processedAt).toLocaleString()}</p>
                        </div>
                        <div className="w-[72px]"></div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <CircularScoreCard
                        icon={<TrendingUp className="w-5 h-5" />}
                        title="Overall"
                        score={data.analysis.overall.score}
                        getScoreColor={getScoreColor}
                        getScoreRingColor={getScoreRingColor}
                    />
                    <CircularScoreCard
                        icon={<Shield className="w-5 h-5" />}
                        title="Security"
                        score={data.analysis.security.score}
                        getScoreColor={getScoreColor}
                        getScoreRingColor={getScoreRingColor}
                    />
                    <CircularScoreCard
                        icon={<Code className="w-5 h-5" />}
                        title="Quality"
                        score={data.analysis.codeQuality.score}
                        getScoreColor={getScoreColor}
                        getScoreRingColor={getScoreRingColor}
                    />
                    <CircularScoreCard
                        icon={<Bot className="w-5 h-5" />}
                        title="Human-Written"
                        score={100 - data.analysis.overall.aiDetectionProbability}
                        getScoreColor={getScoreColor}
                        getScoreRingColor={getScoreRingColor}
                        suffix="%"
                    />
                </div>

                <div className="mb-10 p-8 bg-gradient-to-br from-card/50 to-card/30 border border-border/50 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-primary rounded-full"></div>
                        <h2 className="text-xl font-bold">Analysis Summary</h2>
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed text-balance">{data.analysis.overall.summary}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatItem label="Total Files" value={data.summary.statistics.totalFilesInRepo.toString()} />
                        <StatItem label="Analyzed" value={data.summary.statistics.processedFiles.toString()} />
                        <StatItem label="Skipped" value={data.summary.statistics.skippedFiles.toString()} />
                        <StatItem label="Repository Size" value={data.summary.statistics.totalSize} />
                    </div>
                </div>

                {data.analysis.security.vulnerabilities.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-rose-500/10">
                                <Shield className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Security Vulnerabilities</h2>
                                <p className="text-sm text-muted-foreground">
                                    {data.analysis.security.vulnerabilities.length}{" "}
                                    {data.analysis.security.vulnerabilities.length === 1 ? "issue" : "issues"} found
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            {data.analysis.security.vulnerabilities.map((vuln, idx) => (
                                <div
                                    key={idx}
                                    className="group relative overflow-hidden p-5 border border-border/50 rounded-xl bg-card/40 backdrop-blur-sm hover:border-border transition-all duration-200"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5 flex-shrink-0">{getSeverityIcon(vuln.severity)}</div>
                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getSeverityColor(
                                                        vuln.severity,
                                                    )}`}
                                                >
                                                    {vuln.severity.toUpperCase()}
                                                </span>
                                                <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">{vuln.file}</code>
                                            </div>
                                            <p className="text-sm font-medium text-foreground leading-relaxed">{vuln.description}</p>
                                            <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                                                <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-muted-foreground leading-relaxed">{vuln.recommendation}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.analysis.codeQuality.issues.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Code className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Code Quality Issues</h2>
                                <p className="text-sm text-muted-foreground">
                                    {data.analysis.codeQuality.issues.length}{" "}
                                    {data.analysis.codeQuality.issues.length === 1 ? "suggestion" : "suggestions"}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            {data.analysis.codeQuality.issues.map((issue, idx) => (
                                <div
                                    key={idx}
                                    className="group p-5 border border-border/50 rounded-xl bg-card/40 backdrop-blur-sm hover:border-border transition-all duration-200"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted/50 text-foreground border border-border/30">
                                                {issue.type.toUpperCase()}
                                            </span>
                                            <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">{issue.file}</code>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed">{issue.description}</p>
                                        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-muted-foreground leading-relaxed">{issue.suggestion}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.analysis.aiGenerated.suspiciousFiles.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Bot className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">AI-Generated Code Detection</h2>
                                <p className="text-sm text-muted-foreground">
                                    {data.analysis.aiGenerated.suspiciousFiles.length} potentially AI-generated{" "}
                                    {data.analysis.aiGenerated.suspiciousFiles.length === 1 ? "file" : "files"}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            {data.analysis.aiGenerated.suspiciousFiles.map((file, idx) => (
                                <div key={idx} className="p-5 border border-border/50 rounded-xl bg-card/40 backdrop-blur-sm">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <code className="text-sm font-medium bg-muted/50 px-2.5 py-1.5 rounded">{file.file}</code>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                                                    <div className="text-lg font-bold text-orange-500">{file.confidence}%</div>
                                                </div>
                                                <div className="relative w-16 h-16">
                                                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="16"
                                                            fill="none"
                                                            className="stroke-orange-500"
                                                            strokeWidth="3"
                                                            strokeDasharray={`${file.confidence} 100`}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {file.reasons.map((reason, ridx) => (
                                                <div key={ridx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                    <span className="leading-relaxed">{reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.analysis.recommendations.length > 0 && (
                    <div className="p-8 bg-gradient-to-br from-primary/5 to-primary/0 border border-primary/10 rounded-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1 h-6 bg-primary rounded-full"></div>
                            <h2 className="text-xl font-bold">Recommendations</h2>
                        </div>
                        <div className="space-y-3">
                            {data.analysis.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-start gap-3 group">
                                    <Lightbulb className="w-4 h-4 text-primary mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="text-muted-foreground leading-relaxed">{rec}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function CircularScoreCard({
    icon,
    title,
    score,
    getScoreColor,
    getScoreRingColor,
    suffix = "",
}: {
    icon: React.ReactNode
    title: string
    score: number
    getScoreColor: (score: number) => string
    getScoreRingColor: (score: number) => string
    suffix?: string
}) {
    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
        <div className="relative p-6 bg-card/40 border border-border/50 rounded-2xl hover:border-border transition-all duration-300 group backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <div className="mb-3 text-muted-foreground group-hover:text-foreground transition-colors">{icon}</div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-4">{title}</h3>

                <div className="relative w-28 h-28 mb-3">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" className="stroke-muted" strokeWidth="8" />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            className={getScoreRingColor(score)}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{
                                transition: "stroke-dashoffset 1s ease-in-out",
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                            {Math.round(score)}
                            {suffix && <span className="text-lg">{suffix}</span>}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="text-center">
            <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
    )
}
