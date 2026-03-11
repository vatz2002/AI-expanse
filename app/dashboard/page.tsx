'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GmailSyncButton from '@/components/dashboard/GmailSyncButton';
import { formatIndianCurrency, formatCompactIndianCurrency } from '@/lib/currency';
import { formatIndianDate } from '@/lib/date';
import { getCategoryLabel, getCategoryColor, getCategoryIcon } from '@/lib/categories';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Sparkles,
  Wallet,
  Target,
  BarChart3,
  Receipt,
  Store,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ArrowRightLeft,
  ArrowRight,
  IndianRupee,
  Users,
  Loader2,
  Send,
  Edit,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ExpenseCategory } from '@prisma/client';
import Link from 'next/link';

/* ────────────────── Types ────────────────── */

interface BudgetItem {
  category: ExpenseCategory;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  isOverBudget: boolean;
}

interface ExpenseStats {
  totalSpent: number;
  categoryBreakdown: {
    category: ExpenseCategory;
    amount: number;
    count: number;
  }[];
  trend: {
    current: number;
    previous: number;
    percentageChange: number;
    isIncrease: boolean;
  };
  recentExpenses: any[];
  dailySpending: { day: number; amount: number }[];
  topMerchants: { name: string; amount: number }[];
  budgetProgress: BudgetItem[];
}

interface YearlyData {
  months: { month: string; year: number; total: number }[];
}

interface AIInsights {
  insights: string[];
}

