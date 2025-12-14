/**
 * Validation utilities for GitHub URLs and repository data
 */

export interface GitHubRepoInfo {
    owner: string;
    repo: string;
    branch?: string;
}

/**
 * Validates and parses a GitHub repository URL
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - github.com/owner/repo
 */
export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
    if (!url || typeof url !== 'string') {
        return null;
    }

    // Remove trailing slash and .git extension
    const cleanUrl = url.trim().replace(/\.git$/, '').replace(/\/$/, '');

    const httpsPattern = /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/;
    const httpsMatch = cleanUrl.match(httpsPattern);

    if (httpsMatch) {
        return {
            owner: httpsMatch[1],
            repo: httpsMatch[2],
        };
    }

    // Pattern 2: SSH URLs (git@github.com:owner/repo)
    const sshPattern = /git@github\.com:([^\/]+)\/(.+)/;
    const sshMatch = cleanUrl.match(sshPattern);

    if (sshMatch) {
        return {
            owner: sshMatch[1],
            repo: sshMatch[2],
        };
    }

    return null;
}

/**
 * Validates that a GitHub repo exists and is accessible
 */
export async function validateRepoExists(
    owner: string,
    repo: string
): Promise<{ valid: boolean; error?: string }> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
                headers: {
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        if (response.status === 404) {
            return { valid: false, error: 'Repository not found' };
        }

        if (response.status === 403) {
            return { valid: false, error: 'Repository is private or access forbidden' };
        }

        if (!response.ok) {
            return { valid: false, error: `GitHub API error: ${response.status}` };
        }

        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}
