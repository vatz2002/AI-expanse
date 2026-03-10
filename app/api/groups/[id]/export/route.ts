import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();

        // Verify membership
        const membership = await prisma.groupMember.findFirst({
            where: { groupId: params.id, userId: user.id },
        });

        if (!membership) {
            return NextResponse.json({ error: 'Not a member' }, { status: 403 });
        }

        const group = await prisma.group.findUnique({
            where: { id: params.id },
            include: {
                expenses: {
                    include: { splits: true },
                    orderBy: { date: 'desc' },
                },
                members: { include: { user: { select: { name: true, email: true } } } },
            },
        });

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // CSV header
        let csv = 'Date,Description,Category,Amount,Paid By,Split Type\n';

        const getMemberName = (userId: string) => {
            const member = group.members.find(m => m.userId === userId);
            return member?.user?.name || member?.user?.email || 'Unknown';
        };

        // CSV rows
        group.expenses.forEach(expense => {
            const date = new Date(expense.date).toLocaleDateString('en-IN');
            const desc = `"${expense.description.replace(/"/g, '""')}"`;
            const category = expense.category;
            const amount = Number(expense.amount).toFixed(2);
            const paidBy = `"${getMemberName(expense.paidBy)}"`;
            const splitType = expense.splitType;

            csv += `${date},${desc},${category},${amount},${paidBy},${splitType}\n`;
        });

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${group.name || 'expenses'}-export.csv"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
    }
}
