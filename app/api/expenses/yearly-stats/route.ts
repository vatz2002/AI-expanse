import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Get the last 12 months of spending data
        const now = new Date();
        const months: { month: string; monthNum: number; year: number; total: number }[] = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
            const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            const result = await prisma.expense.aggregate({
                where: {
                    userId: user.id,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _sum: {
                    amount: true,
                },
            });

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            months.push({
                month: monthNames[d.getMonth()],
                monthNum: d.getMonth() + 1,
                year: d.getFullYear(),
                total: result._sum.amount?.toNumber() || 0,
            });
        }

        return NextResponse.json({ months });
    } catch (error) {
        console.error('Error fetching yearly stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch yearly statistics' },
            { status: 500 }
        );
    }
}
