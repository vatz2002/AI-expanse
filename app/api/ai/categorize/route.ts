import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { categorizeExpense } from '@/lib/ai-categorization';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const categorizeSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();

    const validatedData = categorizeSchema.parse(body);

    const result = categorizeExpense(
      validatedData.description,
      validatedData.amount
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error categorizing expense:', error);
    return NextResponse.json(
      { error: 'Failed to categorize expense' },
      { status: 500 }
    );
  }
}
