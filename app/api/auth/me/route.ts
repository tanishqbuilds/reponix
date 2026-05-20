import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('reponix_session');

        if (!sessionCookie || !sessionCookie.value) {
            return NextResponse.json({ authenticated: false });
        }

        const session = JSON.parse(sessionCookie.value);

        if (!session || !session.accessToken || !session.user) {
            return NextResponse.json({ authenticated: false });
        }

        return NextResponse.json({
            authenticated: true,
            user: session.user,
        });

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
