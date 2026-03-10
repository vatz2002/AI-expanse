'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { formatIndianCurrency, formatCompactIndianCurrency } from '@/lib/currency';
import { formatIndianDate } from '@/lib/date';
import { getCategoryLabel, getCategoryIcon, getCategoryColor, getAllCategories } from '@/lib/categories';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ArrowLeft,
  Send,
  Plus,
  Users,
  Copy,
  Check,
  Link as LinkIcon,
  Receipt,
  MessageCircle,
  UserPlus,
  Wallet,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Share2,
  Crown,
  ArrowRightLeft,
  ArrowRight,
  X,
  Loader2,
  PieChart,
  Sparkles,
  CheckCircle,
  Clock,
  Trash2,
  AlertTriangle,
  UserMinus,
  Shield,
  ShieldAlert,
  MoreVertical,
  Search,
  Filter,
  Edit3,
  Trophy,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExpenseCategory } from '@prisma/client';
import { deleteGroup, removeMember, updateMemberRole, approveMember, denyMember } from '@/app/actions/group';
import { useUser } from '@clerk/nextjs';
import confetti from 'canvas-confetti';

/* ──────────── Types ──────────── */

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { name: string | null; email: string };
}

interface Split {
  id: string;
  userId: string;
  amount: string | number;
}

interface GroupExpense {
  id: string;
  amount: string | number;
  category: ExpenseCategory;
  description: string;
  date: string;
  paidBy: string;
  splitType: string;
  splits: Split[];
}

interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: string | number;
  note?: string;
  createdAt: string;
}

interface Message {
  id: string;
  message: string;
  createdAt: string;
  user: { name: string | null; email: string };
  userId: string;
}

/* ──────────── Helpers ──────────── */

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-pink-500 to-fuchsia-600',
  'from-amber-500 to-yellow-600',
];

const avatarColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];

