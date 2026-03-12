import { syncRecentTransactions } from '@/lib/gmail';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const { userId: clerkId } = auth();
    if (!clerkId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: { gmailConnection: true }
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const body = await req.json().catch(() => ({}));
        const isAuto = body.isAuto === true;

        if (isAuto) {
            if (!user.gmailConnection?.autoSync) {
                return NextResponse.json({ success: false, message: 'Auto-sync disabled' });
            }

            // Simple debounce: only auto-sync once every hour
            const lastSynced = user.gmailConnection.lastSyncedAt;
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (lastSynced && lastSynced > oneHourAgo) {
                return NextResponse.json({ success: false, message: 'Synced recently' });
            }
        }

        const transactions = await syncRecentTransactions(user.id);
        return NextResponse.json({ success: true, count: transactions.length, transactions });
    } catch (error: any) {
        console.error('Gmail Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
