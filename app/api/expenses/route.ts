import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExpenseCategory } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1),
  date: z.string().datetime(),
  receiptUrl: z.string().url().optional(),
  receiptText: z.string().optional(),
});

// GET all expenses for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const category = searchParams.get('category');

    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        ...(category ? { category: category as ExpenseCategory } : {}),
        ...dateFilter,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST create a new expense
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedData = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        amount: validatedData.amount,
        category: validatedData.category,
        description: validatedData.description,
        date: new Date(validatedData.date),
        receiptUrl: validatedData.receiptUrl,
        receiptText: validatedData.receiptText,
        currency: 'INR',
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
