import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await requireAuth();

        // Get user's group memberships
        const memberships = await prisma.groupMember.findMany({
            where: { userId: user.id },
            include: {
                group: {
                    include: {
                        expenses: { include: { splits: true } },
                        members: { include: { user: { select: { name: true, email: true, id: true } } } },
                        settlements: true,
                    },
                },
            },
        });

        const results: any[] = [];

        for (const membership of memberships) {
            const group = membership.group;

            // Calculate balances per group
            const balances: Record<string, number> = {};
            group.members.forEach(m => { balances[m.userId] = 0; });

            group.expenses.forEach(expense => {
                const amount = Number(expense.amount);
                if (balances[expense.paidBy] !== undefined) balances[expense.paidBy] += amount;
                expense.splits?.forEach(split => {
                    const splitAmount = Number(split.amount);
                    if (balances[split.userId] !== undefined) balances[split.userId] -= splitAmount;
                });
            });

            // Factor in settlements
            group.settlements.forEach(s => {
                const amt = Number(s.amount);
                if (balances[s.fromUserId] !== undefined) balances[s.fromUserId] += amt;
                if (balances[s.toUserId] !== undefined) balances[s.toUserId] -= amt;
            });

            // Calculate suggested settlements using greedy algorithm
            const debtors: { userId: string; amount: number }[] = [];
            const creditors: { userId: string; amount: number }[] = [];

            Object.entries(balances).forEach(([userId, balance]) => {
                if (balance < -0.01) debtors.push({ userId, amount: Math.abs(balance) });
                if (balance > 0.01) creditors.push({ userId, amount: balance });
            });

            debtors.sort((a, b) => b.amount - a.amount);
            creditors.sort((a, b) => b.amount - a.amount);

            let di = 0, ci = 0;
            while (di < debtors.length && ci < creditors.length) {
                const settle = Math.min(debtors[di].amount, creditors[ci].amount);
                if (settle > 0.01) {
                    const fromUser = group.members.find(m => m.userId === debtors[di].userId);
                    const toUser = group.members.find(m => m.userId === creditors[ci].userId);

                    // Only include settlements involving the current user
                    if (debtors[di].userId === user.id || creditors[ci].userId === user.id) {
                        results.push({
                            id: `${group.id}-${di}-${ci}`,
                            groupId: group.id,
                            groupName: group.name,
                            fromUserId: debtors[di].userId,
                            fromUserName: fromUser?.user?.name || fromUser?.user?.email || 'Unknown',
                            toUserId: creditors[ci].userId,
                            toUserName: toUser?.user?.name || toUser?.user?.email || 'Unknown',
                            amount: Math.round(settle * 100) / 100,
                            youOwe: debtors[di].userId === user.id,
                        });
                    }
                }
                debtors[di].amount -= settle;
                creditors[ci].amount -= settle;
                if (debtors[di].amount < 0.01) di++;
                if (creditors[ci].amount < 0.01) ci++;
            }
        }

        // Sort: you owe first, then by amount descending
        results.sort((a, b) => {
            if (a.youOwe && !b.youOwe) return -1;
            if (!a.youOwe && b.youOwe) return 1;
            return b.amount - a.amount;
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error('Settlements overview error:', error);
        return NextResponse.json([]);
    }
}
