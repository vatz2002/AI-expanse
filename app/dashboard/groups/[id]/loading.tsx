import { Users, Receipt, MessageCircle, Wallet, ArrowLeft, MoreVertical, Link as LinkIcon } from 'lucide-react';

export default function GroupDetailLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">

                {/* ═══════════ Header Skeleton ═══════════ */}
                <div className="mb-5">
                    <div className="flex items-center gap-1.5 mb-3">
                        <ArrowLeft className="h-4 w-4 text-gray-700" />
                        <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-13 h-13 rounded-2xl bg-white/10 animate-pulse flex-shrink-0" style={{ width: 52, height: 52 }}></div>
                            <div className="space-y-2">
                                <div className="h-7 w-48 bg-white/10 rounded-lg animate-pulse"></div>
                                <div className="h-4 w-32 bg-white/5 rounded-md animate-pulse"></div>
                            </div>
                        </div>
                        <div className="h-9 w-24 rounded-lg bg-white/10 border border-white/5 animate-pulse flex-shrink-0"></div>
                    </div>
                </div>

                {/* ═══════════ KPI Strip Skeleton ═══════════ */}
                <div className="mb-5">
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col items-center">
                                <div className="h-6 w-16 bg-white/10 rounded animate-pulse mb-1.5"></div>
                                <div className="h-3 w-12 bg-white/5 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══════════ Tab Bar Skeleton ═══════════ */}
                <div className="mb-5 mt-2">
                    <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`flex-1 h-10 rounded-lg animate-pulse ${i === 1 ? 'bg-indigo-500/20' : 'bg-white/5'}`}></div>
                        ))}
                    </div>
                </div>

                {/* ═══════════ Content Skeleton ═══════════ */}
                <div className="space-y-4">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 h-24 animate-pulse"></div>

                    <div className="space-y-1.5">
                        {[1, 2, 3, 4].map(idx => (
                            <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 h-20 animate-pulse flex justify-between items-center">
                                <div className="flex gap-3 items-center">
                                    <div className="w-8 h-8 rounded-full bg-white/10"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-white/10 rounded"></div>
                                        <div className="h-3 w-20 bg-white/5 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-5 w-16 bg-white/10 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
