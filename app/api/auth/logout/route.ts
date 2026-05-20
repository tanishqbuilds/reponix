import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('reponix_session');
        
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const appUrl = `${protocol}://${host}`;
        return NextResponse.redirect(appUrl);
    } catch (error) {
        console.error('Logout error:', error);
        
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const appUrl = `${protocol}://${host}`;
        return NextResponse.redirect(appUrl);
    }
}
