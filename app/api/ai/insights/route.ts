import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { formatIndianCurrency } from '@/lib/currency';
import { CATEGORY_LABELS } from '@/lib/categories';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const month = searchParams.get('month') || new Date().getMonth() + 1;
    const year = searchParams.get('year') || new Date().getFullYear();

    const startDate = new Date(parseInt(year.toString()), parseInt(month.toString()) - 1, 1);
    const endDate = new Date(parseInt(year.toString()), parseInt(month.toString()), 0, 23, 59, 59);

    // Get current month expenses by category
    const currentMonthByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    // Get previous month for comparison
    const prevMonthStart = new Date(parseInt(year.toString()), parseInt(month.toString()) - 2, 1);
    const prevMonthEnd = new Date(parseInt(year.toString()), parseInt(month.toString()) - 1, 0, 23, 59, 59);

    const previousMonthByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId: user.id,
        date: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { amount: true },
    });

    // Generate insights
    const insights: string[] = [];

    // Total spending insight
    const totalCurrent = currentMonthByCategory.reduce(
      (sum, cat) => sum + (cat._sum.amount?.toNumber() || 0),
      0
    );
    const totalPrevious = previousMonthByCategory.reduce(
      (sum, cat) => sum + (cat._sum.amount?.toNumber() || 0),
      0
    );

    if (totalCurrent > 0) {
      const change = totalCurrent - totalPrevious;
      const percentChange = totalPrevious > 0 ? (change / totalPrevious) * 100 : 0;

      if (Math.abs(percentChange) > 10) {
        const direction = change > 0 ? 'higher' : 'lower';
        insights.push(
          `Your total spending this month is ${formatIndianCurrency(totalCurrent)}, which is ${Math.abs(Math.round(percentChange))}% ${direction} than last month (${formatIndianCurrency(totalPrevious)}).`
        );
      }
    }

    // Category-specific insights
    for (const current of currentMonthByCategory) {
      const previous = previousMonthByCategory.find(p => p.category === current.category);
      const currentAmount = current._sum.amount?.toNumber() || 0;
      const previousAmount = previous?._sum.amount?.toNumber() || 0;

      if (currentAmount > 0 && previousAmount > 0) {
        const change = currentAmount - previousAmount;
        const percentChange = (change / previousAmount) * 100;

        if (Math.abs(percentChange) > 20) {
          const direction = change > 0 ? 'increased' : 'decreased';
          insights.push(
            `Your ${CATEGORY_LABELS[current.category]} spending ${direction} by ${Math.abs(Math.round(percentChange))}% this month (${formatIndianCurrency(currentAmount)} vs ${formatIndianCurrency(previousAmount)}).`
          );
        }
      }
    }

    // Budget warnings
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month: parseInt(month.toString()),
        year: parseInt(year.toString()),
      },
    });

    for (const budget of budgets) {
      const spent = currentMonthByCategory.find(c => c.category === budget.category);
      const spentAmount = spent?._sum.amount?.toNumber() || 0;
      const budgetAmount = budget.amount.toNumber();
      const percentage = (spentAmount / budgetAmount) * 100;

      if (percentage >= 100) {
        insights.push(
          `⚠️ You've exceeded your ${CATEGORY_LABELS[budget.category]} budget by ${formatIndianCurrency(spentAmount - budgetAmount)}! (${Math.round(percentage)}% of budget used)`
        );
      } else if (percentage >= 80) {
        insights.push(
          `⚠️ You've used ${Math.round(percentage)}% of your ${CATEGORY_LABELS[budget.category]} budget (${formatIndianCurrency(spentAmount)} of ${formatIndianCurrency(budgetAmount)}).`
        );
      }
    }

    // Savings tip
    if (insights.length === 0 || totalCurrent > totalPrevious) {
      insights.push(
        `💡 Tip: Consider setting category-wise budgets to track your spending better. Indians typically spend 40-50% on essentials (groceries, rent, utilities).`
      );
    } else {
      insights.push(
        `🎉 Great job! You're spending less than last month. Keep it up!`
      );
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
