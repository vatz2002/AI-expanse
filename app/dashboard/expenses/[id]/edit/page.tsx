'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getAllCategories, getCategoryLabel, getCategoryIcon } from '@/lib/categories';
import { formatIndianCurrency } from '@/lib/currency';
import { detectForeignCurrency, convertToInr, type DetectedCurrency, type CurrencyInfo } from '@/lib/currency-convert';
import CurrencyPicker from '@/components/CurrencyPicker';
import {
    Sparkles,
    Save,
    ArrowLeft,
    IndianRupee,
    ArrowRightLeft,
    FileText,
    CalendarDays,
    Tag,
    CheckCircle,
    Loader2,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { ExpenseCategory } from '@prisma/client';
import { toast } from 'sonner';

/* ──────────── Types ──────────── */

interface AISuggestion {
    category: ExpenseCategory;
    confidence: number;
    reasoning: string;
}

/* ──────────── Main ──────────── */

export default function EditExpensePage() {
    const router = useRouter();
    const params = useParams();
    const expenseId = params.id as string;

    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
    const [aiApplied, setAiApplied] = useState(false);
    const [saved, setSaved] = useState(false);
    const descRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const currencyDebounceRef = useRef<NodeJS.Timeout | null>(null);

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
    });

    // Fetch existing expense data
    useEffect(() => {
        const fetchExpense = async () => {
            try {
                const response = await fetch(`/api/expenses/${expenseId}`);
                if (!response.ok) throw new Error('Failed to fetch expense');
                const data = await response.json();

                setFormData({
                    amount: data.amount,
                    category: data.category,
                    description: data.description,
                    date: new Date(data.date).toISOString().split('T')[0],
                });
            } catch (error) {
                console.error('Error fetching expense:', error);
                toast.error('Failed to load expense details');
            } finally {
                setInitialLoading(false);
            }
        };

        if (expenseId) {
            fetchExpense();
        }
    }, [expenseId]);

    // Auto-focus on description field after loading
    useEffect(() => {
        if (!initialLoading) {
            setTimeout(() => descRef.current?.focus(), 300);
        }
    }, [initialLoading]);

    /* ── Auto AI categorize on description change (debounced) ── */
    const triggerAICategorize = useCallback(async (desc: string, amount: string) => {
        if (!desc || desc.trim().length < 2) {
            setAiSuggestion(null);
            setAiApplied(false);
            return;
        }

        setAiLoading(true);
        try {
            const response = await fetch('/api/ai/categorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: desc.trim(),
                    amount: parseFloat(amount) || undefined,
                }),
            });

            if (response.ok) {
                const data: AISuggestion = await response.json();
                setAiSuggestion(data);
            }
        } catch (error) {
            console.error('Error getting AI suggestion:', error);
        } finally {
            setAiLoading(false);
        }
    }, []);

    const handleDescriptionChange = (value: string) => {
        setFormData((prev) => ({ ...prev, description: value }));

        // Debounce: wait 500ms after user stops typing
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            triggerAICategorize(value, formData.amount);
        }, 500);
    };

    const handleAmountChange = (value: string) => {
        setFormData((prev) => ({ ...prev, amount: value }));

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

        // Re-trigger AI if description exists (amount can refine the guess)
        if (formData.description.trim().length >= 2) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                triggerAICategorize(formData.description, value);
            }, 600);
        }
    };

    const applyConvertedAmount = () => {
        if (convertedAmount) {
            setFormData((prev) => ({ ...prev, amount: String(convertedAmount.inrAmount) }));
            setDetectedCurrency(null);
            setConvertedAmount(null);
            setSelectedCurrency('INR');
        }
    };

    // When user picks a currency from the dropdown
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

    const handleManualCategorySelect = (cat: ExpenseCategory) => {
        setFormData((prev) => ({ ...prev, category: cat }));
        setAiApplied(false); // User manually overriding AI
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount.replace(/[^0-9.]/g, '')),
                    category: formData.category,
                    description: formData.description,
                    date: new Date(formData.date).toISOString(),
                }),
            });

            if (response.ok) {
                setSaved(true);
                toast.success("Expense updated!");
                setTimeout(() => router.push('/dashboard/expenses'), 600);
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to update expense");
            }
        } catch (error) {
            console.error('Error updating expense:', error);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const confidenceColor =
        (aiSuggestion?.confidence || 0) >= 70
            ? 'text-emerald-400'
            : (aiSuggestion?.confidence || 0) >= 50
                ? 'text-amber-400'
                : 'text-gray-400';

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] pb-24 md:pb-8 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* ═══════════ Header ═══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                >
                    <Link href="/dashboard/expenses">
                        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Expenses
                        </button>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                        <Zap className="h-7 w-7 text-indigo-400" />
                        Edit Expense
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400/50" />
                        Update your expense details
                    </p>
                </motion.div>

                {/* ═══════════ Form ═══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Description */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                            <label className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1.5">
                                <FileText className="h-3 w-3" /> Description
                            </label>
                            <input
                                ref={descRef}
                                type="text"
                                placeholder="e.g., Swiggy order, Uber ride, Jio recharge..."
                                value={formData.description}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                required
                                className="w-full bg-transparent text-lg text-gray-100 placeholder:text-gray-700 focus:outline-none"
                            />
                            {/* AI indicator */}
                            <AnimatePresence>
                                {aiLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2"
                                    >
                                        <span className="text-xs text-indigo-400/60 flex items-center gap-1.5">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Detecting category...
                                        </span>
                                    </motion.div>
                                )}
                                {!aiLoading && aiSuggestion && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="mt-3 p-2.5 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/10"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                                                <span className="text-xs font-medium text-indigo-400">AI Suggested</span>
                                                <span className="text-lg">{getCategoryIcon(aiSuggestion.category)}</span>
                                                <span className="text-xs text-gray-300 font-medium">{getCategoryLabel(aiSuggestion.category)}</span>
                                            </div>
                                            <span className={`text-[11px] font-semibold ${confidenceColor}`}>
                                                {aiSuggestion.confidence}%
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1.5">{aiSuggestion.reasoning}</p>
                                        {/* User can click this to apply the suggestion if they want to override current */}
                                        {formData.category !== aiSuggestion.category && (
                                            <button
                                                type="button"
                                                onClick={() => handleManualCategorySelect(aiSuggestion.category)}
                                                className="mt-2 w-full py-1 rounded bg-indigo-500/20 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                                            >
                                                Change to suggestion
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Amount + Date row */}
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
                                            <span className="text-[11px] text-indigo-400/60 flex items-center gap-1.5">
                                                <Loader2 className="h-3 w-3 animate-spin" /> Converting...
                                            </span>
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
                            </div>

                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                                <label className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1.5">
                                    <CalendarDays className="h-3 w-3" /> Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    className="w-full bg-transparent text-sm text-gray-200 focus:outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Category selector */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                            <label className="text-xs font-medium text-gray-500 mb-3 block flex items-center gap-1.5">
                                <Tag className="h-3 w-3" /> Category
                                {aiApplied && formData.category && (
                                    <span className="text-indigo-400/60 flex items-center gap-1 ml-1">
                                        <Sparkles className="h-2.5 w-2.5" /> auto-detected
                                    </span>
                                )}
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {getAllCategories().map((cat) => {
                                    const isSelected = formData.category === cat;
                                    const isAiSuggested = aiSuggestion?.category === cat && !isSelected;
                                    return (
                                        <motion.button
                                            key={cat}
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleManualCategorySelect(cat)}
                                            className={`relative p-2.5 rounded-xl border transition-all text-center ${isSelected
                                                ? 'bg-indigo-500/15 border-indigo-500/30'
                                                : isAiSuggested
                                                    ? 'bg-white/[0.03] border-indigo-500/15 border-dashed'
                                                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
                                                }`}
                                        >
                                            <div className="text-xl mb-0.5">{getCategoryIcon(cat)}</div>
                                            <div className={`text-[10px] font-medium leading-tight ${isSelected ? 'text-indigo-400' : 'text-gray-500'
                                                }`}>
                                                {getCategoryLabel(cat)}
                                            </div>
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="categoryCheck"
                                                    className="absolute -top-1 -right-1"
                                                >
                                                    <CheckCircle className="h-4 w-4 text-indigo-400 fill-indigo-400/20" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-2">
                            <Link href="/dashboard/expenses" className="flex-1">
                                <Button type="button" variant="outline" className="w-full rounded-xl border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="flex-1 gradient-primary text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow disabled:opacity-40 disabled:shadow-none"
                                disabled={loading || !formData.category || !formData.amount || !formData.description || saved}
                            >
                                {saved ? (
                                    <><CheckCircle className="mr-2 h-4 w-4" /> Updated!</>
                                ) : loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div >
    );
}
