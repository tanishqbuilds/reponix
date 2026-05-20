
import Groq from 'groq-sdk';
import { FileItem } from './file-processor';
import { buildContextSummary } from './context-analyzer';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface AnalysisResult {
    overall: {
        score: number;
        summary: string;
        aiDetectionProbability: number;
    };
    security: {
        vulnerabilities: Array<{
            severity: 'low' | 'medium' | 'high' | 'critical';
            file: string;
            line?: number;
            description: string;
            recommendation: string;
        }>;
        score: number;
    };
    codeQuality: {
        issues: Array<{
            type: 'bug' | 'code-smell' | 'performance' | 'best-practice';
            file: string;
            description: string;
            suggestion: string;
        }>;
        score: number;
    };
    aiGenerated: {
        suspiciousFiles: Array<{
            file: string;
            confidence: number;
            reasons: string[];
        }>;
        patterns: string[];
    };
    recommendations: string[];
}


export async function analyzeCodeWithGroq(
    files: FileItem[],
    repoName: string
): Promise<AnalysisResult> {
    try {
        const heuristics = calculateHeuristics(files);
        const contextSummary = buildContextSummary(files);
        const prompt = createAnalysisPrompt(files, repoName, contextSummary, heuristics);

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert code reviewer and security analyst. Your goal is to perform a deep, contextual analysis of the provided repository.

CRITICAL INSTRUCTIONS:
1. GLOBAL REPOSITORY CONTEXT & SECURITY MEMORY: A dedicated section "GLOBAL REPOSITORY CONTEXT & SECURITY MEMORY" is provided in the prompt. You MUST cross-reference this memory before flagging ANY issue.
2. GLOBAL SECURITY & MIDDLEWARE: Do not report "missing authentication", "missing session check", or "missing auth validation" for any API route or file if that route's path is covered by active global middleware matchers or if the file imports and uses detected security helpers/wrappers (e.g., withAuth, getServerSession).
3. FALSE POSITIVES: Treat routes protected by global middleware matchers or wrappers as fully secured. Only report authorization bugs if there is a concrete logical vulnerability in the middleware or helper itself.
4. INTERCONNECTEDNESS: Understand file relationships. Check if a function is called elsewhere inside a protected wrapper before flagging it as insecure.
5. AI DETECTION: Be decisive. Do not default to 20% or 80%. Use these markers:
   - HUMAN markers: Idiosyncratic comments, inconsistent (but logical) formatting, complex edge-case handling that feels "learned from experience", specific business logic references.
   - AI markers: Overly clean/generic code, standard "tutorial-style" patterns, boilerplate comments (e.g., "// This function adds two numbers"), lack of idiosyncratic "hacks", and use of very common LLM naming tropes (e.g., 'handler', 'processor', 'helper' without specific context).
6. PROJECT STRUCTURE: Use the provided file list to understand the overall architecture even if some file contents are truncated or missing.

Always respond with valid JSON only, no markdown formatting.`,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.2, // Lower temperature for more consistent JSON
            max_tokens: 4000,
            response_format: { type: 'json_object' },
        });
        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('No response from Groq API');
        }

        const analysis = JSON.parse(responseText);

        return formatAnalysisResult(analysis, heuristics);

    } catch (error) {
        console.error('Groq analysis error:', error);
        throw new Error(
            `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

function createAnalysisPrompt(
    files: FileItem[],
    repoName: string,
    contextSummary: string,
    heuristics: HeuristicScores
): string {
    // Sort files by importance
    const getImportance = (path: string) => {
        const p = path.toLowerCase();
        if (p.includes('package.json')) return 100;
        if (p.includes('middleware') || p.includes('auth')) return 95;
        if (p.includes('config') || p.includes('.env.example')) return 90;
        if (p.includes('api/') || p.includes('routes/')) return 80;
        if (p.includes('lib/') || p.includes('utils/') || p.includes('services/')) return 70;
        if (p.includes('models/') || p.includes('db/')) return 60;
        return 50;
    };

    const sortedFiles = [...files].sort((a, b) => getImportance(b.path) - getImportance(a.path));

    let prompt = `Analyze the repository: ${repoName}\n\n`;
    prompt += `Project Structure (All Processed Files):\n`;
    files.forEach(f => {
        prompt += `- ${f.path}\n`;
    });
    prompt += `\nTotal files processed: ${files.length}\n\n`;

    prompt += `### GLOBAL REPOSITORY CONTEXT & SECURITY MEMORY ###\n`;
    prompt += `${contextSummary}\n\n`;

    prompt += `### STATIC HEURISTICS STATS (FROM PROGRAMMATIC CODE SCAN) ###\n`;
    prompt += `- Quote Consistency (mixed single/double quotes): ${heuristics.details.mixedQuotes ? 'Mixed (High manual signature)' : 'Uniform'}\n`;
    prompt += `- Compiler Bypass shortcuts ('any', '@ts-ignore'): ${heuristics.details.lazyTypes} instances\n`;
    prompt += `- Human-written informal comments/todos: ${heuristics.details.informalComments} instances\n`;
    prompt += `- Short colloquial variable names (e.g. err, fn, res): ${heuristics.details.colloquialNames} instances\n`;
    prompt += `- Overly formal boilerplate comments: ${heuristics.details.formalBoilerplateComments} instances\n\n`;

    prompt += `INSTRUCTIONS:\n`;
    prompt += `1. Security: Look for SQLi, XSS, SSRF, hardcoded secrets, and BROKEN ACCESS CONTROL. Read the "GLOBAL REPOSITORY CONTEXT & SECURITY MEMORY" section to verify if the file is covered by global middleware protection or wraps/calls secured handlers before flagging individual routes.\n`;
    prompt += `2. Quality: Identify bugs, performance bottlenecks, and architectural issues. Cross-reference where functions are imported/exported using the provided context.\n`;
    prompt += `3. AI Detection: Analyze the 'Human-Written' feel. Use 'aiDetectionProbability' (0-100).
       - Does the code have idiosyncratic comments, quirky naming, or specific business logic (Human)?
       - Is it overly clean, uses generic 'tutorial-style' boilerplate, or has perfect but robotic documentation (AI)?
       - BE DECISIVE: High Human score (>90%) for idiosyncratic code; High AI score (>70%) for clear boilerplate. Don't default to 20%.\n\n`;

    prompt += `### FILE CONTENTS ###\n\n`;    // Include as many files as possible within a reasonable limit, prioritizing top-importance
    let currentTokenEstimate = 0;
    const MAX_TOKENS_ESTIMATE = 5000; // Lowered to 5000 to safely fit Groq's 12,000 TPM limit

    for (const file of sortedFiles) {
        if (currentTokenEstimate > MAX_TOKENS_ESTIMATE) break;

        const importance = getImportance(file.path);
        // Important files get more context
        const charLimit = importance >= 90 ? 4000 : 1500;
        
        const content = file.content.length > charLimit
            ? file.content.substring(0, charLimit) + '\n... [truncated for brevity]'
            : file.content;

        prompt += `--- File: ${file.path} ---\n${content}\n\n`;
        currentTokenEstimate += content.length / 2.5; // More accurate token estimate for programming code
    }
    prompt += `\nProvide your analysis as JSON with this structure:
{
  "overall": {
    "score": <0-100>,
    "summary": "<comprehensive summary acknowledging the full architecture>",
    "aiDetectionProbability": <0-100>
  },
  "security": {
    "vulnerabilities": [
      {
        "severity": "low|medium|high|critical",
        "file": "path/to/file",
        "description": "specific description",
        "recommendation": "how to fix"
      }
    ],
    "score": <0-100>
  },
  "codeQuality": {
    "issues": [
      {
        "type": "bug|code-smell|performance|best-practice",
        "file": "path/to/file",
        "description": "description",
        "suggestion": "improvement"
      }
    ],
    "score": <0-100>
  },
  "aiGenerated": {
    "suspiciousFiles": [
      { "file": "path", "confidence": <0-100>, "reasons": [] }
    ],
    "patterns": []
  },
  "recommendations": []
}`;

    return prompt;
}

function formatAnalysisResult(rawAnalysis: any, heuristics: HeuristicScores): AnalysisResult {
    const llmHumanScore = 100 - (rawAnalysis.overall?.aiDetectionProbability ?? 50);
    const staticHumanScore = heuristics.humanScore;

    // Blend: 60% LLM contextual pattern recognition + 40% strict static heuristics
    const blendedHumanScore = Math.round(0.6 * llmHumanScore + 0.4 * staticHumanScore);
    const blendedAiProbability = 100 - blendedHumanScore;

    // Combine static patterns with LLM detected patterns
    const combinedPatterns = [
        ...heuristics.details.humanMarkersFound.map(m => `[Static Heuristics] ${m}`),
        ...heuristics.details.aiMarkersFound.map(m => `[Static Heuristics] ${m}`),
        ...(rawAnalysis.aiGenerated?.patterns || []),
    ];

    return {
        overall: {
            score: rawAnalysis.overall?.score || 0,
            summary: rawAnalysis.overall?.summary || 'Analysis completed',
            aiDetectionProbability: blendedAiProbability,
        },
        security: {
            vulnerabilities: rawAnalysis.security?.vulnerabilities || [],
            score: rawAnalysis.security?.score || 100,
        },
        codeQuality: {
            issues: rawAnalysis.codeQuality?.issues || [],
            score: rawAnalysis.codeQuality?.score || 100,
        },
        aiGenerated: {
            suspiciousFiles: rawAnalysis.aiGenerated?.suspiciousFiles || [],
            patterns: combinedPatterns,
        },
        recommendations: rawAnalysis.recommendations || [],
    };
}

// ==========================================
// STATIC CODE HEURISTICS DETECTOR ALGORITHM
// ==========================================

interface HeuristicScores {
    humanScore: number;
    details: {
        humanMarkersFound: string[];
        aiMarkersFound: string[];
        mixedQuotes: boolean;
        lazyTypes: number;
        colloquialNames: number;
        informalComments: number;
        formalBoilerplateComments: number;
    }
}

function calculateHeuristics(files: FileItem[]): HeuristicScores {
    let humanScore = 50; // Neutral baseline
    const humanMarkers: string[] = [];
    const aiMarkers: string[] = [];

    let totalMixedQuotesCount = 0;
    let totalLazyTypes = 0;
    let totalColloquialNames = 0;
    let totalInformalComments = 0;
    let totalFormalComments = 0;

    // Common abbreviations and colloquial names humans use, but AI avoids in favor of verbose forms
    const colloquialRegex = /\b(err|idx|fn|el|res|req|cb|val|temp|t|e|i|j|k|db|ctx|pkg|meta|config|repo|auth|usr|msg)\b/gi;
    
    // Lazy bypasses in TypeScript that humans write in a rush
    const lazyTypesRegex = /\b(any|as\s+any)\b|\/\/ @ts-(ignore|expect-error|nocheck)/gi;

    // Human markers inside comments
    const todoRegex = /\b(TODO|FIXME|HACK|WORKAROUND|BUG|LAZY|TEMP|QUICKFIX|BYPASS|XXX)\b/gi;

    files.forEach(file => {
        const content = file.content;
        if (!content) return;

        // 1. Quote Mixing Check (High human marker unless auto-formatter is run)
        const hasSingle = content.includes("'");
        const hasDouble = content.includes('"');
        const hasBacktick = content.includes('`');
        const isMixed = (hasSingle && hasDouble) || (hasSingle && hasBacktick) || (hasDouble && hasBacktick);
        if (isMixed) {
            totalMixedQuotesCount++;
        }

        // 2. Colloquial naming checks
        const colloquialMatches = content.match(colloquialRegex);
        if (colloquialMatches) {
            totalColloquialNames += colloquialMatches.length;
        }

        // 3. Lazy types and compiler bypasses
        const lazyMatches = content.match(lazyTypesRegex);
        if (lazyMatches) {
            totalLazyTypes += lazyMatches.length;
        }

        // 4. Comment-level heuristics
        // Extract comments: single line // and multi-line /* */
        const singleLineComments = content.match(/\/\/.*$/gm) || [];
        const multiLineComments = content.match(/\/\*[\s\S]*?\*\//g) || [];
        const allComments = [...singleLineComments, ...multiLineComments];

        allComments.forEach(comment => {
            // Check for explicit Human markers in comments
            if (todoRegex.test(comment)) {
                totalInformalComments += 2;
            }

            // Check if comment is informal/quirky
            // - Lowercase starting: e.g., "// wait, this is a hack"
            // - Emojis or punctuation strings like "??", "!!", "..."
            // - Slang words: "wtf", "meh", "dumb", "crap", "weird", "omg", "lazy", "please"
            const trimmed = comment.replace(/^\/\/|^\/\*|\*\/$/g, '').trim();
            if (trimmed.length > 0) {
                const firstChar = trimmed[0];
                const isLowercase = firstChar >= 'a' && firstChar <= 'z';
                const hasExclamationOrQuestion = /[!?]{2,}/.test(trimmed) || trimmed.includes('...');
                const hasSlang = /\b(wtf|meh|dumb|crap|weird|omg|lazy|please|magic|hacky|junk|ugly)\b/gi.test(trimmed);

                if (isLowercase || hasExclamationOrQuestion || hasSlang) {
                    totalInformalComments++;
                } else if (trimmed.length > 15 && /^[A-Z][a-z]+(\s+[a-z]+){3,}\.?$/.test(trimmed)) {
                    // Highly formal, sentence-case, robotic comment typical of AI generators
                    totalFormalComments++;
                }
            }
        });
    });

    // Score calculations
    // Informality adds human points
    if (totalInformalComments > 0) {
        const points = Math.min(totalInformalComments * 2.5, 25);
        humanScore += points;
        humanMarkers.push(`Found ${totalInformalComments} informal/idiosyncratic comments or todo annotations (e.g. TODO, FIXME, HACK)`);
    }

    // Colloquial names adds human points
    if (totalColloquialNames > 0) {
        const ratio = totalColloquialNames / Math.max(files.length, 1);
        const points = Math.min(ratio * 1.5, 15);
        humanScore += points;
        humanMarkers.push(`Extensive use of colloquial variable/parameter shorthand names (e.g. err, idx, fn, res)`);
    }

    // Lazy compiler bypasses adds human points (LLMs rarely do this unless instructed)
    if (totalLazyTypes > 0) {
        const points = Math.min(totalLazyTypes * 2, 10);
        humanScore += points;
        humanMarkers.push(`Compiler bypass markers or flexible type coercion used (e.g. 'any', '@ts-ignore')`);
    }

    // Quote mixing indicates manual editing / multiple developer inputs
    if (totalMixedQuotesCount > 0) {
        const ratio = totalMixedQuotesCount / Math.max(files.length, 1);
        if (ratio > 0.4) {
            humanScore += 8;
            humanMarkers.push(`Stylistic variety in code strings (mixed quotes indicates organic manual editing)`);
        }
    }

    // Formal comments subtracts human points (typical AI documentation style)
    if (totalFormalComments > 0) {
        const points = Math.min(totalFormalComments * 1.5, 20);
        humanScore -= points;
        aiMarkers.push(`Highly structured, verbose, and robotic docstrings/comments repeating trivial logic`);
    }

    // Extreme boilerplate files detection
    let boilerplateCount = 0;
    files.forEach(file => {
        if (file.content.length < 500 && (file.content.includes('export * from') || file.content.includes('import React from'))) {
            boilerplateCount++;
        }
    });
    if (boilerplateCount > 0) {
        const ratio = boilerplateCount / Math.max(files.length, 1);
        if (ratio > 0.3) {
            humanScore -= 10;
            aiMarkers.push(`High density of clean, boilerplate routing or component exports`);
        }
    }

    // Cap human score between 5 and 98 to represent realistic probabilities
    humanScore = Math.max(5, Math.min(98, humanScore));

    return {
        humanScore,
        details: {
            humanMarkersFound: humanMarkers,
            aiMarkersFound: aiMarkers,
            mixedQuotes: totalMixedQuotesCount > 0,
            lazyTypes: totalLazyTypes,
            colloquialNames: totalColloquialNames,
            informalComments: totalInformalComments,
            formalBoilerplateComments: totalFormalComments
        }
    };
}
