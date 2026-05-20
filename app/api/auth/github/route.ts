import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
        return NextResponse.json(
            { error: 'GitHub Client ID is not configured in environment variables.' },
            { status: 500 }
        );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const appUrl = `${protocol}://${host}`;
    const redirectUri = `${appUrl}/api/auth/github/callback`;
    const scope = 'repo read:user';
    const state = Math.random().toString(36).substring(2, 15);

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent(scope)}&state=${state}`;

    // Return redirect response
    return NextResponse.redirect(githubAuthUrl);
}
