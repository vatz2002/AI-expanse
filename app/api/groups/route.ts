import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const groupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

function generateInviteCode(): string {
  return crypto.randomBytes(8).toString('hex');
}

// GET all groups user is part of
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
            // @ts-ignore
            status: 'active',
          },
        },
      },
      include: {
        members: {
          where: {
            // @ts-ignore
            status: 'active',
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            expenses: true,
            messages: true,
          },
        },
        expenses: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // @ts-ignore
    const groupsWithExpenses = groups.map((group: any) => {
      const totalExpenses = group.expenses.reduce((sum: number, exp: any) =>
        sum + (typeof exp.amount === 'string' ? parseFloat(exp.amount) : Number(exp.amount)),
        0);

      return {
        ...group,
        totalExpenses,
      };
    });

    return NextResponse.json(groupsWithExpenses);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST create a new group
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedData = groupSchema.parse(body);

    const inviteCode = generateInviteCode();

    const group = await prisma.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        createdBy: user.id,
        inviteCode,
        members: {
          create: {
            userId: user.id,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
