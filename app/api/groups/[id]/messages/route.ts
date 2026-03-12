import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const messageSchema = z.object({
  message: z.string().min(1),
});

// GET group messages
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

    const messages = await prisma.groupMessage.findMany({
      where: {
        groupId: params.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100, // Last 100 messages
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST send message
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

    const validatedData = messageSchema.parse(body);

    const message = await prisma.groupMessage.create({
      data: {
        groupId: params.id,
        userId: user.id,
        message: validatedData.message,
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

    // Notify other group members
    try {
      const group = await prisma.group.findUnique({
        where: { id: params.id },
        include: {
          members: {
            select: { userId: true },
          },
        },
      });

      if (group) {
        const senderName = message.user.name || message.user.email || 'A member';
        const groupMembers = group.members.filter(m => m.userId !== user.id);
        
        if (groupMembers.length > 0) {
          await prisma.notification.createMany({
            data: groupMembers.map(m => ({
              userId: m.userId,
              type: 'group_message',
              message: `${senderName} sent a message in ${group.name}: "${validatedData.message.substring(0, 50)}${validatedData.message.length > 50 ? '...' : ''}"`,
              link: `/dashboard/groups/${params.id}`,
            })),
          });
        }
      }
    } catch (notifyError) {
      console.error('Failed to create message notifications:', notifyError);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
