'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { formatIndianCurrency, formatCompactIndianCurrency } from '@/lib/currency';
import {
  getCategoryLabel,
  getCategoryIcon,
  getCategoryColor,
  getAllCategories,
} from '@/lib/categories';
import {
  Target,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Wallet,
  ChevronDown,
  ChevronUp,
  X,
  Shield,
} from 'lucide-react';
import { ExpenseCategory } from '@prisma/client';

/* ──────────── Types ──────────── */

interface Budget {
  id: string;
  category: ExpenseCategory;
  amount: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
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

/* ──────────── Circular Progress ──────────── */

function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 7,
  isOverBudget,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isOverBudget: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percentage, 100);
  const offset = circumference - (progress / 100) * circumference;

  const color = isOverBudget
    ? '#ef4444'
    : percentage >= 80
      ? '#f59e0b'
      : '#10b981';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
    </svg>
  );
}

/* ──────────── Skeleton ──────────── */

function BudgetsSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
    </div>
  );
}

/* ──────────── Main Component ──────────── */

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState<ExpenseCategory | ''>('');
  const [formAmount, setFormAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      const response = await fetch('/api/budgets');
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleCreate = async () => {
    if (!formCategory || !formAmount) return;
    setCreating(true);
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formCategory,
          amount: parseFloat(formAmount),
        }),
      });
      if (response.ok) {
        setFormCategory('');
        setFormAmount('');
        setShowForm(false);
        fetchBudgets();
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const existingCategories = new Set(budgets.map((b) => b.category));
  const availableCategories = getAllCategories().filter(
    (cat) => !existingCategories.has(cat)
  );

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = budgets.filter((b) => b.isOverBudget).length;

  if (loading) return <BudgetsSkeleton />;

  const kpis = [
    {
      label: 'Total Budget',
      value: formatCompactIndianCurrency(totalBudget),
      icon: Wallet,
      color: 'text-violet-400',
      bg: 'from-violet-500/20 to-indigo-500/20',
    },
    {
      label: 'Total Spent',
      value: formatCompactIndianCurrency(totalSpent),
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-orange-500/20',
    },
    {
      label: 'Health',
      value: overBudgetCount === 0 ? 'On Track' : `${overBudgetCount} Over`,
      icon: overBudgetCount === 0 ? Shield : AlertTriangle,
      color: overBudgetCount === 0 ? 'text-emerald-400' : 'text-red-400',
      bg: overBudgetCount === 0 ? 'from-emerald-500/20 to-teal-500/20' : 'from-red-500/20 to-orange-500/20',
    },
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
              <Target className="h-7 w-7 text-emerald-400" />
              Budgets
            </h1>
            <p className="text-sm text-gray-500 mt-1">Set and track category-wise spending limits</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gradient-primary text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all rounded-xl px-5 btn-glow"
          >
            {showForm ? (
              <>
                <X className="mr-2 h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Add Budget
              </>
            )}
          </Button>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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

        {/* Add Budget Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-card gradient-border rounded-2xl p-5">
                <h3 className="text-sm font-display font-semibold text-white mb-4">New Budget</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-violet-500/40 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0e0f1a]">
                        Select category...
                      </option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat} className="bg-[#0e0f1a]">
                          {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Monthly Limit (₹)</label>
                    <input
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 transition-all"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!formCategory || !formAmount || creating}
                  className="gradient-primary text-white rounded-xl px-6 disabled:opacity-40"
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Creating...
                    </span>
                  ) : (
                    'Create Budget'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Budget Cards */}
        {budgets.length === 0 ? (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
                <Target className="h-7 w-7 text-emerald-400/60" />
              </div>
              <h3 className="text-lg font-display font-semibold text-gray-300 mb-1">
                No budgets yet
              </h3>
              <p className="text-sm text-gray-600 mb-5 max-w-xs mx-auto">
                Set category-wise budgets to keep your spending on track.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="gradient-primary text-white rounded-xl px-5"
              >
                <Plus className="mr-2 h-4 w-4" /> Set Your First Budget
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {budgets.map((budget, idx) => {
              const pct = Math.min(budget.percentage, 100);
              const isOver = budget.isOverBudget;
              const isWarn = budget.percentage >= 80 && !isOver;
              const statusColor = isOver ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400';
              const statusBg = isOver ? 'bg-red-500/10' : isWarn ? 'bg-amber-500/10' : 'bg-emerald-500/10';
              const glowClass = isOver
                ? 'hover:shadow-[0_20px_40px_-12px_rgba(239,68,68,0.15),0_0_0_1px_rgba(239,68,68,0.2)]'
                : isWarn
                  ? 'hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.15),0_0_0_1px_rgba(245,158,11,0.2)]'
                  : 'card-emerald-glow';

              return (
                <motion.div
                  key={budget.id}
                  custom={3 + idx}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                >
                  <div
                    className={`relative glass-card rounded-2xl p-5 card-hover-glow ${glowClass} transition-all group`}
                  >
                    {isOver && (
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${getCategoryColor(budget.category)}15` }}
                        >
                          {getCategoryIcon(budget.category)}
                        </div>
                        <div>
                          <h4 className="text-sm font-display font-semibold text-white">
                            {getCategoryLabel(budget.category)}
                          </h4>
                          <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusBg} ${statusColor}`}>
                            {isOver ? (
                              <>
                                <AlertTriangle className="h-2.5 w-2.5" /> Over budget
                              </>
                            ) : isWarn ? (
                              <>
                                <AlertTriangle className="h-2.5 w-2.5" /> Warning
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-2.5 w-2.5" /> On track
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <CircularProgress percentage={budget.percentage} size={56} strokeWidth={5} isOverBudget={isOver} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-display font-bold ${statusColor}`}>
                            {Math.round(budget.percentage)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">
                          Spent: <span className="text-gray-300 font-medium">{formatIndianCurrency(budget.spent)}</span>
                        </span>
                        <span className="text-gray-500">
                          Limit: <span className="text-gray-300 font-medium">{formatIndianCurrency(budget.amount)}</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${isOver
                            ? 'bg-gradient-to-r from-red-500 to-red-400'
                            : isWarn
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">
                        Remaining: <span className="text-gray-400 font-medium">{formatIndianCurrency(Math.max(budget.amount - budget.spent, 0))}</span>
                      </p>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        disabled={deletingId === budget.id}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
