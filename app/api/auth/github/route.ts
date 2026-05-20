import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
        return NextResponse.json(
            { error: 'GitHub Client ID is not configured in environment variables.' },
            { status: 500 }
        );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/github/callback`;
    const scope = 'repo read:user';
    const state = Math.random().toString(36).substring(2, 15);

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent(scope)}&state=${state}`;

    // Return redirect response
    return NextResponse.redirect(githubAuthUrl);
}
