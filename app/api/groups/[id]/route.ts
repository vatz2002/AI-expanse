import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();

        // Check if the user is a member (either active or admin)
        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId: params.id,
                userId: user.id,
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: 'Not authorized to view this group' },
                { status: 403 }
            );
        }

        if (membership.status === 'pending') {
            return NextResponse.json(
                { error: 'PENDING_APPROVAL' },
                { status: 403 }
            );
        }

        const group = await prisma.group.findUnique({
            where: { id: params.id },
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
                    orderBy: {
                        joinedAt: 'desc',
                    },
                },
                _count: {
                    select: {
                        expenses: true,
                        messages: true,
                    },
                },
            },
        });

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error fetching group details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch group details' },
            { status: 500 }
        );
    }
}
