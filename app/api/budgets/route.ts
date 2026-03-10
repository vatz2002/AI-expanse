import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExpenseCategory } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const budgetSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number(),
});

// GET all budgets for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const month = searchParams.get('month') || new Date().getMonth() + 1;
    const year = searchParams.get('year') || new Date().getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month: parseInt(month.toString()),
        year: parseInt(year.toString()),
      },
    });

    // Calculate spent amounts for each budget
    const startDate = new Date(parseInt(year.toString()), parseInt(month.toString()) - 1, 1);
    const endDate = new Date(parseInt(year.toString()), parseInt(month.toString()), 0, 23, 59, 59);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.expense.aggregate({
          where: {
            userId: user.id,
            category: budget.category,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const spentAmount = spent._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount.toNumber();
        const percentage = (spentAmount / budgetAmount) * 100;

        return {
          ...budget,
          amount: budgetAmount,
          spent: spentAmount,
          remaining: budgetAmount - spentAmount,
          percentage: Math.round(percentage * 100) / 100,
          isOverBudget: spentAmount > budgetAmount,
          isWarning: percentage >= 80 && percentage < 100,
        };
      })
    );

    return NextResponse.json(budgetsWithSpent);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

// POST create or update budget
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedData = budgetSchema.parse(body);

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: user.id,
          category: validatedData.category,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
      update: {
        amount: validatedData.amount,
      },
      create: {
        userId: user.id,
        category: validatedData.category,
        amount: validatedData.amount,
        month: validatedData.month,
        year: validatedData.year,
        currency: 'INR',
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}
