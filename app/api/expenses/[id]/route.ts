import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExpenseCategory } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  description: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional(),
  receiptText: z.string().optional(),
});

// GET single expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const expense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

// PATCH update expense
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedData = updateExpenseSchema.parse(body);

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    const expense = await prisma.expense.update({
      where: {
        id: params.id,
      },
      data: {
        ...(validatedData.amount && { amount: validatedData.amount }),
        ...(validatedData.category && { category: validatedData.category }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.date && { date: new Date(validatedData.date) }),
        ...(validatedData.receiptUrl !== undefined && { receiptUrl: validatedData.receiptUrl }),
        ...(validatedData.receiptText !== undefined && { receiptText: validatedData.receiptText }),
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
