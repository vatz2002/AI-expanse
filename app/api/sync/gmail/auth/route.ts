import { getAuthUrl } from '@/lib/gmail';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { userId } = auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const url = getAuthUrl();
    return NextResponse.redirect(url);
}
