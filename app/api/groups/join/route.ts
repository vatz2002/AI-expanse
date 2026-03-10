import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const joinSchema = z.object({
  inviteCode: z.string().min(1),
});

// POST join group via invite code
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedData = joinSchema.parse(body);

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode: validatedData.inviteCode },
      include: {
        members: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = group.members.find(
      (member) => member.userId === user.id
    );

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group', groupId: group.id },
        { status: 400 }
      );
    }

    // Add user to group as pending
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: 'member',
        status: 'pending',
      },
    });

    return NextResponse.json(
      { message: 'Request sent to group admins', groupId: group.id, status: 'pending' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}
