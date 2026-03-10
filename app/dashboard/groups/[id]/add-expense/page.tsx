'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users,
  IndianRupee,
  ArrowRightLeft,
  CalendarDays,
  FileText,
  Tag,
  UserCheck,
  SplitSquareVertical,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExpenseCategory } from '@prisma/client';
import { getAllCategories, getCategoryLabel, getCategoryIcon } from '@/lib/categories';
import { formatIndianCurrency } from '@/lib/currency';
import { detectForeignCurrency, convertToInr, type DetectedCurrency, type CurrencyInfo } from '@/lib/currency-convert';
import CurrencyPicker from '@/components/CurrencyPicker';

import { toast } from 'sonner';

/* ──────────── Types ──────────── */

interface GroupMember {
  id: string;
  userId: string;
  user: { name: string | null; email: string };
}

interface AISuggestion {
  category: ExpenseCategory;
  confidence: number;
  reasoning: string;
}

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-pink-500 to-fuchsia-600',
  'from-amber-500 to-yellow-600',
];

/* ──────────── Page ──────────── */

export default function AddGroupExpensePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupName, setGroupName] = useState('');
  const [saved, setSaved] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const currencyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiApplied, setAiApplied] = useState(false);

  // Currency conversion state
  const [detectedCurrency, setDetectedCurrency] = useState<DetectedCurrency | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<{ inrAmount: number; rate: number } | null>(null);
  const [convertingCurrency, setConvertingCurrency] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');

  const [formData, setFormData] = useState({
    amount: '',
    category: '' as ExpenseCategory | '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paidBy: '',
    splitType: 'equal' as 'equal' | 'custom' | 'single',
    singleUserId: '',
  });
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  /* ── Fetch group members ── */
  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups`);
      const allGroups = await response.json();
      if (Array.isArray(allGroups)) {
        const currentGroup = allGroups.find((g: any) => g.id === params.id);
        if (currentGroup) {
          setGroupName(currentGroup.name || '');
          if (currentGroup.members) {
            setMembers(currentGroup.members);
            const splits: Record<string, string> = {};
            currentGroup.members.forEach((m: GroupMember) => { splits[m.userId] = ''; });
            setCustomSplits(splits);
          }
        }
      }
    } catch (error) { console.error('Error:', error); }
  }, [params.id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { setTimeout(() => descRef.current?.focus(), 300); }, []);

  /* ── AI Auto-categorize (debounced) ── */
  const triggerAI = useCallback(async (desc: string, amount: string) => {
    if (!desc || desc.trim().length < 2) { setAiSuggestion(null); setAiApplied(false); return; }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc.trim(), amount: parseFloat(amount) || undefined }),
      });
      if (res.ok) {
        const data: AISuggestion = await res.json();
        setAiSuggestion(data);
        if (data.confidence >= 50) {
          setFormData(prev => {
            if (!prev.category || aiApplied) { setAiApplied(true); return { ...prev, category: data.category }; }
            return prev;
          });
        }
      }
    } catch { /* ignore */ }
    finally { setAiLoading(false); }
  }, [aiApplied]);

  const handleDescChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => triggerAI(value, formData.amount), 500);
  };

  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value }));

    // Detect foreign currency
    if (currencyDebounceRef.current) clearTimeout(currencyDebounceRef.current);
    currencyDebounceRef.current = setTimeout(async () => {
      const detected = detectForeignCurrency(value);
      setDetectedCurrency(detected);
      if (detected) {
        setConvertingCurrency(true);
        try {
          const result = await convertToInr(detected.amount, detected.code);
          setConvertedAmount(result);
        } catch { setConvertedAmount(null); }
        finally { setConvertingCurrency(false); }
      } else {
        setConvertedAmount(null);
      }
    }, 300);

    if (formData.description.trim().length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => triggerAI(formData.description, value), 600);
    }
  };

  const applyConvertedAmount = () => {
    if (convertedAmount) {
      setFormData(prev => ({ ...prev, amount: String(convertedAmount.inrAmount) }));
      setDetectedCurrency(null);
      setConvertedAmount(null);
      setSelectedCurrency('INR');
    }
  };

  const handleCurrencyPickerChange = async (currency: CurrencyInfo) => {
    setSelectedCurrency(currency.code);
    const rawAmount = parseFloat(formData.amount.replace(/[^0-9.]/g, ''));
    if (currency.code === 'INR') {
      setDetectedCurrency(null);
      setConvertedAmount(null);
      return;
    }
    if (!isNaN(rawAmount) && rawAmount > 0) {
      setDetectedCurrency({ code: currency.code, amount: rawAmount, info: currency });
      setConvertingCurrency(true);
      try {
        const result = await convertToInr(rawAmount, currency.code);
        setConvertedAmount(result);
      } catch { setConvertedAmount(null); }
      finally { setConvertingCurrency(false); }
    } else {
      setDetectedCurrency({ code: currency.code, amount: 0, info: currency });
      setConvertedAmount(null);
    }
  };

  const handleCategorySelect = (cat: ExpenseCategory) => {
    setFormData(prev => ({ ...prev, category: cat }));
    setAiApplied(false);
  };

  /* ── Split helpers ── */
  const equalPerPerson = formData.amount && members.length > 0 ? parseFloat(formData.amount) / members.length : 0;

  const calculateEqualSplit = () => {
    if (!formData.amount || members.length === 0) return;
    const perPerson = (parseFloat(formData.amount) / members.length).toFixed(2);
    const newSplits: Record<string, string> = {};
    members.forEach(m => { newSplits[m.userId] = perPerson; });
    setCustomSplits(newSplits);
  };

  const handleSplitTypeChange = (type: 'equal' | 'custom' | 'single') => {
    setFormData({ ...formData, splitType: type });
    if (type === 'custom') calculateEqualSplit();
  };

  const totalCustomSplit = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalAmount = parseFloat(formData.amount) || 0;
  const splitDifference = totalCustomSplit - totalAmount;
  const isSplitValid = Math.abs(splitDifference) < 0.01;

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = parseFloat(formData.amount.replace(/[^0-9.]/g, ''));
      let customSplitsArray = undefined;
      let apiSplitType = formData.splitType;

      if (formData.splitType === 'custom') {
        if (Math.abs(totalCustomSplit - amount) > 0.01) {
          alert(`Splits (₹${totalCustomSplit.toFixed(2)}) must equal total (₹${amount.toFixed(2)})`);
          setLoading(false); return;
        }
        customSplitsArray = Object.entries(customSplits).map(([userId, amt]) => ({ userId, amount: parseFloat(amt) }));
      } else if (formData.splitType === 'single') {
        if (!formData.singleUserId) {
          alert('Please select a member for the single split.');
          setLoading(false); return;
        }
        customSplitsArray = [{ userId: formData.singleUserId, amount }];
        apiSplitType = 'custom' as any;
      }

      const response = await fetch(`/api/groups/${params.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount, category: formData.category, description: formData.description,
          date: new Date(formData.date).toISOString(), paidBy: formData.paidBy,
          splitType: apiSplitType, customSplits: customSplitsArray,
        }),
      });
      if (response.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => router.push(`/dashboard/groups/${params.id}`), 500);
      }
      else { const data = await response.json(); alert(data.error || 'Failed'); }
    } catch { alert('Failed to add expense'); }
    finally { setLoading(false); }
  };

  // Helper functions
  const getMemberInitial = (m: GroupMember) => (m.user.name || m.user.email)[0]?.toUpperCase() || 'U';
  const confidenceColor = (aiSuggestion?.confidence || 0) >= 70 ? 'text-emerald-400' : (aiSuggestion?.confidence || 0) >= 50 ? 'text-amber-400' : 'text-gray-400';



  /* ──────────── Render ──────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">

        {/* ═══════════ Header ═══════════ */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href={`/dashboard/groups/${params.id}`}>
            <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors mb-3">
              <ArrowLeft className="h-4 w-4" /> {groupName || 'Group'}
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Zap className="h-7 w-7 text-indigo-400" /> Add Group Expense
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400/50" />
            Split with {members.length} member{members.length !== 1 ? 's' : ''} · AI auto-detects category
          </p>
        </motion.div>

        {/* ═══════════ Form ═══════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Description + AI */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <label className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Description
              </label>
              <input
                ref={descRef}
                type="text"
                placeholder="e.g., Dinner at restaurant, Uber ride, Groceries..."
                value={formData.description}
                onChange={(e) => handleDescChange(e.target.value)}
                required
                className="w-full bg-transparent text-lg text-gray-100 placeholder:text-gray-700 focus:outline-none"
              />
              <AnimatePresence>
                {aiLoading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                    <span className="text-xs text-indigo-400/60 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Detecting category...</span>
                  </motion.div>
                )}
                {!aiLoading && aiSuggestion && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 p-2.5 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-xs font-medium text-indigo-400">AI Detected</span>
                        <span className="text-lg">{getCategoryIcon(aiSuggestion.category)}</span>
                        <span className="text-xs text-gray-300 font-medium">{getCategoryLabel(aiSuggestion.category)}</span>
                      </div>
                      <span className={`text-[11px] font-semibold ${confidenceColor}`}>{aiSuggestion.confidence}%</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5">{aiSuggestion.reasoning}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <IndianRupee className="h-3 w-3" /> Amount
                  </label>
                  <CurrencyPicker selected={selectedCurrency} onChange={handleCurrencyPickerChange} />
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount in ₹"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                  className="w-full bg-transparent text-xl font-bold text-gray-100 placeholder:text-gray-600 focus:outline-none tabular-nums"
                />
                {/* Live Currency Conversion Banner */}
                <AnimatePresence>
                  {convertingCurrency && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                      <span className="text-[11px] text-indigo-400/60 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Converting...</span>
                    </motion.div>
                  )}
                  {!convertingCurrency && detectedCurrency && convertedAmount && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{detectedCurrency.info.flag}</span>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-300">
                              <span className="text-gray-500">{detectedCurrency.info.symbol}{detectedCurrency.amount}</span>
                              <ArrowRightLeft className="h-2.5 w-2.5 inline mx-1 text-gray-600" />
                              <span className="font-semibold text-emerald-400">{formatIndianCurrency(convertedAmount.inrAmount)}</span>
                            </p>
                            <p className="text-[10px] text-gray-600">1 {detectedCurrency.code} = ₹{convertedAmount.rate}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={applyConvertedAmount}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          Use {formatIndianCurrency(convertedAmount.inrAmount)}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {formData.amount && members.length > 0 && formData.splitType === 'equal' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-indigo-400/70 mt-1.5">
                    {formatIndianCurrency(equalPerPerson)} / person
                  </motion.p>
                )}
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <label className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Date
                </label>
                <input
                  type="date" value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full bg-transparent text-sm text-gray-200 focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Category Grid */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <label className="text-xs font-medium text-gray-500 mb-3 block flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Category
                {aiApplied && formData.category && (
                  <span className="text-indigo-400/60 flex items-center gap-1 ml-1">
                    <Sparkles className="h-2.5 w-2.5" /> auto
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {getAllCategories().map((cat) => {
                  const isSelected = formData.category === cat;
                  const isAiSuggested = aiSuggestion?.category === cat && !isSelected;
                  return (
                    <motion.button
                      key={cat} type="button" whileTap={{ scale: 0.95 }}
                      onClick={() => handleCategorySelect(cat)}
                      className={`relative p-2.5 rounded-xl border transition-all text-center ${isSelected ? 'bg-indigo-500/15 border-indigo-500/30'
                        : isAiSuggested ? 'bg-white/[0.03] border-indigo-500/15 border-dashed'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
                        }`}
                    >
                      <div className="text-xl mb-0.5">{getCategoryIcon(cat)}</div>
                      <div className={`text-[10px] font-medium leading-tight ${isSelected ? 'text-indigo-400' : 'text-gray-500'}`}>
                        {getCategoryLabel(cat)}
                      </div>
                      {isSelected && (
                        <motion.div layoutId="groupCatCheck" className="absolute -top-1 -right-1">
                          <Check className="h-4 w-4 text-indigo-400 fill-indigo-400/20" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Paid By */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <label className="text-xs font-medium text-gray-500 mb-3 block flex items-center gap-1.5">
                <UserCheck className="h-3 w-3" /> Paid By
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {members.map((member, i) => {
                  const isSelected = formData.paidBy === member.userId;
                  return (
                    <motion.button
                      key={member.userId} type="button" whileTap={{ scale: 0.95 }}
                      onClick={() => setFormData({ ...formData, paidBy: member.userId })}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${isSelected ? 'bg-indigo-500/15 border-indigo-500/30' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
                        }`}
                    >
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                        {getMemberInitial(member)}
                      </div>
                      <span className={`text-xs font-medium truncate ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`}>
                        {member.user.name || member.user.email.split('@')[0]}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 ml-auto flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Split Settings */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <label className="text-xs font-medium text-gray-500 mb-3 block flex items-center gap-1.5">
                <SplitSquareVertical className="h-3 w-3" /> Split
              </label>

              {/* Toggle */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(['equal', 'custom', 'single'] as const).map((type) => (
                  <button
                    key={type} type="button"
                    onClick={() => handleSplitTypeChange(type)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.splitType === type
                      ? 'gradient-primary border-transparent text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/[0.1]'
                      }`}
                  >
                    {type === 'equal' ? (
                      <><Users className="h-4 w-4 mx-auto mb-1" /> Equal</>
                    ) : type === 'custom' ? (
                      <><SplitSquareVertical className="h-4 w-4 mx-auto mb-1" /> Custom</>
                    ) : (
                      <><UserCheck className="h-4 w-4 mx-auto mb-1" /> Single</>
                    )}
                  </button>
                ))}
              </div>

              {/* Equal Preview */}
              {formData.splitType === 'equal' && (
                <AnimatePresence>
                  {formData.amount && members.length > 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                      {members.map((member, i) => (
                        <div key={member.userId} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[9px] font-medium`}>
                              {getMemberInitial(member)}
                            </div>
                            <span className="text-xs text-gray-400">{member.user.name || member.user.email.split('@')[0]}</span>
                          </div>
                          <span className="text-xs font-semibold text-indigo-400 tabular-nums">{formatIndianCurrency(equalPerPerson)}</span>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="bg-white/[0.02] rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-600">Enter an amount to preview split</p>
                    </div>
                  )}
                </AnimatePresence>
              )}

              {/* Custom Split */}
              {formData.splitType === 'custom' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-600">Enter amount per member</p>
                    <button type="button" onClick={calculateEqualSplit} className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">Auto-fill</button>
                  </div>
                  <div className="space-y-1.5">
                    {members.map((member, i) => (
                      <div key={member.userId} className="flex items-center gap-3 bg-white/[0.02] rounded-xl p-3">
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0`}>
                          {getMemberInitial(member)}
                        </div>
                        <span className="text-xs text-gray-400 flex-1 min-w-0 truncate">{member.user.name || member.user.email}</span>
                        <div className="w-24 flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1.5">
                          <span className="text-[10px] text-gray-600">₹</span>
                          <input
                            type="number" step="0.01" placeholder="0"
                            value={customSplits[member.userId] || ''}
                            onChange={(e) => setCustomSplits({ ...customSplits, [member.userId]: e.target.value })}
                            className="w-full bg-transparent text-xs text-gray-200 text-right focus:outline-none tabular-nums"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Validation */}
                  <div className={`rounded-xl p-3.5 border transition-colors ${totalAmount === 0 ? 'bg-white/[0.02] border-white/[0.06]'
                    : isSplitValid ? 'bg-emerald-500/[0.04] border-emerald-500/15'
                      : 'bg-rose-500/[0.04] border-rose-500/15'
                    }`}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-gray-500">Total</span>
                      <span className="text-gray-300 font-medium tabular-nums">{formatIndianCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Split</span>
                      <span className={`font-medium tabular-nums ${totalAmount === 0 ? 'text-gray-500' : isSplitValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatIndianCurrency(totalCustomSplit)}
                      </span>
                    </div>
                    {totalAmount > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.04]">
                        {isSplitValid ? (
                          <><Check className="h-3 w-3 text-emerald-400" /><p className="text-[11px] text-emerald-400">Splits match ✓</p></>
                        ) : (
                          <><AlertCircle className="h-3 w-3 text-rose-400" /><p className="text-[11px] text-rose-400">{splitDifference > 0 ? `₹${splitDifference.toFixed(2)} over` : `₹${Math.abs(splitDifference).toFixed(2)} under`}</p></>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Single Split Option */}
              {formData.splitType === 'single' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
                  <p className="text-xs text-gray-500 mb-2">Select the member who is responsible for the full {formatIndianCurrency(totalAmount)}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {members.map((member, i) => {
                      const isSelected = formData.singleUserId === member.userId;
                      return (
                        <motion.button
                          key={`single-${member.userId}`} type="button" whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, singleUserId: member.userId })}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${isSelected ? 'bg-indigo-500/15 border-indigo-500/30' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
                            }`}
                        >
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                            {getMemberInitial(member)}
                          </div>
                          <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`}>
                            {member.user.name || member.user.email.split('@')[0]}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 ml-auto flex-shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 rounded-xl border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20">
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow disabled:opacity-40 disabled:shadow-none"
                disabled={loading || !formData.paidBy || !formData.amount || !formData.description || !formData.category || (formData.splitType === 'custom' && !isSplitValid) || (formData.splitType === 'single' && !formData.singleUserId) || saved}
              >
                {saved ? <><Check className="mr-2 h-4 w-4" /> Added!</>
                  : loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                    : <><Check className="mr-2 h-4 w-4" /> Add Expense</>}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div >
  );
}