/* ──────────── Page ──────────── */

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'chat' | 'balances' | 'members'>('expenses');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Settlement state
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settleModal, setSettleModal] = useState<{ from: string; to: string; amount: number } | null>(null);
  const [settleNote, setSettleNote] = useState('');
  const [settleLoading, setSettleLoading] = useState(false);

  // Group Management
  const router = useRouter();
  const { user } = useUser();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');

  // Delete expense
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Monthly Report
  const [monthlyReport, setMonthlyReport] = useState<{ summary: string; stats: any } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [activePieIdx, setActivePieIdx] = useState<number | null>(null);

  const isAdmin = members.some(m => m.user?.email === user?.primaryEmailAddress?.emailAddress && m.role === 'admin');

  const fetchGroup = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}`, { cache: 'no-store' });
      const currentGroup = await response.json();
      if (currentGroup && !currentGroup.error) {
        setGroup(currentGroup);
        setMembers(currentGroup.members || []);
      } else if (currentGroup?.error === 'PENDING_APPROVAL') {
        setGroup({ isPending: true });
      } else if (currentGroup?.error) {
        setGroup({ isError: true, message: currentGroup.error });
      }
    } catch (error) { console.error('Error fetching group:', error); }
  }, [params.id]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}/messages`, { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (error) { console.error('Error fetching messages:', error); }
  }, [params.id]);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}/expenses`, { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data)) setExpenses(data);
    } catch (error) { console.error('Error fetching expenses:', error); }
  }, [params.id]);

  const fetchSettlements = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}/settlements`, { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data)) setSettlements(data);
    } catch (error) { console.error('Error fetching settlements:', error); }
  }, [params.id]);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchGroup(), fetchMessages(), fetchExpenses(), fetchSettlements()]);
    setLoading(false);
  }, [fetchGroup, fetchMessages, fetchExpenses, fetchSettlements]);

  useEffect(() => { fetchData(); const interval = setInterval(fetchMessages, 5000); return () => clearInterval(interval); }, [fetchData, fetchMessages]);
  useEffect(() => { if (activeTab === 'chat') scrollToBottom(); }, [messages, activeTab]);

  /* ── Actions ── */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      await fetch(`/api/groups/${params.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: newMessage }) });
      setNewMessage('');
      fetchMessages();
    } catch (error) { console.error('Error:', error); }
    finally { setSendingMessage(false); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberLoading(true); setError('');
    try {
      const response = await fetch(`/api/groups/${params.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newMemberEmail }) });
      const data = await response.json();
      if (response.ok) { setNewMemberEmail(''); await fetchGroup(); }
      else { setError(data.error || 'Failed to add member'); }
    } catch (error) { setError('Failed to add member'); }
    finally { setAddMemberLoading(false); }
  };

  const getInviteLink = () => group?.inviteCode ? `${window.location.origin}/dashboard/groups/join?code=${group.inviteCode}` : '';
  const copyInviteLink = () => {
    const link = getInviteLink();
    if (!link) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link);
    } else {
      // Fallback for non-HTTPS (like local IP testing on mobile)
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      document.body.prepend(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (error) {
        console.error('Fallback copy failed', error);
      } finally {
        textArea.remove();
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareNative = async () => {
    const link = getInviteLink();
    if (!link) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${group?.name}`, url: link });
      } catch (err) {
        // If user actively cancels the share dialog, do not copy automatically as it's unexpected
        // Only fallback if the error is not an abort error
        if (err instanceof Error && err.name !== 'AbortError') {
          copyInviteLink();
        }
      }
    } else {
      copyInviteLink();
    }
  };
  const shareViaWhatsApp = () => { const link = getInviteLink(); if (!link) return; window.open(`https://wa.me/?text=${encodeURIComponent(`Join "${group?.name}": ${link}`)}`, '_blank'); };
  const shareViaTelegram = () => { const link = getInviteLink(); if (!link) return; window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Join "${group?.name}"`)}`, '_blank'); };
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const getMemberName = (userId: string) => { const m = members.find(m => m.userId === userId); return m?.user.name || m?.user?.email || 'Unknown'; };
  const getMemberInitial = (userId: string) => (getMemberName(userId)[0]?.toUpperCase() || 'U');
  const getMemberIndex = (userId: string) => { const idx = members.findIndex(m => m.userId === userId); return idx >= 0 ? idx : 0; };

  const handleDeleteGroup = async () => {
    if (!isAdmin) return;
    setIsDeleting(true);
    const res = await deleteGroup(params.id);
    setIsDeleting(false);
    if (res?.error) {
      alert(res.error);
    } else {
      router.push('/dashboard/groups');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) return;
    if (confirm('Are you sure you want to remove this member?')) {
      setMemberActionLoading(memberId);
      const res = await removeMember(params.id, memberId);
      setMemberActionLoading(null);
      if (res?.error) alert(res.error);
      else await fetchGroup();
    }
  };

  const handleUpdateRole = async (memberUserId: string, currentRole: string) => {
    if (!isAdmin) return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    if (confirm(`Are you sure you want to make this user a ${newRole}?`)) {
      setMemberActionLoading(memberUserId + '-role');
      const res = await updateMemberRole(params.id, memberUserId, newRole);
      setMemberActionLoading(null);
      if (res?.error) alert(res.error);
      else await fetchGroup();
    }
  };

  const handleApproveMember = async (memberId: string) => {
    if (!isAdmin) return;
    setMemberActionLoading(memberId + '-approve');
    const res = await approveMember(params.id, memberId);
    setMemberActionLoading(null);
    if (res?.error) alert(res.error);
    else await fetchGroup();
  };

  const handleDenyMember = async (memberId: string) => {
    if (!isAdmin) return;
    setMemberActionLoading(memberId + '-deny');
    const res = await denyMember(params.id, memberId);
    setMemberActionLoading(null);
    if (res?.error) alert(res.error);
    else await fetchGroup();
  };

  /* ── Export CSV ── */
  const handleExport = async () => {
    try {
      const res = await fetch(`/api/groups/${params.id}/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${group?.name || 'expenses'}-export.csv`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch { alert('Failed to export'); }
  };

  /* ── Monthly Report ── */
  const fetchMonthlyReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/groups/${params.id}/report`, { cache: 'no-store' });
      const data = await res.json();
      setMonthlyReport(data);
    } catch { /* ignore */ }
    finally { setReportLoading(false); }
  };

  /* ── Settlement handler ── */
  const handleSettleUp = async () => {
    if (!settleModal) return;
    setSettleLoading(true);
    try {
      const res = await fetch(`/api/groups/${params.id}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: settleModal.from,
          toUserId: settleModal.to,
          amount: settleModal.amount,
          note: settleNote.trim() || undefined,
        }),
      });
      if (res.ok) {
        setSettleModal(null);
        setSettleNote('');
        // 🎊 Confetti!
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#8b5cf6', '#6366f1', '#a78bfa', '#34d399', '#fbbf24'] });
        await Promise.all([fetchSettlements(), fetchExpenses()]);
      }
    } catch (error) { console.error('Settlement error:', error); }
    finally { setSettleLoading(false); }
  };

  /* ── Balance calculations (includes settlements) ── */
  const calculateBalances = () => {
    const balances: Record<string, number> = {};
    members.forEach(m => { balances[m.userId] = 0; });
    expenses.forEach(expense => {
      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
      if (balances[expense.paidBy] !== undefined) balances[expense.paidBy] += amount;
      expense.splits?.forEach(split => {
        const splitAmount = typeof split.amount === 'string' ? parseFloat(split.amount) : split.amount;
        if (balances[split.userId] !== undefined) balances[split.userId] -= splitAmount;
      });
    });
    // Factor in settlements
    settlements.forEach(s => {
      const amt = typeof s.amount === 'string' ? parseFloat(s.amount) : s.amount;
      if (balances[s.fromUserId] !== undefined) balances[s.fromUserId] += amt; // payer's debt reduces
      if (balances[s.toUserId] !== undefined) balances[s.toUserId] -= amt; // receiver's credit reduces
    });
    return balances;
  };

  const calculateSettlements = () => {
    const balances = calculateBalances();
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];
    Object.entries(balances).forEach(([userId, balance]) => {
      if (balance < -0.01) debtors.push({ userId, amount: -balance });
      else if (balance > 0.01) creditors.push({ userId, amount: balance });
    });
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    const settlements: { from: string; to: string; amount: number }[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.min(debtors[di].amount, creditors[ci].amount);
      if (amount > 0.01) settlements.push({ from: debtors[di].userId, to: creditors[ci].userId, amount });
      debtors[di].amount -= amount;
      creditors[ci].amount -= amount;
      if (debtors[di].amount < 0.01) di++;
      if (creditors[ci].amount < 0.01) ci++;
    }
    return settlements;
  };

  /* ── Category breakdown ── */
  const categoryBreakdown = () => {
    const map = new Map<ExpenseCategory, number>();
    expenses.forEach(e => {
      const amt = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
      map.set(e.category, (map.get(e.category) || 0) + amt);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const totalGroupSpending = expenses.reduce((sum, e) => sum + (typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount), 0);
  const avgPerPerson = members.length > 0 ? totalGroupSpending / members.length : 0;

  /* ── Delete expense handler ── */
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    setDeletingExpenseId(expenseId);
    try {
      const res = await fetch(`/api/groups/${params.id}/expenses/${expenseId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchExpenses();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete expense');
      }
    } catch { alert('Failed to delete expense'); }
    finally { setDeletingExpenseId(null); }
  };

  /* ── Filtered expenses ── */
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = searchQuery.trim() === '' || e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  /* ── Leaderboard ── */
  const leaderboard = members
    .map(m => {
      const spent = expenses.filter(e => e.paidBy === m.userId).reduce((sum, e) => sum + (typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount), 0);
      return { userId: m.userId, name: m.user?.name || m.user?.email || 'Unknown', spent };
    })
    .sort((a, b) => b.spent - a.spent);

  /* ── Group expenses by date (uses filteredExpenses) ── */
  const groupExpensesByDate = () => {
    const groups: Record<string, GroupExpense[]> = {};
    filteredExpenses.forEach(e => {
      const d = new Date(e.date);
      const today = new Date();
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      let label: string;
      if (d.toDateString() === today.toDateString()) label = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
      else label = formatIndianDate(e.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(e);
    });
    return Object.entries(groups);
  };

  const tabs = [
    { id: 'expenses' as const, label: 'Expenses', icon: Receipt, count: expenses.length },
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle, count: messages.length },
    { id: 'balances' as const, label: 'Balances', icon: Wallet },
    { id: 'members' as const, label: 'Members', icon: Users, count: members.length },
  ];

  /* ──────────── Loading & Pending States ──────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading group...</p>
        </div>
      </div>
    );
  }

  if (group?.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="h-8 w-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Request Pending</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Your request to join this group has been sent. Please wait for an admin to approve your request.
          </p>
          <Link href="/dashboard">
            <Button className="w-full gradient-primary text-white border-0 shadow-lg shadow-indigo-500/25 rounded-xl h-11 transition-all hover:-translate-y-0.5" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (group?.isError || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Access Denied</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            {group?.message || "You don't have permission to view this group or it doesn't exist."}
          </p>
          <Link href="/dashboard/groups">
            <Button className="w-full gradient-primary text-white border-0 shadow-lg shadow-indigo-500/25 rounded-xl h-11 transition-all hover:-translate-y-0.5" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Browse Groups
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ──────────── Render ──────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">

        {/* ═══════════ Header ═══════════ */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <Link href="/dashboard/groups">
            <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors mb-3">
              <ArrowLeft className="h-4 w-4" /> Groups
            </button>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20 flex-shrink-0" style={{ width: 52, height: 52 }}>
                {group?.name?.[0]?.toUpperCase() || 'G'}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{group?.name || 'Group'}</h1>
                {group?.description && <p className="text-sm text-gray-500 truncate mt-0.5">{group.description}</p>}
              </div>
            </div>
            <div className="flex gap-2 items-center flex-shrink-0">
              <Button onClick={copyInviteLink} variant="outline" size="sm" className="rounded-lg border-white/10 text-gray-400 hover:text-white hover:border-white/20">
                {copied ? <><Check className="mr-1 h-3.5 w-3.5 text-emerald-400" /> Copied</> : <><LinkIcon className="mr-1 h-3.5 w-3.5" /> Invite</>}
              </Button>
              {isAdmin && (
                <Button onClick={() => setDeleteModalOpen(true)} variant="outline" size="sm" className="rounded-lg border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══════════ KPI Strip ═══════════ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mb-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{formatCompactIndianCurrency(totalGroupSpending)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Total Spent</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{expenses.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Expenses</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{formatCompactIndianCurrency(avgPerPerson)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Per Person</p>
            </div>
          </div>
        </motion.div>

        {/* ═══════════ Tab Bar ═══════════ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-5">
          <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-1 ${activeTab === tab.id
                  ? 'gradient-primary text-white shadow-lg shadow-indigo-500/20'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/[0.06]'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ═══════════ Tab Content ═══════════ */}
        <AnimatePresence mode="wait">

          {/* ───── EXPENSES ───── */}
          {activeTab === 'expenses' && (
            <motion.div key="expenses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">

              {/* Category breakdown bar */}
              {expenses.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <PieChart className="h-3 w-3" /> Category Split
                    </h3>
                    <Link href={`/dashboard/groups/${params.id}/add-expense`}>
                      <Button size="sm" className="h-7 text-xs gradient-primary text-white rounded-lg shadow-md shadow-indigo-500/15">
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </Link>
                  </div>
                  {/* Multi-segment bar */}
                  <div className="h-2.5 rounded-full overflow-hidden flex bg-white/[0.04] mb-3">
                    {categoryBreakdown().map((cat, i) => {
                      const pct = totalGroupSpending > 0 ? (cat.amount / totalGroupSpending) * 100 : 0;
                      return (
                        <motion.div
                          key={cat.category}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                          className="h-full first:rounded-l-full last:rounded-r-full"
                          style={{ backgroundColor: getCategoryColor(cat.category as ExpenseCategory), minWidth: pct > 0 ? '4px' : 0 }}
                          title={`${getCategoryLabel(cat.category as ExpenseCategory)}: ${formatIndianCurrency(cat.amount)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {categoryBreakdown().slice(0, 5).map((cat) => (
                      <div key={cat.category} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat.category as ExpenseCategory) }} />
                        <span className="text-[10px] text-gray-500">{getCategoryIcon(cat.category as ExpenseCategory)} {getCategoryLabel(cat.category as ExpenseCategory)}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{formatCompactIndianCurrency(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search & Filter */}
              {expenses.length > 0 && (
                <div className="space-y-3">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/30 transition-colors"
                    />
                  </div>
                  {/* Category filter pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                      onClick={() => setCategoryFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${categoryFilter === 'ALL'
                        ? 'gradient-primary text-white shadow-md shadow-indigo-500/15'
                        : 'bg-white/[0.03] text-gray-500 hover:text-gray-300 border border-white/[0.06]'
                        }`}
                    >All</button>
                    {getAllCategories().map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat === categoryFilter ? 'ALL' : cat)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${categoryFilter === cat
                          ? 'gradient-primary text-white shadow-md shadow-indigo-500/15'
                          : 'bg-white/[0.03] text-gray-500 hover:text-gray-300 border border-white/[0.06]'
                          }`}
                      >
                        {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {expenses.length === 0 ? (
                <div className="bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl py-14 text-center">
                  <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                    <Receipt className="h-7 w-7 text-indigo-400/70" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-200 mb-1.5">No expenses yet</h3>
                  <p className="text-sm text-gray-500 mb-5">Add the first group expense</p>
                  <Link href={`/dashboard/groups/${params.id}/add-expense`}>
                    <Button className="gradient-primary text-white rounded-xl shadow-md shadow-indigo-500/20">
                      <Plus className="mr-1.5 h-4 w-4" /> Add First Expense
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Date-grouped list */
                groupExpensesByDate().map(([dateLabel, dayExpenses]) => {
                  const dayTotal = dayExpenses.reduce((s, e) => s + (typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount), 0);
                  return (
                    <div key={dateLabel}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-medium text-gray-500">{dateLabel}</span>
                        <span className="text-xs text-gray-600">{formatIndianCurrency(dayTotal)}</span>
                      </div>
                      <div className="space-y-1.5">
                        {dayExpenses.map((expense, idx) => {
                          const amt = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
                          const payerIdx = getMemberIndex(expense.paidBy);
                          return (
                            <motion.div
                              key={expense.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="text-2xl flex-shrink-0">{getCategoryIcon(expense.category)}</div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-gray-200 truncate">{expense.description}</h4>
                                    <p className="text-[11px] text-gray-600">
                                      Paid by <span className="text-indigo-400">{getMemberName(expense.paidBy)}</span>
                                      <span className="mx-1.5 text-gray-700">·</span>
                                      {getCategoryLabel(expense.category)}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-base font-bold text-white tabular-nums flex-shrink-0">{formatIndianCurrency(amt)}</p>
                                {/* Delete button */}
                                {(isAdmin || expense.paidBy === members.find(m => m.user?.email === user?.primaryEmailAddress?.emailAddress)?.userId) && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteExpense(expense.id); }}
                                    disabled={deletingExpenseId === expense.id}
                                    className="ml-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex-shrink-0"
                                  >
                                    {deletingExpenseId === expense.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                  </button>
                                )}
                              </div>
                              {/* Splits (collapsed, shown on hover/focus) */}
                              {expense.splits && expense.splits.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-white/[0.04]">
                                  {expense.splits.map((split) => {
                                    const splitAmt = typeof split.amount === 'string' ? parseFloat(split.amount) : split.amount;
                                    const sIdx = getMemberIndex(split.userId);
                                    return (
                                      <div key={split.id} className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2 py-1">
                                        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${avatarColor(sIdx)} flex items-center justify-center text-white text-[8px] font-medium`}>
                                          {getMemberInitial(split.userId)}
                                        </div>
                                        <span className="text-[10px] text-gray-500">{getMemberName(split.userId)}</span>
                                        <span className="text-[10px] font-medium text-gray-400">{formatIndianCurrency(splitAmt)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Leaderboard */}
              {expenses.length > 0 && leaderboard.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Trophy className="h-3 w-3 text-amber-400" /> Who Spent the Most
                  </h3>
                  <div className="space-y-2.5">
                    {leaderboard.map((entry, idx) => {
                      const maxSpent = leaderboard[0]?.spent || 1;
                      const barWidth = maxSpent > 0 ? (entry.spent / maxSpent) * 100 : 0;
                      const mIdx = getMemberIndex(entry.userId);
                      const medals = ['🥇', '🥈', '🥉'];
                      return (
                        <div key={entry.userId} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {idx < 3 && <span className="text-sm">{medals[idx]}</span>}
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarColor(mIdx)} flex items-center justify-center text-white text-[9px] font-medium`}>
                                {getMemberInitial(entry.userId)}
                              </div>
                              <span className="text-xs text-gray-300 font-medium">{entry.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-200 tabular-nums">{formatIndianCurrency(entry.spent)}</span>
                          </div>
                          <div className="ml-8 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 0.8, delay: 0.1 + idx * 0.1, ease: 'easeOut' }}
                              className={`h-full rounded-full ${idx === 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-300' : idx === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-400' : 'bg-gradient-to-r from-indigo-500/50 to-purple-400/50'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ───── CHAT ───── */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Messages */}
                <div className="h-[480px] overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
                        <MessageCircle className="h-7 w-7 text-indigo-400/70" />
                      </div>
                      <p className="text-sm text-gray-400 mb-1">No messages yet</p>
                      <p className="text-xs text-gray-600">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const mIdx = getMemberIndex(msg.userId);
                      return (
                        <motion.div key={msg.id || index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor(mIdx)} flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0`}>
                            {(msg.user.name || msg.user.email)?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="font-medium text-xs text-gray-300">{msg.user.name || msg.user.email}</span>
                              <span className="text-[10px] text-gray-700">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm text-gray-300 bg-white/[0.04] rounded-xl rounded-tl-sm px-3.5 py-2 inline-block max-w-full break-words">
                              {msg.message}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-white/[0.06] p-3 bg-white/[0.01]">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/30"
                    />
                    <Button type="submit" disabled={!newMessage.trim() || sendingMessage} className="gradient-primary text-white rounded-xl px-4">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* ───── BALANCES ───── */}
          {activeTab === 'balances' && (
            <motion.div key="balances" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {expenses.length === 0 ? (
                <div className="bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl py-14 text-center">
                  <Wallet className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Add expenses to see balances</p>
                </div>
              ) : (
                <>
                  {/* Balance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(calculateBalances())
                      .sort(([, a], [, b]) => b - a)
                      .map(([userId, balance], idx) => {
                        const isPositive = balance > 0.01;
                        const isNegative = balance < -0.01;
                        const isZero = !isPositive && !isNegative;
                        return (
                          <motion.div
                            key={userId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className={`relative overflow-hidden group bg-white/[0.02] border rounded-2xl p-5 backdrop-blur-md transition-all ${isZero ? 'border-emerald-500/10 hover:border-emerald-500/30' :
                              isPositive ? 'border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_4px_24px_-8px_rgba(16,185,129,0.15)]' :
                                'border-rose-500/20 hover:border-rose-500/40 shadow-[0_4px_24px_-8px_rgba(244,63,94,0.15)]'
                              }`}
                          >
                            {/* Subtle background glow */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 ${isZero ? 'bg-emerald-500' : isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} />

                            <div className="relative flex items-center justify-between z-10">
                              <div className="flex items-center gap-4">
                                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shadow-lg shadow-black/20 ${isZero ? 'bg-gradient-to-br from-emerald-600 to-green-800' :
                                  isPositive ? 'bg-gradient-to-br from-emerald-400 to-teal-600' :
                                    'bg-gradient-to-br from-rose-400 to-red-600'
                                  }`}>
                                  {isZero ? <CheckCircle className="h-5 w-5" /> : getMemberInitial(userId)}

                                  {/* Small badge icon */}
                                  {!isZero && (
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#12141d] ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                      {isPositive ? <TrendingUp className="h-3 w-3 text-white" /> : <TrendingDown className="h-3 w-3 text-white" />}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-base font-display font-semibold text-white tracking-wide">{getMemberName(userId)}</p>
                                  <p className={`text-xs font-medium mt-0.5 ${isZero ? 'text-emerald-500/80' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isZero ? 'All settled up' : isPositive ? 'Gets back' : 'Owes'}
                                  </p>
                                </div>
                              </div>
                              <p className={`text-xl font-bold font-display tabular-nums tracking-tight ${isZero ? 'text-emerald-500' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isZero ? '₹0' : `${isPositive ? '+' : '-'}${formatIndianCurrency(Math.abs(balance))}`}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })
                    }
                  </div>

                  {/* Suggested Settlements with Settle Up buttons */}
                  {calculateSettlements().length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-500/[0.05] to-purple-500/[0.05] border border-indigo-500/20 rounded-2xl p-5 shadow-lg shadow-indigo-500/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <h3 className="text-sm font-display font-semibold text-indigo-300 flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4" /> Suggested Settlements
                        </h3>
                        <p className="text-xs text-indigo-400/60 font-medium">Clear these debts to balance the group</p>
                      </div>

                      <div className="space-y-3">
                        {calculateSettlements().map((s, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/20 border border-white/[0.04] rounded-xl p-4 hover:border-indigo-500/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {/* Sender */}
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(getMemberIndex(s.from))} flex items-center justify-center text-white text-xs font-medium`}>
                                  {getMemberInitial(s.from)}
                                </div>
                                <span className="text-sm font-medium text-gray-300">{getMemberName(s.from)}</span>
                              </div>

                              <ArrowRight className="h-4 w-4 text-gray-600" />

                              {/* Receiver */}
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(getMemberIndex(s.to))} flex items-center justify-center text-white text-xs font-medium`}>
                                  {getMemberInitial(s.to)}
                                </div>
                                <span className="text-sm font-medium text-gray-300">{getMemberName(s.to)}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 ml-11 sm:ml-0">
                              <p className="text-base font-bold text-white tabular-nums tracking-wide">{formatIndianCurrency(s.amount)}</p>
                              <div className="flex gap-2">
                                <a
                                  href={`upi://pay?pa=&pn=${encodeURIComponent(getMemberName(s.to))}&am=${(Math.round(s.amount * 100) / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Settlement for ${group?.name || 'group'}`)}`}
                                  className="inline-flex items-center gap-1.5 bg-[#5f259f] hover:bg-[#4e1f82] text-white rounded-lg px-3 h-9 text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-purple-500/15"
                                >
                                  <IndianRupee className="h-3 w-3" /> UPI Pay
                                </a>
                                <Button
                                  onClick={() => { setSettleModal({ from: s.from, to: s.to, amount: Math.round(s.amount * 100) / 100 }); setSettleNote(''); }}
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20 rounded-lg px-4 h-9 font-semibold transition-all hover:-translate-y-0.5"
                                >
                                  Settle Up
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Settlement History */}
                  {settlements.length > 0 && (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Settlement History
                      </h3>
                      <div className="space-y-2">
                        {settlements.map((s) => {
                          const amt = typeof s.amount === 'string' ? parseFloat(s.amount) : s.amount;
                          return (
                            <div key={s.id} className="flex items-center gap-3 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl px-4 py-3">
                              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-300">
                                  <span className="font-medium">{getMemberName(s.fromUserId)}</span>
                                  <span className="text-gray-600 mx-1.5">paid</span>
                                  <span className="font-medium">{getMemberName(s.toUserId)}</span>
                                </p>
                                {s.note && <p className="text-[10px] text-gray-600 mt-0.5">{s.note}</p>}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-emerald-400 tabular-nums">{formatIndianCurrency(amt)}</p>
                                <p className="text-[10px] text-gray-700">{new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-xs font-medium text-indigo-300">Summary</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Total group spending: <span className="text-white font-semibold">{formatIndianCurrency(totalGroupSpending)}</span>
                      {members.length > 0 && <> · Per person average: <span className="text-white font-semibold">{formatIndianCurrency(avgPerPerson)}</span></>}
                      {settlements.length > 0 && <> · <span className="text-emerald-400 font-medium">{settlements.length} settlement{settlements.length > 1 ? 's' : ''} recorded</span></>}
                    </p>
                  </div>

                  {/* Donut Chart */}
                  {categoryBreakdown().length > 0 && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                        <PieChart className="h-3 w-3 text-purple-400" /> Spending by Category
                      </h3>
                      <div className="flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={200}>
                          <RechartsPieChart>
                            <Pie
                              data={categoryBreakdown().map(cat => ({
                                name: getCategoryLabel(cat.category as any),
                                value: cat.amount,
                                color: getCategoryColor(cat.category as any),
                                icon: getCategoryIcon(cat.category as any),
                              }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                              dataKey="value"
                              onMouseEnter={(_, index) => setActivePieIdx(index)}
                              onMouseLeave={() => setActivePieIdx(null)}
                              stroke="none"
                            >
                              {categoryBreakdown().map((cat, index) => (
                                <Cell
                                  key={`pie-${index}`}
                                  fill={getCategoryColor(cat.category as any)}
                                  opacity={activePieIdx === null || activePieIdx === index ? 1 : 0.3}
                                  style={{ transition: 'opacity 0.3s ease', filter: activePieIdx === index ? 'brightness(1.2)' : 'none' }}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }: any) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="rounded-xl bg-[#0e0f1a]/95 backdrop-blur-xl border border-white/[0.08] px-4 py-2.5 shadow-2xl">
                                    <p className="text-[11px] text-gray-500">{d.icon} {d.name}</p>
                                    <p className="text-sm font-semibold text-white">{formatIndianCurrency(d.value)}</p>
                                  </div>
                                );
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="w-full space-y-1.5 mt-2">
                          {categoryBreakdown().map((cat) => {
                            const pct = totalGroupSpending > 0 ? (cat.amount / totalGroupSpending) * 100 : 0;
                            return (
                              <div key={cat.category} className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat.category as any) }} />
                                  {getCategoryIcon(cat.category as any)} {getCategoryLabel(cat.category as any)}
                                </span>
                                <span className="text-gray-300 font-medium tabular-nums">{formatIndianCurrency(cat.amount)} ({pct.toFixed(0)}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Export & Report Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleExport}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-center group"
                    >
                      <Download className="h-5 w-5 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-medium text-gray-300">Export CSV</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">Download all expenses</p>
                    </button>
                    <button
                      onClick={fetchMonthlyReport}
                      disabled={reportLoading}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-center group"
                    >
                      {reportLoading ? <Loader2 className="h-5 w-5 text-indigo-400 mx-auto mb-2 animate-spin" /> : <Sparkles className="h-5 w-5 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />}
                      <p className="text-xs font-medium text-gray-300">AI Report</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">Monthly insights</p>
                    </button>
                  </div>

                  {/* AI Monthly Report Card */}
                  {monthlyReport && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.06] border border-indigo-500/20 rounded-2xl p-5 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-300">AI Monthly Report</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{monthlyReport.summary}</p>
                      {monthlyReport.stats && (
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/[0.06]">
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{formatCompactIndianCurrency(monthlyReport.stats.total)}</p>
                            <p className="text-[10px] text-gray-500">Total</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{monthlyReport.stats.count}</p>
                            <p className="text-[10px] text-gray-500">Expenses</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{formatCompactIndianCurrency(monthlyReport.stats.avgPerExpense)}</p>
                            <p className="text-[10px] text-gray-500">Avg/Expense</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ───── MEMBERS ───── */}
          {activeTab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">

              {/* Invite Link */}
              <div className="bg-white/[0.03] border border-indigo-500/15 rounded-2xl p-4">
                <h3 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                  <LinkIcon className="h-3 w-3 text-indigo-400" /> Invite Link
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    readOnly
                    value={group?.inviteCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/groups/join?code=${group.inviteCode}` : ''}
                    className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-gray-500 font-mono focus:outline-none"
                  />
                  <Button onClick={copyInviteLink} variant="outline" size="sm" className="rounded-lg border-white/10 text-gray-400 hover:text-white">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-600">Share:</span>
                  <button onClick={shareViaWhatsApp} className="px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 text-xs font-medium transition-colors">WhatsApp</button>
                  <button onClick={shareViaTelegram} className="px-3 py-1.5 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/20 text-xs font-medium transition-colors">Telegram</button>
                  <button onClick={shareNative} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-medium transition-colors flex items-center gap-1"><Share2 className="h-3 w-3" /> More</button>
                </div>
              </div>

              {/* Add Member */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <h3 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                  <UserPlus className="h-3 w-3 text-indigo-400" /> Add by Email
                </h3>
                <form onSubmit={handleAddMember} className="space-y-2.5">
                  <input
                    type="email"
                    placeholder="member@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/30"
                  />
                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                      <p className="text-xs text-rose-400">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full gradient-primary text-white rounded-xl text-sm" disabled={addMemberLoading} size="sm">
                    {addMemberLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Adding...</> : 'Add Member'}
                  </Button>
                </form>
              </div>

              {/* Pending Members */}
              {isAdmin && members.filter((m: any) => m.status === 'pending').length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-medium text-orange-400 mb-3 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Pending Requests
                  </h3>
                  <div className="space-y-1.5">
                    {members.filter((m: any) => m.status === 'pending').map((member: any, index: number) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="group flex items-center justify-between p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(index)} flex items-center justify-center text-white text-sm font-medium`}>
                            {(member.user.name || member.user.email)[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">{member.user.name || 'User'}</p>
                            <p className="text-[11px] text-gray-600">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveMember(member.userId)}
                            disabled={memberActionLoading === member.userId + '-approve'}
                            title="Approve request"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                          >
                            {memberActionLoading === member.userId + '-approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDenyMember(member.userId)}
                            disabled={memberActionLoading === member.userId + '-deny'}
                            title="Deny request"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                          >
                            {memberActionLoading === member.userId + '-deny' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-4 w-4" />}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Members List */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <h3 className="text-xs font-medium text-gray-400 mb-3">Members ({members.filter((m: any) => m.status !== 'pending').length})</h3>
                <div className="space-y-1.5">
                  {members.filter((m: any) => m.status !== 'pending').map((member: any, index: number) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="group flex items-center justify-between p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(index)} flex items-center justify-center text-white text-sm font-medium`}>
                          {(member.user.name || member.user.email)[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{member.user.name || 'User'}</p>
                          <p className="text-[11px] text-gray-600">{member.user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {member.role === 'admin' ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold rounded-full border border-indigo-500/20 uppercase tracking-wider">
                            <Crown className="h-2.5 w-2.5" /> Admin
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-white/[0.03] text-gray-500 text-[10px] font-medium rounded-full uppercase tracking-wider">
                            Member
                          </span>
                        )}

                        {/* Admin Action Menu */}
                        {isAdmin && member.user.email !== user?.primaryEmailAddress?.emailAddress && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleUpdateRole(member.userId, member.role)}
                              disabled={memberActionLoading === member.userId + '-role'}
                              title={`Make ${member.role === 'admin' ? 'Member' : 'Admin'}`}
                              className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
                            >
                              {memberActionLoading === member.userId + '-role' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : member.role === 'admin' ? <ShieldAlert className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={memberActionLoading === member.userId}
                              title="Remove user"
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                            >
                              {memberActionLoading === member.userId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════ Settle Up Modal ═══════════ */}
      <AnimatePresence>
        {settleModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSettleModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-gray-900 border border-white/[0.1] rounded-2xl p-6 shadow-2xl"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Settle Up</h3>
                <p className="text-xs text-gray-500 mt-1">Record this payment</p>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(getMemberIndex(settleModal.from))} flex items-center justify-center text-white text-sm font-medium mx-auto mb-1.5`}>
                      {getMemberInitial(settleModal.from)}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{getMemberName(settleModal.from)}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatIndianCurrency(settleModal.amount)}</p>
                    <ArrowRightLeft className="h-4 w-4 text-gray-600 mt-1" />
                  </div>
                  <div className="text-center">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(getMemberIndex(settleModal.to))} flex items-center justify-center text-white text-sm font-medium mx-auto mb-1.5`}>
                      {getMemberInitial(settleModal.to)}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{getMemberName(settleModal.to)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-500 block mb-1.5">Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., UPI, Cash, Bank transfer..."
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/30"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettleModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-400 hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSettleUp}
                  disabled={settleLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {settleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ Delete Group Modal ═══════════ */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#0a0b14] border border-rose-500/20 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl shadow-rose-500/10"
            >
              <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-rose-500/5">
                <h3 className="text-base font-display font-semibold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Delete Group
                </h3>
                <button onClick={() => setDeleteModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-300 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-white">{group?.name}</span>?
                  This will permanently delete all expenses, messages, and settlements. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="flex-1 rounded-xl border-white/10 text-gray-400 hover:text-white hover:bg-white/5">
                    Cancel
                  </Button>
                  <Button onClick={handleDeleteGroup} disabled={isDeleting} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/20">
                    {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting</> : 'Delete Group'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
