import { syncRecentTransactions } from '@/lib/gmail';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export async function POST() {
    const { userId } = auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const transactions = await syncRecentTransactions(userId);
        return NextResponse.json({ success: true, count: transactions.length, transactions });
    } catch (error: any) {
        console.error('Gmail Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
