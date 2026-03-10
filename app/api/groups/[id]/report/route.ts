import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCategoryLabel } from '@/lib/categories';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();

        const membership = await prisma.groupMember.findFirst({
            where: { groupId: params.id, userId: user.id },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Not a member' }, { status: 403 });
        }

        const group = await prisma.group.findUnique({
            where: { id: params.id },
            include: {
                expenses: { include: { splits: true } },
                members: { include: { user: { select: { name: true, email: true } } } },
            },
        });

        if (!group || group.expenses.length === 0) {
            return NextResponse.json({
                summary: 'No expenses recorded yet. Start adding expenses to get a monthly report!',
                stats: { total: 0, count: 0, topCategory: 'N/A', avgPerExpense: 0 },
            });
        }

        // Calculate stats
        const total = group.expenses.reduce((s, e) => s + Number(e.amount), 0);
        const categoryMap = new Map<string, number>();
        group.expenses.forEach(e => {
            categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + Number(e.amount));
        });
        const topCategory = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0];

        const memberSpending = group.members.map(m => ({
            name: m.user?.name || m.user?.email || 'Unknown',
            paid: group.expenses.filter(e => e.paidBy === m.userId).reduce((s, e) => s + Number(e.amount), 0),
        }));

        const stats = {
            total: Math.round(total),
            count: group.expenses.length,
            topCategory: topCategory ? getCategoryLabel(topCategory[0] as any) : 'N/A',
            topCategoryAmount: topCategory ? Math.round(topCategory[1]) : 0,
            avgPerExpense: Math.round(total / group.expenses.length),
            memberSpending,
        };

        // Generate AI summary
        try {
            const prompt = `You are a friendly financial assistant. Generate a brief, insightful 2-3 sentence monthly spending summary for a group called "${group.name}".

Stats:
- Total spent: ₹${stats.total}
- ${stats.count} expenses
- Top category: ${stats.topCategory} (₹${stats.topCategoryAmount})
- Average per expense: ₹${stats.avgPerExpense}
- Members: ${memberSpending.map(m => `${m.name} paid ₹${Math.round(m.paid)}`).join(', ')}

Be concise, use emojis sparingly, and include one practical tip. Do NOT use markdown formatting.`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.7,
            });

            return NextResponse.json({
                summary: completion.choices[0]?.message?.content || 'Unable to generate summary.',
                stats,
            });
        } catch {
            return NextResponse.json({
                summary: `Your group "${group.name}" has spent ₹${stats.total.toLocaleString('en-IN')} across ${stats.count} expenses. The top category is ${stats.topCategory}.`,
                stats,
            });
        }
    } catch (error) {
        console.error('Report error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
