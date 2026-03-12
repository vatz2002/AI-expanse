'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Mail, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Unlink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface GmailSettings {
// ... rest of the file
    connected: boolean;
    settings: {
        email: string;
        autoSync: boolean;
        lastSyncedAt: string | null;
    } | null;
}

export default function GmailSyncSettings() {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [data, setData] = useState<GmailSettings | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/sync/gmail/settings');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch Gmail settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMainToggle = async (checked: boolean) => {
        if (checked) {
            if (!data?.connected) {
                // Connection required
                handleConnect();
            } else {
                // Enable sync
                handleToggleAutoSync(true);
            }
        } else {
            // User wants it OFF -> Disconnect (as per "not connected" requirement)
            handleDisconnect();
        }
    };

    const handleToggleAutoSync = async (checked: boolean) => {
        setUpdating(true);
        try {
            const res = await fetch('/api/sync/gmail/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoSync: checked }),
            });

            if (res.ok) {
                setData(prev => prev ? {
                    ...prev,
                    settings: prev.settings ? { ...prev.settings, autoSync: checked } : null
                } : null);
                toast.success(checked ? 'Auto-detection enabled' : 'Auto-detection disabled');
            } else {
                throw new Error('Failed to update settings');
            }
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setUpdating(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/sync/gmail', { method: 'POST' });
            const result = await res.json();

            if (res.ok) {
                toast.success('Sync Complete', {
                    description: `Found ${result.count} new transactions.`,
                });
                fetchSettings();
                router.refresh();
            } else if (result.error?.includes('not connected')) {
                handleConnect();
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error: any) {
            toast.error('Sync Failed', { description: error.message });
        } finally {
            setSyncing(false);
        }
    };

    const handleConnect = () => {
        router.push('/api/sync/gmail/auth');
    };

    const handleDisconnect = async () => {
        // We don't necessarily need a confirm if it's a toggle, but it's safer
        // Actually for a toggle behavior, usually it's immediate or has a subtle check
        setUpdating(true);
        try {
            const res = await fetch('/api/sync/gmail/settings', { method: 'DELETE' });
            if (res.ok) {
                setData({ connected: false, settings: null });
                toast.success('Gmail Disconnected');
                router.refresh();
            }
        } catch (error) {
            toast.error('Failed to disconnect');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-card rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-48 bg-white/5 rounded mb-4" />
                <div className="h-10 w-full bg-white/5 rounded" />
            </div>
        );
    }

    const isActive = data?.connected && data.settings?.autoSync;

    return (
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
            <div className="p-5 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isActive ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-gray-500"
                    )}>
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-display font-semibold text-white">Gmail Transaction Sync</h3>
                        <p className="text-xs text-gray-400">Auto-detect bank alerts in your inbox</p>
                    </div>
                </div>
                <Switch
                    checked={isActive}
                    onCheckedChange={handleMainToggle}
                    disabled={updating}
                />
            </div>

            <div className="p-6">
                {data?.connected ? (
                    <div className="space-y-6">
                        {/* Status Label */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span>Connected as <span className="text-white font-medium">{data.settings?.email}</span></span>
                            </div>
                            <Button
                                onClick={handleSync}
                                disabled={syncing || !isActive}
                                variant="ghost"
                                size="sm"
                                className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 h-8 rounded-lg"
                            >
                                <RefreshCw className={cn("h-3.5 w-3.5 mr-2", syncing && "animate-spin")} />
                                Sync Now
                            </Button>
                        </div>

                        {isActive && (
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex gap-3">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-emerald-200/60 leading-relaxed">
                                    Automatic syncing is active. New transactions from verified bank senders will appear on your dashboard automatically.
                                </p>
                            </div>
                        )}

                        {!isActive && (
                            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex gap-3">
                                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-gray-500 leading-relaxed">
                                    Syncing is currently disabled. Toggle the switch above to enable automatic detection.
                                </p>
                            </div>
                        )}
                        
                        <div className="pt-2 flex justify-start">
                             <p className="text-[10px] text-gray-600">
                                Last sync: {data.settings?.lastSyncedAt 
                                    ? new Date(data.settings.lastSyncedAt).toLocaleString('en-IN') 
                                    : 'Never'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-400 mb-2">
                            Integrate your Gmail to automatically track expenses.
                        </p>
                        <p className="text-[11px] text-gray-600 mb-6">
                            Turn on the sync switch to connect your account.
                        </p>
                        <div className="flex justify-center">
                             <div className="p-8 rounded-full bg-white/[0.01] border border-dashed border-white/10">
                                <Mail className="h-10 w-10 text-white/10" />
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
