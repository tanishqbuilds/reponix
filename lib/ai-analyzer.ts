
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
        const contextSummary = buildContextSummary(files);
        const prompt = createAnalysisPrompt(files, repoName, contextSummary);

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

        return formatAnalysisResult(analysis);

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
    contextSummary: string
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

function formatAnalysisResult(rawAnalysis: any): AnalysisResult {
    return {
        overall: {
            score: rawAnalysis.overall?.score || 0,
            summary: rawAnalysis.overall?.summary || 'Analysis completed',
            aiDetectionProbability: rawAnalysis.overall?.aiDetectionProbability || 0,
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
            patterns: rawAnalysis.aiGenerated?.patterns || [],
        },
        recommendations: rawAnalysis.recommendations || [],
    };
}
