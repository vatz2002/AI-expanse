'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatIndianCurrency } from '@/lib/currency';
import { getCategoryIcon } from '@/lib/categories';
import {
    Receipt,
    CheckCircle,
    UserPlus,
    Clock,
    Loader2,
} from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'expense' | 'settlement' | 'member_joined';
    groupName: string;
    groupId: string;
    description: string;
    amount?: number;
    category?: string;
    userName: string;
    createdAt: string;
}

const ICONS = {
    expense: Receipt,
    settlement: CheckCircle,
    member_joined: UserPlus,
};

const COLORS = {
    expense: 'text-indigo-400 bg-indigo-500/10',
    settlement: 'text-emerald-400 bg-emerald-500/10',
    member_joined: 'text-amber-400 bg-amber-500/10',
};

function timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ActivityFeed() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const res = await fetch('/api/activity', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-gray-600">
                <Clock className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                <p className="text-sm">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {activities.slice(0, 10).map((activity, idx) => {
                const Icon = ICONS[activity.type] || Receipt;
                const colorClass = COLORS[activity.type] || COLORS.expense;
                return (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                    >
                        <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                            <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 leading-snug">
                                <span className="font-medium text-gray-200">{activity.userName}</span>
                                {activity.type === 'expense' && (
                                    <> added <span className="font-medium text-white">{formatIndianCurrency(activity.amount || 0)}</span> for {activity.description}</>
                                )}
                                {activity.type === 'settlement' && (
                                    <> settled <span className="font-medium text-emerald-400">{formatIndianCurrency(activity.amount || 0)}</span></>
                                )}
                                {activity.type === 'member_joined' && (
                                    <> joined the group</>
                                )}
                            </p>
                            <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1.5">
                                <span>{activity.groupName}</span>
                                <span>·</span>
                                <span>{timeAgo(activity.createdAt)}</span>
                            </p>
                        </div>
                        {activity.category && (
                            <span className="text-lg flex-shrink-0">{getCategoryIcon(activity.category as any)}</span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
