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
    Download,
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
            <div className="border-b border-border/40 bg-card/30 backdrop-blur-xl sticky top-0 z-10 print:hidden">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                        </Link>
                        <div className="text-center flex-1">
                            <div className="inline-flex items-center gap-2.5 mb-1 justify-center">
                                <img
                                    src="/logo.png"
                                    alt="Reponix Logo"
                                    className="w-5 h-5 rounded-md object-cover flex-shrink-0"
                                />
                                <h1 className="text-lg font-bold text-balance m-0">{data.repository}</h1>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(data.metadata.processedAt).toLocaleString()}</p>
                        </div>
                        <Button 
                            onClick={() => window.print()} 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 bg-primary/10 border-primary/25 hover:bg-primary/20 text-primary hover:text-primary transition-all rounded-lg shrink-0 print:hidden"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download PDF</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Print-Only Branded Header */}
                <div className="hidden print:flex items-center justify-between border-b-2 border-primary/20 pb-6 mb-8 w-full">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Reponix Logo"
                            className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight m-0">REPONIX</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold m-0">AI Code Analysis & Security Audit</p>
                        </div>
                    </div>
                    <div className="text-right leading-tight">
                        <p className="text-sm font-bold text-foreground m-0">AUDIT REPORT</p>
                        <p className="text-xs text-muted-foreground m-0">{new Date(data.metadata.processedAt).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Custom Dynamic Print Stylesheet for Premium PDF Branding */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        /* Print Base Configs */
                        html, body {
                            background-color: #ffffff !important;
                            color: #0f172a !important;
                            font-family: system-ui, -apple-system, sans-serif !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* Hide interactive screens and navbar wrapper */
                        .print\\:hidden, button, a, nav, .sticky, header, footer, [role="button"] {
                            display: none !important;
                        }
                        
                        /* Grid & Container formatting */
                        .container {
                            max-width: 100% !important;
                            width: 100% !important;
                            padding: 0 1cm !important;
                            margin: 0 !important;
                        }
                        
                        .grid {
                            display: grid !important;
                            gap: 16px !important;
                        }
                        .grid-cols-1 { grid-template-columns: 1fr !important; }
                        .grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
                        .grid-cols-4 { grid-template-columns: repeat(4, 1fr) !important; }
                        .md\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr) !important; }

                        /* Convert Glassmorphism Cards to Premium White High-Contrast Printed Layout */
                        .bg-card\\/40, .bg-gradient-to-br, .bg-card, .bg-muted\\/30, .p-8 {
                            background: #ffffff !important;
                            background-color: #ffffff !important;
                            border: 1px solid #e2e8f0 !important;
                            color: #0f172a !important;
                            box-shadow: none !important;
                            break-inside: avoid !important;
                            page-break-inside: avoid !important;
                            border-radius: 12px !important;
                            margin-bottom: 16px !important;
                            padding: 20px !important;
                        }

                        .bg-primary\\/5 {
                            background-color: #f8fafc !important;
                            border: 1px solid #e2e8f0 !important;
                        }

                        /* High contrast styling for text metrics */
                        .text-muted-foreground {
                            color: #475569 !important;
                        }
                        .text-foreground {
                            color: #0f172a !important;
                        }
                        
                        /* Colors & Progress Rings */
                        .stroke-muted {
                            stroke: #e2e8f0 !important;
                        }
                        .text-emerald-500 { color: #059669 !important; }
                        .stroke-emerald-500 { stroke: #059669 !important; }
                        .text-amber-500 { color: #d97706 !important; }
                        .stroke-amber-500 { stroke: #d97706 !important; }
                        .text-orange-500 { color: #ea580c !important; }
                        .stroke-orange-500 { stroke: #ea580c !important; }
                        .text-rose-500 { color: #dc2626 !important; }
                        .stroke-rose-500 { stroke: #dc2626 !important; }
                        .text-purple-500 { color: #7c3aed !important; }
                        .stroke-purple-500 { stroke: #7c3aed !important; }

                        /* Typography and Titles */
                        h1, h2, h3, h4, h5, h6 {
                            color: #0f172a !important;
                            font-weight: 700 !important;
                            break-after: avoid !important;
                            page-break-after: avoid !important;
                        }

                        /* Specific Badges and code elements */
                        code {
                            background-color: #f1f5f9 !important;
                            border: 1px solid #e2e8f0 !important;
                            color: #334155 !important;
                            padding: 2px 6px !important;
                            font-size: 85% !important;
                        }

                        /* Page break configurations */
                        .mb-10 {
                            margin-bottom: 24px !important;
                            break-inside: avoid !important;
                            page-break-inside: avoid !important;
                        }

                        @page {
                            size: A4 portrait;
                            margin: 1.5cm;
                        }
                    }
                }
            ` }} />
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
