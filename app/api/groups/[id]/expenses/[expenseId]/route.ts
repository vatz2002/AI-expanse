import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
    amount: z.number().positive().optional(),
    description: z.string().min(1).optional(),
    category: z.string().optional(),
    date: z.string().datetime().optional(),
});

// DELETE - Remove an expense
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; expenseId: string } }
) {
    try {
        const user = await requireAuth();

        // Verify user is member and check role
        const membership = await prisma.groupMember.findFirst({
            where: { groupId: params.id, userId: user.id },
        });

        if (!membership) {
            return NextResponse.json({ error: 'Not a member' }, { status: 403 });
        }

        const expense = await prisma.groupExpense.findUnique({
            where: { id: params.expenseId },
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // Only admin or the person who paid can delete
        if (membership.role !== 'admin' && expense.paidBy !== user.id) {
            return NextResponse.json({ error: 'Only admin or expense creator can delete' }, { status: 403 });
        }

        // Delete linked personal expense (auto-synced), splits, then group expense
        await prisma.expense.deleteMany({ where: { groupExpenseId: params.expenseId } });
        await prisma.groupExpenseSplit.deleteMany({ where: { expenseId: params.expenseId } });
        await prisma.groupExpense.delete({ where: { id: params.expenseId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}

// PUT - Update an expense
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; expenseId: string } }
) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const validatedData = updateSchema.parse(body);

        const membership = await prisma.groupMember.findFirst({
            where: { groupId: params.id, userId: user.id },
        });

        if (!membership) {
            return NextResponse.json({ error: 'Not a member' }, { status: 403 });
        }

        const expense = await prisma.groupExpense.findUnique({
            where: { id: params.expenseId },
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        if (membership.role !== 'admin' && expense.paidBy !== user.id) {
            return NextResponse.json({ error: 'Only admin or expense creator can edit' }, { status: 403 });
        }

        const updateData: any = {};
        if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.category !== undefined) updateData.category = validatedData.category;
        if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date);

        // If amount changed, recalculate equal splits
        if (validatedData.amount !== undefined) {
            const groupMembers = await prisma.groupMember.findMany({
                where: { groupId: params.id },
            });

            if (expense.splitType === 'equal') {
                const perPerson = validatedData.amount / groupMembers.length;
                await prisma.groupExpenseSplit.deleteMany({ where: { expenseId: params.expenseId } });
                await prisma.groupExpenseSplit.createMany({
                    data: groupMembers.map(m => ({
                        expenseId: params.expenseId,
                        userId: m.userId,
                        amount: perPerson,
                    })),
                });
            }
        }

        const updated = await prisma.groupExpense.update({
            where: { id: params.expenseId },
            data: updateData,
            include: { splits: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}
