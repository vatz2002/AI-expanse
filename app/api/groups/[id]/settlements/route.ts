import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const settlementSchema = z.object({
    fromUserId: z.string().min(1),
    toUserId: z.string().min(1),
    amount: z.number().positive(),
    note: z.string().optional(),
});

// GET /api/groups/[id]/settlements — list all settlements for the group
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();

        // Verify membership
        const membership = await prisma.groupMember.findFirst({
            where: { groupId: params.id, userId: user.id },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Not a member' }, { status: 403 });
        }

        const settlements = await prisma.settlement.findMany({
            where: { groupId: params.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(settlements);
    } catch (error) {
        console.error('Error fetching settlements:', error);
        return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
    }
}

// POST /api/groups/[id]/settlements — record a new settlement
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();

        // Verify membership
        const membership = await prisma.groupMember.findFirst({
            where: { groupId: params.id, userId: user.id },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Not a member' }, { status: 403 });
        }

        const body = await request.json();
        const data = settlementSchema.parse(body);

        // Verify both users are members
        const fromMember = await prisma.groupMember.findFirst({
            where: { groupId: params.id, userId: data.fromUserId },
        });
        const toMember = await prisma.groupMember.findFirst({
            where: { groupId: params.id, userId: data.toUserId },
        });
        if (!fromMember || !toMember) {
            return NextResponse.json({ error: 'Both users must be group members' }, { status: 400 });
        }

        const settlement = await prisma.settlement.create({
            data: {
                groupId: params.id,
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                amount: data.amount,
                note: data.note || null,
            },
        });

        return NextResponse.json(settlement, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
        }
        console.error('Error creating settlement:', error);
        return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 });
    }
}
