import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        
        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                { error: 'GitHub credentials are not configured.' },
                { status: 500 }
            );
        }

        // 1. Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error(`Failed to exchange code: ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            throw new Error('Access token not found in GitHub response');
        }

        // 2. Fetch user profile information from GitHub API
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Reponix-App',
            },
        });

        if (!userResponse.ok) {
            throw new Error(`Failed to fetch user: ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        
        // 3. Construct session metadata
        const sessionPayload = {
            accessToken,
            user: {
                username: userData.login,
                name: userData.name || userData.login,
                avatarUrl: userData.avatar_url,
                profileUrl: userData.html_url,
            },
        };

        // 4. Set the HTTP-only secure cookie
        const cookieStore = await cookies();
        cookieStore.set('reponix_session', JSON.stringify(sessionPayload), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        // 5. Redirect back to homepage
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(appUrl);

    } catch (error) {
        console.error('OAuth callback error:', error);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${appUrl}?auth_error=failed`);
    }
}
