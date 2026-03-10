import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const addMemberSchema = z.object({
  email: z.string().email(),
});

// POST add member to group by email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Verify user is admin of group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: user.id,
        role: 'admin',
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Only admins can add members' },
        { status: 403 }
      );
    }

    const validatedData = addMemberSchema.parse(body);

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: targetUser.id,
      },
    });

    if (existingMember) {
      if (existingMember.status === 'pending') {
        const updatedMember = await prisma.groupMember.update({
          where: { id: existingMember.id },
          data: { status: 'active' },
          include: { user: { select: { name: true, email: true } } }
        });
        return NextResponse.json(updatedMember, { status: 200 });
      }

      return NextResponse.json(
        { error: 'User is already a member of this group' },
        { status: 400 }
      );
    }

    // Add member
    const newMember = await prisma.groupMember.create({
      data: {
        groupId: params.id,
        userId: targetUser.id,
        role: 'member',
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
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}