/* ────────────────── Helpers ────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* Animated Number */
function AnimNum({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const inc = value / (duration / 16);
    const t = setInterval(() => {
      start += inc;
      if (start >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <>{format(display)}</>;
}

/* Custom Tooltip */
const ChartTooltip = ({ active, payload, label, prefix }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#0e0f1a]/95 backdrop-blur-xl border border-white/[0.08] px-4 py-2.5 shadow-2xl">
      <p className="text-[11px] text-gray-500 mb-0.5">{prefix ? `${prefix} ${label}` : label}</p>
      <p className="text-sm font-semibold text-white">{formatIndianCurrency(payload[0].value)}</p>
    </div>
  );
};

/* ────────────────── Skeleton ────────────────── */

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
    </div>
  );
}

/* ────────────────── Main Component ────────────────── */

export default function DashboardPage() {
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyData | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Settlements overview
  const [settlements, setSettlements] = useState<any[]>([]);

  // Quick add expense
  const [quickExpense, setQuickExpense] = useState({ description: '', amount: '', category: 'MISCELLANEOUS' });
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const res = await fetch('/api/settlements/overview', { cache: 'no-store' });
      if (res.ok) setSettlements(await res.json());
    } catch { /* ignore */ }
  };

  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickExpense.description.trim() || !quickExpense.amount) return;
    setQuickLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(quickExpense.amount),
          description: quickExpense.description.trim(),
          category: quickExpense.category,
          date: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setQuickExpense({ description: '', amount: '', category: 'MISCELLANEOUS' });
        setQuickSuccess(true);
        setTimeout(() => setQuickSuccess(false), 2000);
        fetchDashboardData(); // refresh stats
      }
    } catch { /* ignore */ }
    finally { setQuickLoading(false); }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, yearlyRes, insightsRes] = await Promise.all([
        fetch('/api/expenses/stats'),
        fetch('/api/expenses/yearly-stats'),
        fetch('/api/ai/insights'),
      ]);

      const [statsData, yearlyJSON, insightsData] = await Promise.all([
        statsRes.json(),
        yearlyRes.json(),
        insightsRes.json(),
      ]);

      setStats(statsData);
      setYearlyData(yearlyJSON);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  /* ── Derived data ── */
  const totalTransactions = stats?.categoryBreakdown.reduce((s, c) => s + c.count, 0) || 0;
  const today = new Date();
  const dayOfMonth = today.getDate();
  const avgDaily = dayOfMonth > 0 ? (stats?.totalSpent || 0) / dayOfMonth : 0;

  const totalBudget = stats?.budgetProgress?.reduce((s, b) => s + b.budgetAmount, 0) || 0;
  const totalBudgetSpent = stats?.budgetProgress?.reduce((s, b) => s + b.spentAmount, 0) || 0;
  const budgetUsedPct = totalBudget > 0 ? Math.round((totalBudgetSpent / totalBudget) * 100) : 0;

  const pieData =
    stats?.categoryBreakdown.map((item) => ({
      name: getCategoryLabel(item.category),
      value: item.amount,
      color: getCategoryColor(item.category),
      icon: getCategoryIcon(item.category),
      category: item.category,
      count: item.count,
    })) || [];

  const yearlyChartData =
    yearlyData?.months.map((m) => ({
      name: m.month,
      value: m.total,
    })) || [];

  const dailyChartData =
    stats?.dailySpending?.map((d) => ({
      name: d.day.toString(),
      value: d.amount,
    })) || [];

  const maxDailySpend = Math.max(...(stats?.dailySpending?.map((d) => d.amount) || [0]));

  /* ── KPI Cards ── */
  const kpis = [
    {
      label: 'Total Spent',
      value: stats?.totalSpent || 0,
      format: formatCompactIndianCurrency,
      fullValue: formatIndianCurrency(stats?.totalSpent || 0),
      change: stats?.trend.percentageChange || 0,
      isIncrease: stats?.trend.isIncrease || false,
      icon: Wallet,
      gradient: 'from-violet-500/20 to-indigo-500/20',
      iconColor: 'text-violet-400',
      glowClass: 'card-purple-glow',
    },
    {
      label: 'Budget Used',
      value: budgetUsedPct,
      format: (n: number) => `${n}%`,
      fullValue: `${formatIndianCurrency(totalBudgetSpent)} of ${formatIndianCurrency(totalBudget)}`,
      change: null,
      isIncrease: budgetUsedPct > 80,
      icon: Target,
      gradient: budgetUsedPct > 90 ? 'from-red-500/20 to-orange-500/20' : 'from-emerald-500/20 to-teal-500/20',
      iconColor: budgetUsedPct > 90 ? 'text-red-400' : 'text-emerald-400',
      glowClass: budgetUsedPct > 90 ? '' : 'card-emerald-glow',
    },
    {
      label: 'Daily Average',
      value: avgDaily,
      format: formatCompactIndianCurrency,
      fullValue: formatIndianCurrency(avgDaily),
      change: null,
      isIncrease: false,
      icon: BarChart3,
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      glowClass: 'card-amber-glow',
    },
    {
      label: 'Transactions',
      value: totalTransactions,
      format: (n: number) => n.toString(),
      fullValue: `${totalTransactions} this month`,
      change: null,
      isIncrease: false,
      icon: Receipt,
      gradient: 'from-sky-500/20 to-blue-500/20',
      iconColor: 'text-sky-400',
      glowClass: 'card-blue-glow',
    },
  ];

  return (
    <div className="page-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ═══════════════ Header ═══════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              {getGreeting()} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">{formatIndianDate(new Date())}</p>
          </div>
          <div className="flex gap-3">
            <GmailSyncButton />
            <Link href="/dashboard/expenses/new">
              <Button className="gradient-primary text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all rounded-xl px-5 btn-glow">
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* ═══════════════ KPI Cards ═══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <div
                className={`relative overflow-hidden glass-card rounded-2xl ${kpi.glowClass} transition-all duration-500 group`}
              >
                {/* Gradient blob */}
                <div
                  className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${kpi.gradient} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                />
                <div className="relative p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-inner-glow`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
                    </div>
                    {kpi.change !== null && (
                      <div
                        className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${kpi.isIncrease
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                      >
                        {kpi.isIncrease ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(kpi.change).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                    <AnimNum value={kpi.value} format={kpi.format} />
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════ Annual Spending Trend ═══════════════ */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-violet-400" />
                    Annual Spending Trend
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Last 12 months</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-display font-bold text-white">
                    {formatCompactIndianCurrency(yearlyChartData.reduce((s, d) => s + d.value, 0))}
                  </p>
                  <p className="text-xs text-gray-500">total</p>
                </div>
              </div>
            </div>
            <div className="px-2 sm:px-4 pb-4">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={yearlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                    width={50}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#areaGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#0e0f1a', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════ Category + Budget Row ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Category Donut */}
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
            <div className="glass-card rounded-2xl h-full">
              <div className="pb-2 px-5 pt-5">
                <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-purple-400" />
                  Category Breakdown
                </h3>
                <p className="text-xs text-gray-500">Where your money went this month</p>
              </div>
              <div className="px-4 pb-5">
                {pieData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          onMouseEnter={(_, index) => setActivePieIndex(index)}
                          onMouseLeave={() => setActivePieIndex(null)}
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.3}
                              style={{ transition: 'opacity 0.3s ease', filter: activePieIndex === index ? 'brightness(1.2)' : 'none' }}
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
                                <p className="text-[11px] text-gray-600">{d.count} transactions</p>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="w-full space-y-2 mt-2">
                      {pieData
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)
                        .map((item) => {
                          const pct = stats?.totalSpent ? (item.value / stats.totalSpent) * 100 : 0;
                          return (
                            <div key={item.name} className="group">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-400 flex items-center gap-1.5">
                                  <span>{item.icon}</span>
                                  {item.name}
                                </span>
                                <span className="text-gray-300 font-medium">
                                  {formatCompactIndianCurrency(item.value)}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <p>No expenses yet.</p>
                    <Link href="/dashboard/expenses/new">
                      <Button className="mt-3 rounded-xl" variant="outline" size="sm">
                        Add Your First Expense
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Budget Progress */}
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
            <div className="glass-card rounded-2xl h-full">
              <div className="pb-2 px-5 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-400" />
                      Budget Progress
                    </h3>
                    <p className="text-xs text-gray-500">Category-wise limits</p>
                  </div>
                  <Link href="/dashboard/budgets">
                    <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-300 rounded-lg">
                      Manage <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="px-5 pb-5">
                {stats?.budgetProgress && stats.budgetProgress.length > 0 ? (
                  <div className="space-y-4">
                    {stats.budgetProgress.map((b, idx) => {
                      const pct = Math.min(b.percentage, 100);
                      const isOver = b.isOverBudget;
                      const isWarn = b.percentage >= 80 && !isOver;
                      return (
                        <div key={b.category}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-gray-300 flex items-center gap-1.5">
                              <span>{getCategoryIcon(b.category)}</span>
                              {getCategoryLabel(b.category)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatCompactIndianCurrency(b.spentAmount)} / {formatCompactIndianCurrency(b.budgetAmount)}
                              </span>
                              <span
                                className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${isOver
                                  ? 'bg-red-500/15 text-red-400'
                                  : isWarn
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : 'bg-emerald-500/15 text-emerald-400'
                                  }`}
                              >
                                {Math.round(b.percentage)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: 'easeOut' }}
                              className={`h-full rounded-full ${isOver
                                ? 'bg-gradient-to-r from-red-500 to-red-400'
                                : isWarn
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-600">
                    <Target className="mx-auto h-8 w-8 mb-2 text-gray-700" />
                    <p className="text-sm">No budgets set yet.</p>
                    <Link href="/dashboard/budgets">
                      <Button className="mt-3 rounded-xl" variant="outline" size="sm">
                        Set a Budget
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════ Daily Spending ═══════════════ */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    Daily Spending
                  </h3>
                  <p className="text-xs text-gray-500">
                    This month &middot; highest day: {formatIndianCurrency(maxDailySpend)}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-2 sm:px-4 pb-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    interval={isMobile ? 4 : 1}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip prefix="Day" />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={16}>
                    {dailyChartData.map((entry, index) => {
                      const isToday = index + 1 === dayOfMonth;
                      return (
                        <Cell
                          key={`bar-${index}`}
                          fill={isToday ? '#8b5cf6' : entry.value > 0 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.02)'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════ Top Merchants + AI Insights ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top Merchants */}
          <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
            <div className="glass-card rounded-2xl h-full">
              <div className="pb-2 px-5 pt-5">
                <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                  <Store className="h-4 w-4 text-pink-400" />
                  Top Merchants
                </h3>
                <p className="text-xs text-gray-500">Where you spend most this month</p>
              </div>
              <div className="px-5 pb-5">
                {stats?.topMerchants && stats.topMerchants.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topMerchants.map((m, idx) => {
                      const maxAmt = stats.topMerchants[0].amount;
                      const barW = maxAmt > 0 ? (m.amount / maxAmt) * 100 : 0;
                      return (
                        <div key={m.name} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600 w-5 text-right">
                                {idx + 1}.
                              </span>
                              <span className="text-sm text-gray-300 truncate max-w-[180px]">{m.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-200">
                              {formatIndianCurrency(m.amount)}
                            </span>
                          </div>
                          <div className="ml-7 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barW}%` }}
                              transition={{ duration: 0.6, delay: 0.3 + idx * 0.08 }}
                              className="h-full rounded-full bg-gradient-to-r from-pink-500/70 to-rose-400/70"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-600 text-sm">
                    No merchant data yet.
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
            <div className="relative glass-card rounded-2xl h-full overflow-hidden">
              {/* Subtle gradient accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
              <div className="relative pb-2 px-5 pt-5">
                <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  AI Insights
                </h3>
                <p className="text-xs text-gray-500">Smart tips based on your spending</p>
              </div>
              <div className="relative px-5 pb-5 space-y-2.5">
                {insights?.insights && insights.insights.length > 0 ? (
                  insights.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-violet-500/20 transition-colors"
                    >
                      <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-600 text-sm">
                    Add more expenses to get personalized insights.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════ Actions & Settlements Grid ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* ═══════════════ Settle Up Overview ═══════════════ */}
          {settlements.length > 0 && (
            <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="h-full">
              <div className="glass-card rounded-2xl h-full flex flex-col">
                <div className="px-5 pt-5 pb-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-amber-400" />
                        Settle Up
                      </h3>
                      <p className="text-xs text-gray-500">Pending settlements across your groups</p>
                    </div>
                    <Link href="/dashboard/groups">
                      <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-300 rounded-lg">
                        All Groups <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="px-5 pb-5 space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                  {settlements.slice(0, 5).map((s: any, idx: number) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.05 }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${s.youOwe
                        ? 'bg-rose-500/[0.04] border-rose-500/10 hover:border-rose-500/20'
                        : 'bg-emerald-500/[0.04] border-emerald-500/10 hover:border-emerald-500/20'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${s.youOwe ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {s.youOwe ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm text-gray-300">
                            {s.youOwe ? (
                              <>You owe <span className="font-medium text-white">{s.toUserName}</span></>
                            ) : (
                              <><span className="font-medium text-white">{s.fromUserName}</span> owes you</>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{s.groupName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-base font-bold tabular-nums ${s.youOwe ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {s.youOwe ? '-' : '+'}{formatIndianCurrency(s.amount)}
                        </p>
                        <Link href={`/dashboard/groups/${s.groupId}`}>
                          <button className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                  {settlements.length > 5 && (
                    <p className="text-center text-xs text-gray-600 pt-1">+ {settlements.length - 5} more settlements</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ Quick Add Personal Expense ═══════════════ */}
          <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className={settlements.length > 0 ? 'h-full' : 'lg:col-span-2'}>
            <div className="glass-card rounded-2xl h-full flex flex-col justify-center">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-violet-400" />
                  Quick Add Expense
                </h3>
                <p className="text-xs text-gray-500">Add a personal expense without leaving the dashboard</p>
              </div>
              <div className="px-5 pb-5">
                <form onSubmit={handleQuickExpense} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="What did you spend on?"
                      value={quickExpense.description}
                      onChange={e => setQuickExpense(prev => ({ ...prev, description: e.target.value }))}
                      className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/30 transition-colors"
                    />
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={quickExpense.amount}
                        onChange={e => setQuickExpense(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-28 bg-white/[0.03] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/30 transition-colors"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      {['FOOD_DINING', 'GROCERIES', 'TRAVEL_FUEL', 'SHOPPING', 'MISCELLANEOUS'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setQuickExpense(prev => ({ ...prev, category: cat }))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${quickExpense.category === cat
                            ? 'gradient-primary text-white shadow-md shadow-indigo-500/15'
                            : 'bg-white/[0.03] text-gray-500 hover:text-gray-300 border border-white/[0.06]'
                            }`}
                        >
                          {getCategoryIcon(cat as any)} {getCategoryLabel(cat as any)}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="submit"
                      disabled={quickLoading || !quickExpense.description.trim() || !quickExpense.amount}
                      className={`rounded-xl px-5 ml-3 transition-all ${quickSuccess
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'gradient-primary text-white shadow-lg shadow-violet-500/20'
                        }`}
                    >
                      {quickLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : quickSuccess ? '✓ Added!' : <><Send className="mr-1.5 h-3.5 w-3.5" /> Add</>}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════ Activity & Expenses Grid ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* ═══════════════ Activity Feed ═══════════════ */}
          <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible" className="h-full">
            <div className="glass-card rounded-2xl h-full flex flex-col">
              <div className="px-5 pt-5 pb-2 shrink-0">
                <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-indigo-400" />
                  Activity Feed
                </h3>
                <p className="text-xs text-gray-500">Recent actions across your groups</p>
              </div>
              <div className="px-3 pb-5 flex-1 overflow-y-auto max-h-[360px] custom-scrollbar">
                <ActivityFeed />
              </div>
            </div>
          </motion.div>

          {/* ═══════════════ Recent Expenses ═══════════════ */}
          <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible" className="h-full">
            <div className="glass-card rounded-2xl h-full flex flex-col">
              <div className="px-5 pt-5 pb-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-sky-400" />
                      Recent Expenses
                    </h3>
                    <p className="text-xs text-gray-500">Your latest transactions</p>
                  </div>
                  <Link href="/dashboard/expenses">
                    <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-300 rounded-lg">
                      View All <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="px-5 pb-5 flex-1 overflow-y-auto max-h-[360px] custom-scrollbar">
                {stats?.recentExpenses && stats.recentExpenses.length > 0 ? (
                  <div className="space-y-1.5">
                    {stats.recentExpenses.slice(0, 6).map((expense, idx) => (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 + idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: `${getCategoryColor(expense.category)}12` }}
                          >
                            {getCategoryIcon(expense.category)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">{expense.description}</p>
                            <p className="text-xs text-gray-600">
                              {getCategoryLabel(expense.category)} &middot; {formatIndianDate(expense.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 ml-3">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-gray-100 dark:text-gray-100">
                              {formatIndianCurrency(parseFloat(expense.amount))}
                            </p>
                            <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                              <button
                                title="Edit Expense"
                                className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            </Link>
                          </div>
                          {expense.aiCategorized && (
                            <p className="text-[10px] text-violet-400 flex items-center gap-0.5 mt-1">
                              <Sparkles className="h-2.5 w-2.5" /> AI
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <p className="text-sm">No expenses yet</p>
                    <Link href="/dashboard/expenses/new">
                      <Button className="mt-3 rounded-xl" size="sm">
                        Add Your First Expense
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
