'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { formatIndianCurrency, formatCompactIndianCurrency } from '@/lib/currency';
import { formatRelativeDate } from '@/lib/date';
import {
  Users,
  Plus,
  Copy,
  X,
  Crown,
  ArrowRight,
  Search,
  Link as LinkIcon,
  Check,
  Trash2,
  Hash,
  Wallet,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

/* ──────────── Types ──────────── */

interface GroupMember {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  totalExpenses: number;
  isAdmin: boolean;
}

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  totalExpenses: number;
  members: GroupMember[];
  isAdmin: boolean;
}

/* ──────────── Animation ──────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ──────────── Skeleton ──────────── */

function GroupsSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
    </div>
  );
}

/* ──────────── Main Component ──────────── */

export default function GroupsPage() {
  const { user } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/groups', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      const formattedGroups: Group[] = data.map((g: any) => ({
        id: g.id,
        name: g.name,
        inviteCode: g.inviteCode,
        createdAt: g.createdAt,
        memberCount: g._count?.members || g.members?.length || 0,
        totalExpenses: g.totalExpenses || 0,
        isAdmin: g.members?.some((m: any) => m.userId === user?.id && m.role === 'admin') || false,
        members: g.members?.map((m: any) => ({
          id: m.id,
          name: m.user?.name || 'Unknown',
          email: m.user?.email || '',
          imageUrl: m.user?.imageUrl || null,
          totalExpenses: m.totalExpenses || 0,
          isAdmin: m.role === 'admin',
        })) || []
      }));
      setGroups(formattedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setCreating(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName }),
      });
      if (response.ok) {
        toast.success('Group created!');
        setGroupName('');
        setShowCreate(false);
        fetchGroups();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to create group');
      }
    } catch (error) {
      toast.error('Error creating group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });
      if (response.ok) {
        toast.success('Joined group!');
        setInviteCode('');
        setShowJoin(false);
        fetchGroups();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to join group');
      }
    } catch (error) {
      toast.error('Error joining group');
    } finally {
      setJoining(false);
    }
  };

  const copyInvite = (code: string, groupId: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(groupId);
      toast.success('Invite code copied!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const totalGroups = groups.length;
  const totalMembers = groups.reduce((s, g) => s + g.memberCount, 0);
  const totalGroupExpenses = groups.reduce((s, g) => s + g.totalExpenses, 0);

  if (loading) return <GroupsSkeleton />;

  const kpis = [
    { label: 'Groups', value: totalGroups.toString(), icon: Users, color: 'text-violet-400', bg: 'from-violet-500/20 to-indigo-500/20' },
    { label: 'Members', value: totalMembers.toString(), icon: UserPlus, color: 'text-sky-400', bg: 'from-sky-500/20 to-blue-500/20' },
    { label: 'Total Expenses', value: formatCompactIndianCurrency(totalGroupExpenses), icon: Wallet, color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20' },
  ];

  return (
    <div className="page-bg-subtle">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-2">
              <Users className="h-7 w-7 text-fuchsia-400" /> Groups
            </h1>
            <p className="text-sm text-gray-500 mt-1">Split expenses with friends and family</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
              variant="outline"
              className="rounded-xl border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> Join
            </Button>
            <Button
              onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
              className="gradient-primary text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all rounded-xl px-5 btn-glow"
            >
              <Plus className="mr-2 h-4 w-4" /> Create
            </Button>
          </div>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <div className="relative overflow-hidden glass-card rounded-xl p-3.5 group card-hover-glow transition-all">
                <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${kpi.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                <div className="relative flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.bg}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-display font-bold text-white leading-tight">{kpi.value}</p>
                    <p className="text-[11px] text-gray-500">{kpi.label}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create / Join Forms */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-card gradient-border rounded-2xl p-5">
                <h3 className="text-sm font-display font-semibold text-white mb-4">Create New Group</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Weekend Trip, Roommates"
                    className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  <Button
                    onClick={handleCreate}
                    disabled={!groupName.trim() || creating}
                    className="gradient-primary text-white rounded-xl px-5 disabled:opacity-40"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          {showJoin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-card gradient-border rounded-2xl p-5">
                <h3 className="text-sm font-display font-semibold text-white mb-4">Join a Group</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                    className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  />
                  <Button
                    onClick={handleJoin}
                    disabled={!inviteCode.trim() || joining}
                    className="gradient-primary text-white rounded-xl px-5 disabled:opacity-40"
                  >
                    {joining ? 'Joining...' : 'Join'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Cards */}
        {groups.length === 0 ? (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-fuchsia-500/10 mb-4">
                <Users className="h-7 w-7 text-fuchsia-400/60" />
              </div>
              <h3 className="text-lg font-display font-semibold text-gray-300 mb-1">No groups yet</h3>
              <p className="text-sm text-gray-600 mb-5 max-w-xs mx-auto">
                Create a group to track shared expenses with friends.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowCreate(true)} className="gradient-primary text-white rounded-xl px-5">
                  <Plus className="mr-2 h-4 w-4" /> Create Group
                </Button>
                <Button onClick={() => setShowJoin(true)} variant="outline" className="rounded-xl border-white/10 text-gray-400 hover:text-gray-200">
                  <LinkIcon className="mr-2 h-4 w-4" /> Join Group
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group, idx) => (
              <motion.div key={group.id} custom={3 + idx} variants={fadeUp} initial="hidden" animate="visible">
                <Link href={`/dashboard/groups/${group.id}`}>
                  <div className="glass-card rounded-2xl p-5 card-hover-glow card-purple-glow transition-all group cursor-pointer h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base font-display font-semibold text-white group-hover:text-violet-300 transition-colors">
                          {group.name}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">{formatRelativeDate(group.createdAt)}</p>
                      </div>
                      {group.isAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          <Crown className="h-2.5 w-2.5" /> Admin
                        </span>
                      )}
                    </div>

                    {/* Members avatars */}
                    <div className="flex items-center mb-4">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 4).map((member, mIdx) => (
                          <div
                            key={member.id}
                            className="w-8 h-8 rounded-full border-2 border-[#0a0b14] flex items-center justify-center text-xs font-medium overflow-hidden"
                            style={{
                              backgroundColor: `hsl(${(mIdx * 60 + 200) % 360}, 60%, 25%)`,
                            }}
                          >
                            {member.imageUrl ? (
                              <img src={member.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white">{member.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        ))}
                        {group.memberCount > 4 && (
                          <div className="w-8 h-8 rounded-full border-2 border-[#0a0b14] bg-white/[0.06] flex items-center justify-center text-[10px] text-gray-400 font-medium">
                            +{group.memberCount - 4}
                          </div>
                        )}
                      </div>
                      <span className="ml-3 text-xs text-gray-500">
                        {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                      <div className="text-xs text-gray-500">
                        Total: <span className="text-gray-300 font-medium">{formatIndianCurrency(group.totalExpenses)}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copyInvite(group.inviteCode, group.id);
                        }}
                        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-violet-400 transition-colors bg-white/[0.03] hover:bg-violet-500/10 px-2 py-1 rounded-lg"
                      >
                        {copiedId === group.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Invite
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
