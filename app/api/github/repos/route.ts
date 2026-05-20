import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('reponix_session');

        if (!sessionCookie || !sessionCookie.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        const accessToken = session.accessToken;

        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch up to 100 repositories from GitHub
        // type=all returns both public and private repositories where the user is owner or collaborator
        const response = await fetch(
            'https://api.github.com/user/repos?type=all&sort=updated&per_page=100',
            {
                headers: {
                    Authorization: `token ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'Reponix-App',
                },
                // Avoid Next.js caching this endpoint dynamically so it's always fresh
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
        }

        const repos = await response.json();

        // Format repo payload for the frontend
        const formattedRepos = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || 'No description provided.',
            htmlUrl: repo.html_url,
            isPrivate: repo.private,
            stars: repo.stargazers_count,
            language: repo.language || 'Unknown',
            updatedAt: repo.updated_at,
        }));

        return NextResponse.json({ success: true, repos: formattedRepos });

    } catch (error) {
        console.error('Fetch repositories error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve GitHub repositories', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
