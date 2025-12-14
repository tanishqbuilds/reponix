import { NextResponse } from 'next/server';
import { parseGitHubUrl, validateRepoExists } from '@/lib/validators';
import {
    fetchAndFilterFiles,
    formatFilesForRAG,
    createRepoSummary
} from '@/lib/file-processor';
import { analyzeCodeWithGroq } from '@/lib/ai-analyzer';

export const maxDuration = 60; // 60 second timeout for AI analysis

export async function POST(req: Request) {
    try {
        // Parse request body
        const { repoUrl } = await req.json();

        // Validate URL format
        if (!repoUrl || typeof repoUrl !== 'string') {
            return NextResponse.json(
                { error: 'Repository URL is required' },
                { status: 400 }
            );
        }

        // Parse GitHub URL
        const repoInfo = parseGitHubUrl(repoUrl);
        if (!repoInfo) {
            return NextResponse.json(
                {
                    error: 'Invalid GitHub URL format',
                    hint: 'Expected format: https://github.com/owner/repository'
                },
                { status: 400 }
            );
        }

        const { owner, repo } = repoInfo;

        // Validate repository exists
        const validation = await validateRepoExists(owner, repo);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    error: 'Repository validation failed',
                    details: validation.error
                },
                { status: 404 }
            );
        }

        // Fetch and process files
        const processedRepo = await fetchAndFilterFiles(owner, repo);

        if (processedRepo.files.length === 0) {
            return NextResponse.json(
                {
                    error: 'No analyzable files found',
                    details: 'Repository contains no supported code files'
                },
                { status: 400 }
            );
        }

        // Format files for RAG
        const formattedContent = formatFilesForRAG(processedRepo.files);

        // Create summary
        const summary = createRepoSummary(processedRepo);

        // Perform AI analysis using Groq
        const analysis = await analyzeCodeWithGroq(
            processedRepo.files,
            `${owner}/${repo}`
        );

        // Return comprehensive results
        return NextResponse.json({
            success: true,
            repository: `${owner}/${repo}`,
            summary,
            analysis,
            formattedContent,
            files: processedRepo.files.map(f => ({
                path: f.path,
                extension: f.extension,
                size: f.size,
            })),
            metadata: {
                processedAt: new Date().toISOString(),
                analyzedBy: 'Groq AI',
                model: 'llama-3.3-70b-versatile',
            }
        });

    } catch (error) {
        console.error('Analysis error:', error);

        return NextResponse.json(
            {
                error: 'Failed to analyze repository',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
