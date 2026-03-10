'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function GmailSyncButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const syncStatus = searchParams.get('sync');
        if (syncStatus === 'connected') {
            toast.success('Gmail connected successfully!', {
                description: 'You can now sync your transactions.',
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            });
            // Clean up URL
            router.replace('/dashboard');
        } else if (syncStatus === 'error') {
            toast.error('Failed to connect Gmail', {
                description: 'Please try again.',
                icon: <AlertCircle className="h-4 w-4 text-red-500" />,
            });
            router.replace('/dashboard');
        }
    }, [searchParams, router]);

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sync/gmail', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                if (data.error === 'Gmail not connected' || res.status === 500) {
                    // If likely auth error, redirect to auth (simplified)
                    // In production we should have specific error code
                    if (data.error.includes('not connected') || data.error.includes('No access')) {
                        router.push('/api/sync/gmail/auth');
                        return;
                    }
                }
                throw new Error(data.error || 'Sync failed');
            }

            toast.success('Sync Complete', {
                description: `Found ${data.count} new transactions.`,
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            });

            // Refresh dashboard data
            router.refresh();
            // Force reload to ensure stats update if refresh isn't enough for client-side fetches
            window.location.reload();

        } catch (error: any) {
            console.error('Sync error:', error);
            // If error suggests auth needed, redirect (fallback)
            if (error.message.includes('not connected')) {
                router.push('/api/sync/gmail/auth');
            } else {
                toast.error('Sync Failed', {
                    description: error.message,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleSync}
            disabled={loading}
            variant="outline"
            className="gap-2 bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
        >
            {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
                <Mail className="h-4 w-4" />
            )}
            {loading ? 'Syncing...' : 'Sync Gmail'}
        </Button>
    );
}
