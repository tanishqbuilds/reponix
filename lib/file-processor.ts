/**
 * File processing utilities for repository analysis
 */

export interface FileItem {
    path: string;
    content: string;
    size: number;
    extension: string;
}

export interface ProcessedRepo {
    owner: string;
    repo: string;
    totalFiles: number;
    processedFiles: number;
    files: FileItem[];
    skippedFiles: string[];
    totalSize: number;
}

// File extensions to include in analysis
const ALLOWED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx',        // JavaScript/TypeScript
    '.py',                                 // Python
    '.java',                               // Java
    '.go',                                 // Go
    '.rs',                                 // Rust
    '.cpp', '.c', '.h', '.hpp',           // C/C++
    '.rb',                                 // Ruby
    '.php',                                // PHP
    '.cs',                                 // C#
    '.swift',                              // Swift
    '.kt',                                 // Kotlin
    '.md', '.mdx',                        // Documentation
    '.json', '.yml', '.yaml', '.toml',    // Config files
];

// Files/directories to exclude
const EXCLUDED_PATTERNS = [
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    '.git',
    '__pycache__',
    'venv',
    'env',
    'vendor',
    'target',
    '.idea',
    '.vscode',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
];

// Maximum file size (500KB)
const MAX_FILE_SIZE = 500 * 1024;

// Maximum number of files to process
const MAX_FILES = 100;

/**
 * Check if a file should be included based on extension
 */
export function shouldIncludeFile(filePath: string): boolean {
    const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Check if a file path should be excluded
 */
export function shouldExcludeFile(filePath: string): boolean {
    return EXCLUDED_PATTERNS.some(pattern =>
        filePath.includes(pattern)
    );
}

/**
 * Fetch and filter files from a GitHub repository
 */
export async function fetchAndFilterFiles(
    owner: string,
    repo: string,
    branch: string = 'main'
): Promise<ProcessedRepo> {
    const result: ProcessedRepo = {
        owner,
        repo,
        totalFiles: 0,
        processedFiles: 0,
        files: [],
        skippedFiles: [],
        totalSize: 0,
    };

    try {
        // Fetch repository tree
        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const treeResponse = await fetch(treeUrl, {
            headers: {
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!treeResponse.ok) {
            // Try 'master' branch if 'main' fails
            if (branch === 'main') {
                return fetchAndFilterFiles(owner, repo, 'master');
            }
            throw new Error(`Failed to fetch repository tree: ${treeResponse.status}`);
        }

        const treeData = await treeResponse.json();
        const tree = treeData.tree || [];

        result.totalFiles = tree.length;

        // Filter files
        const filesToFetch = tree
            .filter((item: any) => item.type === 'blob')
            .filter((item: any) => !shouldExcludeFile(item.path))
            .filter((item: any) => shouldIncludeFile(item.path))
            .slice(0, MAX_FILES); // Limit number of files

        // Fetch file contents
        for (const item of filesToFetch) {
            try {
                const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
                const fileResponse = await fetch(fileUrl);

                if (!fileResponse.ok) {
                    result.skippedFiles.push(item.path);
                    continue;
                }

                const content = await fileResponse.text();
                const size = new Blob([content]).size;

                // Skip files that are too large
                if (size > MAX_FILE_SIZE) {
                    result.skippedFiles.push(`${item.path} (too large: ${(size / 1024).toFixed(2)}KB)`);
                    continue;
                }

                const extension = item.path.substring(item.path.lastIndexOf('.'));

                result.files.push({
                    path: item.path,
                    content,
                    size,
                    extension,
                });

                result.totalSize += size;
                result.processedFiles++;

            } catch (error) {
                result.skippedFiles.push(item.path);
            }
        }

        return result;

    } catch (error) {
        throw new Error(
            `Failed to process repository: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Format files for RAG/LLM consumption
 * Creates a structured format that's easy for LLMs to parse
 */
export function formatFilesForRAG(files: FileItem[]): string {
    let formatted = '# Repository Code Analysis\n\n';
    formatted += `Total files: ${files.length}\n\n`;
    formatted += '---\n\n';

    for (const file of files) {
        formatted += `## File: ${file.path}\n`;
        formatted += `Extension: ${file.extension}\n`;
        formatted += `Size: ${(file.size / 1024).toFixed(2)}KB\n\n`;
        formatted += '```' + file.extension.slice(1) + '\n';
        formatted += file.content;
        formatted += '\n```\n\n';
        formatted += '---\n\n';
    }

    return formatted;
}

/**
 * Create a summary of the repository structure
 */
export function createRepoSummary(processedRepo: ProcessedRepo): object {
    const extensionCounts: Record<string, number> = {};

    processedRepo.files.forEach(file => {
        extensionCounts[file.extension] = (extensionCounts[file.extension] || 0) + 1;
    });

    return {
        repository: `${processedRepo.owner}/${processedRepo.repo}`,
        statistics: {
            totalFilesInRepo: processedRepo.totalFiles,
            processedFiles: processedRepo.processedFiles,
            skippedFiles: processedRepo.skippedFiles.length,
            totalSize: `${(processedRepo.totalSize / 1024).toFixed(2)}KB`,
        },
        fileTypes: extensionCounts,
        skippedFilesList: processedRepo.skippedFiles.slice(0, 10), // First 10 skipped files
    };
}
