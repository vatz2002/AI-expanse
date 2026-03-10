import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExpenseCategory } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const month = searchParams.get('month') || new Date().getMonth() + 1;
    const year = searchParams.get('year') || new Date().getFullYear();

    const startDate = new Date(parseInt(year.toString()), parseInt(month.toString()) - 1, 1);
    const endDate = new Date(parseInt(year.toString()), parseInt(month.toString()), 0, 23, 59, 59);

    // Total spent this month
    const totalSpent = await prisma.expense.aggregate({
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

    // Category-wise breakdown
    const categoryBreakdown = await prisma.expense.groupBy({
      by: ['category'],
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
      _count: {
        id: true,
      },
    });

    // Previous month comparison
    const prevMonthStart = new Date(parseInt(year.toString()), parseInt(month.toString()) - 2, 1);
    const prevMonthEnd = new Date(parseInt(year.toString()), parseInt(month.toString()) - 1, 0, 23, 59, 59);

    const prevMonthTotal = await prisma.expense.aggregate({
      where: {
        userId: user.id,
        date: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate trend
    const currentTotal = totalSpent._sum.amount?.toNumber() || 0;
    const previousTotal = prevMonthTotal._sum.amount?.toNumber() || 0;
    const percentageChange = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    // Recent expenses
    const recentExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    // Daily spending for current month
    const allExpensesThisMonth = await prisma.expense.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        date: true,
        description: true,
      },
    });

    const daysInMonth = endDate.getDate();
    const dailySpending: { day: number; amount: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayTotal = allExpensesThisMonth
        .filter(e => new Date(e.date).getDate() === d)
        .reduce((sum, e) => sum + (e.amount as any).toNumber(), 0);
      dailySpending.push({ day: d, amount: dayTotal });
    }

    // Top merchants (by description)
    const merchantMap = new Map<string, number>();
    allExpensesThisMonth.forEach(e => {
      const desc = (e.description || '').trim();
      if (desc) {
        merchantMap.set(desc, (merchantMap.get(desc) || 0) + (e.amount as any).toNumber());
      }
    });
    const topMerchants = Array.from(merchantMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    // Budget data for dashboard
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month: parseInt(month.toString()),
        year: parseInt(year.toString()),
      },
    });

    const budgetProgress = await Promise.all(
      budgets.map(async (budget) => {
        const spent = categoryBreakdown.find(c => c.category === budget.category);
        const spentAmount = spent?._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount.toNumber();
        const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
        return {
          category: budget.category,
          budgetAmount,
          spentAmount,
          percentage: Math.round(percentage * 100) / 100,
          isOverBudget: spentAmount > budgetAmount,
        };
      })
    );

    return NextResponse.json({
      totalSpent: currentTotal,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category,
        amount: item._sum.amount?.toNumber() || 0,
        count: item._count.id,
      })),
      trend: {
        current: currentTotal,
        previous: previousTotal,
        percentageChange: Math.round(percentageChange * 100) / 100,
        isIncrease: percentageChange > 0,
      },
      recentExpenses,
      dailySpending,
      topMerchants,
      budgetProgress,
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense statistics' },
      { status: 500 }
    );
  }
}
