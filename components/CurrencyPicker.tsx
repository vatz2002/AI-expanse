'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X } from 'lucide-react';
import { SUPPORTED_CURRENCIES, type CurrencyInfo } from '@/lib/currency-convert';

const INR_CURRENCY: CurrencyInfo = {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
};

const ALL_CURRENCIES = [INR_CURRENCY, ...SUPPORTED_CURRENCIES];

interface CurrencyPickerProps {
    selected: string; // currency code
    onChange: (currency: CurrencyInfo) => void;
}

export default function CurrencyPicker({ selected, onChange }: CurrencyPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Focus search on open
    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 50);
    }, [open]);

    const selectedCurrency = ALL_CURRENCIES.find(c => c.code === selected) || INR_CURRENCY;

    const filtered = search.trim()
        ? ALL_CURRENCIES.filter(c =>
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.symbol.includes(search)
        )
        : ALL_CURRENCIES;

    const handleSelect = (currency: CurrencyInfo) => {
        onChange(currency);
        setOpen(false);
        setSearch('');
    };

    return (
        <div ref={ref} className="relative">
            {/* Toggle Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-sm whitespace-nowrap ${open
                        ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                        : selected === 'INR'
                            ? 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                    }`}
            >
                <span className="text-base leading-none">{selectedCurrency.flag}</span>
                <span className="font-medium text-xs">{selectedCurrency.code}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 w-64 bg-gray-900 border border-white/[0.1] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                    >
                        {/* Search */}
                        <div className="p-2 border-b border-white/[0.06]">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search currency..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-7 py-2 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/30"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-60 overflow-y-auto py-1">
                            {filtered.length === 0 ? (
                                <div className="px-3 py-4 text-center">
                                    <p className="text-xs text-gray-600">No currencies found</p>
                                </div>
                            ) : (
                                filtered.map((currency) => {
                                    const isSelected = currency.code === selected;
                                    return (
                                        <button
                                            key={currency.code}
                                            type="button"
                                            onClick={() => handleSelect(currency)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isSelected
                                                    ? 'bg-indigo-500/10 text-indigo-400'
                                                    : 'text-gray-300 hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <span className="text-base leading-none">{currency.flag}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold">{currency.code}</span>
                                                    <span className="text-[10px] text-gray-500">{currency.symbol}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-600 truncate">{currency.name}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
