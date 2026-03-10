'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { formatIndianCurrency, formatCompactIndianCurrency } from '@/lib/currency';
import { formatIndianDate, formatRelativeDate } from '@/lib/date';
import {
  getCategoryLabel,
  getCategoryIcon,
  getCategoryColor,
  getAllCategories,
} from '@/lib/categories';
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Sparkles,
  X,
  ArrowUpDown,
  Wallet,
  Hash,
  TrendingUp,
  Crown,
  CalendarDays,
  Receipt,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { ExpenseCategory } from '@prisma/client';
import { format, isToday, isYesterday } from 'date-fns';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

/* ──────────── Types ──────────── */

interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  aiCategorized: boolean;
  aiConfidence?: number;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type ViewMode = 'list' | 'compact';

/* ──────────── Animation variants ──────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

/* ──────────── Skeleton ──────────── */

function ExpensesSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
    </div>
  );
}

/* ──────────── Main Component ──────────── */

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }
      const response = await fetch(`/api/expenses?${params.toString()}`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeletingId(deleteId);
    try {
      await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setDeletingId(null);
      setDeleteId(null);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSortBy('date-desc');
    setDateFrom('');
    setDateTo('');
  };

  const processedExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const matchesSearch = expense.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const expenseDate = new Date(expense.date);
        const matchesDateFrom = !dateFrom || expenseDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || expenseDate <= new Date(dateTo);
        return matchesSearch && matchesDateFrom && matchesDateTo;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          default:
            return 0;
        }
      });
  }, [expenses, searchTerm, dateFrom, dateTo, sortBy]);

  const groupedExpenses = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    processedExpenses.forEach((exp) => {
      const d = new Date(exp.date);
      let label: string;
      if (isToday(d)) label = 'Today';
      else if (isYesterday(d)) label = 'Yesterday';
      else label = format(d, 'dd MMM yyyy');
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(exp);
    });
    return groups;
  }, [processedExpenses]);

  const activeFiltersCount = [
    searchTerm !== '',
    selectedCategory !== 'ALL',
    dateFrom !== '',
    dateTo !== '',
    sortBy !== 'date-desc',
  ].filter(Boolean).length;

  const totalAmount = processedExpenses.reduce((s, e) => s + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0), 0);
  const avgAmount = processedExpenses.length > 0 ? totalAmount / processedExpenses.length : 0;

  const categoryCounts = new Map<ExpenseCategory, number>();
  processedExpenses.forEach((e) => {
    categoryCounts.set(e.category, (categoryCounts.get(e.category) || 0) + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0));
  });
  let topCategory: ExpenseCategory | null = null;
  let topCategoryAmount = 0;
  categoryCounts.forEach((amt, cat) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategory = cat;
    }
  });

  const highestExpense = processedExpenses.length > 0
    ? processedExpenses.reduce((max, e) => {
      const amt = typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0;
      return amt > (typeof max.amount === 'number' ? max.amount : parseFloat(max.amount as any) || 0) ? e : max;
    })
    : null;

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'amount-desc', label: 'Highest Amount' },
    { value: 'amount-asc', label: 'Lowest Amount' },
  ];

  if (loading) return <ExpensesSkeleton />;

  const kpis = [
    {
      label: 'Total',
      value: formatCompactIndianCurrency(totalAmount),
      icon: Wallet,
      color: 'text-violet-400',
      bg: 'from-violet-500/20 to-indigo-500/20',
    },
    {
      label: 'Count',
      value: processedExpenses.length.toString(),
      icon: Hash,
      color: 'text-sky-400',
      bg: 'from-sky-500/20 to-blue-500/20',
    },
    {
      label: 'Average',
      value: formatCompactIndianCurrency(avgAmount),
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-orange-500/20',
    },
    {
      label: 'Top Category',
      value: topCategory ? getCategoryIcon(topCategory) + ' ' + getCategoryLabel(topCategory).split(' ')[0] : '—',
      icon: Crown,
      color: 'text-pink-400',
      bg: 'from-pink-500/20 to-rose-500/20',
    },
  ];

  return (
    <div className="page-bg-subtle">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-2">
              <Receipt className="h-7 w-7 text-violet-400" />
              Expenses
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track, search and manage every rupee
            </p>
          </div>
          <Link href="/dashboard/expenses/new">
            <Button className="gradient-primary text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all rounded-xl px-5 btn-glow">
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </Link>
        </motion.div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
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

        {/* Search + Filters */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters || activeFiltersCount > 0
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-gray-300 hover:border-white/[0.1]'
                  }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-violet-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <div className="hidden sm:flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/[0.06] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'compact' ? 'bg-white/[0.06] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Category pills */}
            <div className="mt-3 -mx-1 overflow-x-auto scrollbar-thin pb-1">
              <div className="flex gap-1.5 px-1 min-w-max">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${selectedCategory === 'ALL'
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'bg-white/[0.03] text-gray-500 border border-transparent hover:text-gray-300 hover:bg-white/[0.05]'
                    }`}
                >
                  All
                </button>
                {getAllCategories().map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? 'ALL' : cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${selectedCategory === cat
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      : 'bg-white/[0.03] text-gray-500 border border-transparent hover:text-gray-300 hover:bg-white/[0.05]'
                      }`}
                  >
                    <span>{getCategoryIcon(cat)}</span>
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1">
                        <ArrowUpDown className="h-3 w-3" /> Sort By
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {sortOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === opt.value
                              ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                              : 'bg-white/[0.03] text-gray-500 border border-transparent hover:text-gray-300'
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-600 mb-1 block">From</label>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500/40 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-600 mb-1 block">To</label>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500/40 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-red-400/80 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Clear all filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results count */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs text-gray-600">
            {processedExpenses.length === expenses.length
              ? `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`
              : `${processedExpenses.length} of ${expenses.length} expenses`}
            {activeFiltersCount > 0 && (
              <span className="text-violet-400/60 ml-1">
                · {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
          {highestExpense && processedExpenses.length > 1 && (
            <p className="text-[11px] text-gray-600">
              Highest: <span className="text-amber-400/70 font-medium">{formatIndianCurrency(typeof highestExpense.amount === 'number' ? highestExpense.amount : parseFloat(highestExpense.amount as any))}</span>
            </p>
          )}
        </motion.div>

        {/* Expense List */}
        {processedExpenses.length === 0 ? (
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 mb-4">
                <Receipt className="h-7 w-7 text-violet-400/60" />
              </div>
              <h3 className="text-lg font-display font-semibold text-gray-300 mb-1">
                {expenses.length === 0 ? 'No expenses yet' : 'No results'}
              </h3>
              <p className="text-sm text-gray-600 mb-5 max-w-xs mx-auto">
                {expenses.length === 0
                  ? 'Start tracking your spending by adding your first expense.'
                  : 'Try adjusting your search or filters to find what you\'re looking for.'}
              </p>
              {expenses.length === 0 ? (
                <Link href="/dashboard/expenses/new">
                  <Button className="gradient-primary text-white rounded-xl px-5">
                    <Plus className="mr-2 h-4 w-4" /> Add First Expense
                  </Button>
                </Link>
              ) : (
                <Button onClick={clearAllFilters} variant="outline" className="rounded-xl px-5 text-gray-400 border-white/10 hover:border-white/20">
                  <X className="mr-2 h-3.5 w-3.5" /> Clear Filters
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {viewMode === 'list' ? (
                Array.from(groupedExpenses.entries()).map(([dateLabel, items], groupIdx) => {
                  const groupTotal = items.reduce((s, e) => s + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0), 0);
                  return (
                    <motion.div
                      key={dateLabel}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: groupIdx * 0.05 }}
                    >
                      <div className="flex items-center justify-between py-2.5 px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {dateLabel}
                          </span>
                          <span className="text-[10px] text-gray-600 bg-white/[0.03] px-1.5 py-0.5 rounded">
                            {items.length}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          {formatIndianCurrency(groupTotal)}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {items.map((expense) => {
                          const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any) || 0;
                          return (
                            <motion.div
                              key={expense.id}
                              variants={itemVariant}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              layout
                              className="group relative"
                            >
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-105"
                                  style={{ backgroundColor: `${getCategoryColor(expense.category)}12` }}
                                >
                                  {getCategoryIcon(expense.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-gray-200 truncate">
                                      {expense.description}
                                    </p>
                                    {expense.aiCategorized && (
                                      <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-violet-400/80 bg-violet-500/10 px-1.5 py-0.5 rounded-md">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        AI
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {getCategoryLabel(expense.category)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <p className="text-sm font-bold text-gray-100 tabular-nums">
                                    {formatIndianCurrency(amt)}
                                  </p>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                                      <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors">
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                    </Link>
                                    <button
                                      onClick={() => confirmDelete(expense.id)}
                                      disabled={deletingId === expense.id}
                                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  {processedExpenses.map((expense) => {
                    const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any) || 0;
                    return (
                      <motion.div
                        key={expense.id}
                        variants={itemVariant}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group"
                      >
                        <div className="relative overflow-hidden p-3.5 rounded-xl glass-card card-hover-glow transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                              style={{ backgroundColor: `${getCategoryColor(expense.category)}12` }}
                            >
                              {getCategoryIcon(expense.category)}
                            </div>
                            <span className="text-base font-display font-bold text-gray-100 tabular-nums">
                              {formatIndianCurrency(amt)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-200 truncate mb-0.5">
                            {expense.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-gray-600">
                              {getCategoryLabel(expense.category)} · {formatRelativeDate(expense.date)}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                                <button className="p-1 rounded-md hover:bg-white/[0.06] text-gray-600 hover:text-gray-300 transition-colors">
                                  <Edit className="h-3 w-3" />
                                </button>
                              </Link>
                              <button
                                onClick={() => confirmDelete(expense.id)}
                                disabled={deletingId === expense.id}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {expense.aiCategorized && (
                            <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 text-[9px] text-violet-400/60">
                              <Sparkles className="h-2 w-2" />
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={!!deletingId}
      />
    </div>
  );
}
