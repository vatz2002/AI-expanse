import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await requireAuth();

        // Get user's groups
        const memberships = await prisma.groupMember.findMany({
            where: { userId: user.id },
            select: { groupId: true, group: { select: { name: true } } },
        });

        const groupIds = memberships.map(m => m.groupId);
        const groupNameMap = new Map(memberships.map(m => [m.groupId, m.group.name]));

        // Fetch recent expenses
        const recentExpenses = await prisma.groupExpense.findMany({
            where: { groupId: { in: groupIds } },
            orderBy: { createdAt: 'desc' },
            take: 15,
            include: {
                group: { select: { name: true } },
            },
        });

        // Fetch recent settlements
        const recentSettlements = await prisma.settlement.findMany({
            where: { groupId: { in: groupIds } },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Get user names for all referenced user IDs
        const userIds = new Set<string>();
        recentExpenses.forEach(e => userIds.add(e.paidBy));
        recentSettlements.forEach(s => { userIds.add(s.fromUserId); userIds.add(s.toUserId); });

        const users = await prisma.user.findMany({
            where: { id: { in: Array.from(userIds) } },
            select: { id: true, name: true, email: true },
        });
        const userMap = new Map(users.map(u => [u.id, u.name || u.email?.split('@')[0] || 'Unknown']));

        // Combine and sort activities
        const activities: any[] = [];

        recentExpenses.forEach(e => {
            activities.push({
                id: `expense-${e.id}`,
                type: 'expense',
                groupName: e.group?.name || groupNameMap.get(e.groupId) || 'Group',
                groupId: e.groupId,
                description: e.description,
                amount: Number(e.amount),
                category: e.category,
                userName: userMap.get(e.paidBy) || 'Unknown',
                createdAt: e.createdAt.toISOString(),
            });
        });

        recentSettlements.forEach(s => {
            activities.push({
                id: `settlement-${s.id}`,
                type: 'settlement',
                groupName: groupNameMap.get(s.groupId) || 'Group',
                groupId: s.groupId,
                description: `${userMap.get(s.fromUserId) || 'Someone'} → ${userMap.get(s.toUserId) || 'Someone'}`,
                amount: Number(s.amount),
                userName: userMap.get(s.fromUserId) || 'Unknown',
                createdAt: s.createdAt.toISOString(),
            });
        });

        // Sort by date
        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json(activities.slice(0, 15));
    } catch (error) {
        console.error('Activity feed error:', error);
        return NextResponse.json([]);
    }
}
