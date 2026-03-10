import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExpenseCategory } from '@prisma/client';
import { z } from 'zod';
import { sendExpenseNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

const groupExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1),
  date: z.string().datetime(),
  paidBy: z.string(),
  splitType: z.enum(['equal', 'custom']).default('equal'),
  customSplits: z.array(z.object({
    userId: z.string(),
    amount: z.number().positive(),
  })).optional(),
});

// GET group expenses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Verify user is member of group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    const expenses = await prisma.groupExpense.findMany({
      where: {
        groupId: params.id,
      },
      include: {
        splits: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching group expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group expenses' },
      { status: 500 }
    );
  }
}

// POST create group expense
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Verify user is member of group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    const validatedData = groupExpenseSchema.parse(body);

    // Get group and all its members with user details for email
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const groupMembers = group.members;

    // Calculate splits
    let splits: { userId: string; amount: number }[] = [];

    if (validatedData.splitType === 'custom' && validatedData.customSplits) {
      // Validate custom splits
      const totalSplit = validatedData.customSplits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplit - validatedData.amount) > 0.01) {
        return NextResponse.json(
          { error: 'Custom splits must add up to total amount' },
          { status: 400 }
        );
      }
      splits = validatedData.customSplits;
    } else {
      // Equal split
      const perPersonAmount = validatedData.amount / groupMembers.length;
      splits = groupMembers.map(member => ({
        userId: member.userId,
        amount: perPersonAmount,
      }));
    }

    // Create expense with splits
    const expense = await prisma.groupExpense.create({
      data: {
        groupId: params.id,
        amount: validatedData.amount,
        category: validatedData.category,
        description: validatedData.description,
        date: new Date(validatedData.date),
        paidBy: validatedData.paidBy,
        splitType: validatedData.splitType,
        currency: 'INR',
        splits: {
          create: splits,
        },
      },
      include: {
        splits: true,
      },
    });

    // ── Auto-sync: Create personal expense for the payer ──
    // This makes the group expense show up in the payer's personal dashboard, budget, and expense list.
    // groupExpenseId is unique, so duplicates are impossible.
    try {
      await prisma.expense.create({
        data: {
          userId: validatedData.paidBy,
          amount: validatedData.amount,
          currency: 'INR',
          category: validatedData.category,
          description: `[${group.name}] ${validatedData.description}`,
          date: new Date(validatedData.date),
          groupExpenseId: expense.id,
          aiCategorized: false,
        },
      });
    } catch (syncError) {
      // If personal expense already exists (duplicate groupExpenseId), ignore
      console.error('Personal expense sync (non-critical):', syncError);
    }

    // Send email notifications asynchronously (do not await to avoid blocking response)
    const paidByUser = groupMembers.find(m => m.userId === validatedData.paidBy)?.user;
    const paidByName = paidByUser?.name || paidByUser?.email || 'A member';

    // Get emails of all members to notify them
    // Note: this assumes user.email exists. If using Clerk's full user object it might be different,
    // but typically the DB user model stores email.
    const memberEmails = groupMembers
      .map(m => m.user.email)
      .filter((email): email is string => Boolean(email));

    if (memberEmails.length > 0) {
      sendExpenseNotification({
        to: memberEmails,
        groupName: group.name,
        expenseAmount: `₹${validatedData.amount.toFixed(2)}`,
        expenseDescription: validatedData.description,
        expenseCategory: validatedData.category.replace('_', ' '),
        paidBy: paidByName,
        groupId: params.id,
        date: new Date(validatedData.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
      }).catch(err => console.error('Failed to send notification:', err));
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating group expense:', error);
    return NextResponse.json(
      { error: 'Failed to create group expense' },
      { status: 500 }
    );
  }
}
