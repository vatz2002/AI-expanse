'use server';

import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteGroup(groupId: string) {
    try {
        const { userId } = auth();
        if (!userId) return { error: 'Unauthorized' };

        // Verify user is an admin or creator
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return { error: 'User not found' };

        const membership = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: user.id,
                },
            },
            include: { group: true },
        });

        if (!membership || (membership.role !== 'admin' && membership.group.createdBy !== user.id)) {
            return { error: 'You do not have permission to delete this group' };
        }

        await prisma.group.delete({
            where: { id: groupId },
        });

        revalidatePath('/dashboard/groups');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete group:', error);
        return { error: 'An unexpected error occurred while deleting the group' };
    }
}

export async function removeMember(groupId: string, memberUserId: string) {
    try {
        const { userId } = auth();
        if (!userId) return { error: 'Unauthorized' };

        const clerkUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!clerkUser) return { error: 'User not found' };

        // Self-removal (leaving) or Admin removing someone else
        if (clerkUser.id !== memberUserId) {
            const requesterMembership = await prisma.groupMember.findUnique({
                where: { groupId_userId: { groupId, userId: clerkUser.id } },
            });
            if (!requesterMembership || requesterMembership.role !== 'admin') {
                return { error: 'Only admins can remove other members' };
            }
        }

        await prisma.groupMember.delete({
            where: {
                groupId_userId: {
                    groupId,
                    userId: memberUserId,
                },
            },
        });

        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to remove member:', error);
        return { error: 'An unexpected error occurred while removing the member' };
    }
}

export async function updateMemberRole(groupId: string, memberUserId: string, newRole: 'admin' | 'member') {
    try {
        const { userId } = auth();
        if (!userId) return { error: 'Unauthorized' };

        const clerkUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!clerkUser) return { error: 'User not found' };

        const requesterMembership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: clerkUser.id } },
        });

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return { error: 'Only admins can change roles' };
        }

        await prisma.groupMember.update({
            where: {
                groupId_userId: {
                    groupId,
                    userId: memberUserId,
                },
            },
            data: {
                role: newRole,
            },
        });

        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update member role:', error);
        return { error: 'An unexpected error occurred while updating the member role' };
    }
}

export async function approveMember(groupId: string, memberUserId: string) {
    try {
        const { userId } = auth();
        if (!userId) return { error: 'Unauthorized' };

        const clerkUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!clerkUser) return { error: 'User not found' };

        const requesterMembership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: clerkUser.id } },
        });

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return { error: 'Only admins can approve members' };
        }

        await prisma.groupMember.update({
            where: {
                groupId_userId: {
                    groupId,
                    userId: memberUserId,
                },
            },
            data: {
                status: 'active',
            },
        });

        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to approve member:', error);
        return { error: 'An unexpected error occurred while approving the member' };
    }
}

export async function denyMember(groupId: string, memberUserId: string) {
    try {
        const { userId } = auth();
        if (!userId) return { error: 'Unauthorized' };

        const clerkUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!clerkUser) return { error: 'User not found' };

        const requesterMembership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: clerkUser.id } },
        });

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return { error: 'Only admins can deny members' };
        }

        await prisma.groupMember.delete({
            where: {
                groupId_userId: {
                    groupId,
                    userId: memberUserId,
                },
            },
        });

        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to deny member:', error);
        return { error: 'An unexpected error occurred while denying the member' };
    }
}
