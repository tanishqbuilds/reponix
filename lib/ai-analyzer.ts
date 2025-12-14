/**
 * AI-powered code analysis using Groq
 */

import Groq from 'groq-sdk';
import { FileItem } from './file-processor';

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface AnalysisResult {
    overall: {
        score: number; // 0-100
        summary: string;
        aiDetectionProbability: number; // 0-100
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
            confidence: number; // 0-100
            reasons: string[];
        }>;
        patterns: string[];
    };
    recommendations: string[];
}

/**
 * Analyze repository code using Groq AI
 */
export async function analyzeCodeWithGroq(
    files: FileItem[],
    repoName: string
): Promise<AnalysisResult> {
    try {
        // Create a focused prompt for code analysis
        const prompt = createAnalysisPrompt(files, repoName);

        // Call Groq API
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile', // Fast and capable model
            messages: [
                {
                    role: 'system',
                    content: `You are an expert code reviewer and security analyst. Analyze the provided repository code and return a detailed JSON report covering:
1. Security vulnerabilities
2. Code quality issues
3. AI-generated code detection
4. Overall assessment and recommendations

Always respond with valid JSON only, no markdown formatting.`,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3, // Lower temperature for more consistent analysis
            max_tokens: 4000,
            response_format: { type: 'json_object' },
        });

        // Parse response
        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('No response from Groq API');
        }

        const analysis = JSON.parse(responseText);

        // Structure and validate the response
        return formatAnalysisResult(analysis);

    } catch (error) {
        console.error('Groq analysis error:', error);
        throw new Error(
            `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Create analysis prompt from files
 */
function createAnalysisPrompt(files: FileItem[], repoName: string): string {
    let prompt = `Analyze the following repository: ${repoName}\n\n`;
    prompt += `Total files: ${files.length}\n\n`;
    prompt += `Please analyze for:\n`;
    prompt += `1. Security vulnerabilities (SQL injection, XSS, hardcoded secrets, etc.)\n`;
    prompt += `2. Code quality issues (bugs, code smells, performance issues)\n`;
    prompt += `3. AI-generated code patterns (repetitive structure, generic names, lack of context)\n`;
    prompt += `4. Overall code health and recommendations\n\n`;
    prompt += `Files:\n\n`;

    // Include up to 20 files in the prompt to avoid token limits
    const filesToAnalyze = files.slice(0, 20);

    for (const file of filesToAnalyze) {
        prompt += `--- File: ${file.path} (${file.extension}) ---\n`;
        // Limit each file to 1000 characters to manage token count
        const truncatedContent = file.content.length > 1000
            ? file.content.substring(0, 1000) + '\n... [truncated]'
            : file.content;
        prompt += truncatedContent + '\n\n';
    }

    if (files.length > 20) {
        prompt += `\n[Note: ${files.length - 20} additional files not shown]\n`;
    }

    prompt += `\nProvide your analysis as JSON with this structure:
{
  "overall": {
    "score": <0-100>,
    "summary": "<brief summary>",
    "aiDetectionProbability": <0-100>
  },
  "security": {
    "vulnerabilities": [
      {
        "severity": "low|medium|high|critical",
        "file": "path/to/file",
        "description": "description",
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
      {
        "file": "path",
        "confidence": <0-100>,
        "reasons": ["reason1", "reason2"]
      }
    ],
    "patterns": ["pattern1", "pattern2"]
  },
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    return prompt;
}

/**
 * Format and validate AI response
 */
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
