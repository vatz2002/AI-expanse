import { setCredentials } from '@/lib/gmail';
import { auth, currentUser } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return new NextResponse('Missing code', { status: 400 });
    }

    try {
        const email = user.emailAddresses[0]?.emailAddress;
        await setCredentials(code, userId, email);

        // Redirect back to dashboard with success query param
        return NextResponse.redirect(new URL('/dashboard?sync=connected', req.url));
    } catch (error) {
        console.error('Gmail Auth Error:', error);
        return NextResponse.redirect(new URL('/dashboard?sync=error', req.url));
    }
}
