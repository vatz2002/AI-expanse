import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        const connection = await prisma.gmailConnection.findUnique({
            where: { userId: user.id },
            select: {
                id: true,
                email: true,
                autoSync: true,
                lastSyncedAt: true,
            },
        });

        return NextResponse.json({
            connected: !!connection,
            settings: connection || null,
        });
    } catch (error) {
        console.error('Error fetching Gmail settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { autoSync } = body;

        if (typeof autoSync !== 'boolean') {
            return NextResponse.json({ error: 'Invalid autoSync value' }, { status: 400 });
        }

        const connection = await prisma.gmailConnection.update({
            where: { userId: user.id },
            data: { autoSync },
        });

        return NextResponse.json(connection);
    } catch (error) {
        console.error('Error updating Gmail settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();

        await prisma.gmailConnection.delete({
            where: { userId: user.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting Gmail:', error);
        return NextResponse.json({ error: 'Failed to disconnect Gmail' }, { status: 500 });
    }
}
