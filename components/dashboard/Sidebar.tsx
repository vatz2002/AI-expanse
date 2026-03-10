'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IndianRupee, LayoutDashboard, Receipt, Target, UserCircle, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
  { name: 'Budgets', href: '/dashboard/budgets', icon: Target },
  { name: 'Groups', href: '/dashboard/groups', icon: Users },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  
  // Collapse state stored in localStorage for persistence
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#06070e]/80 backdrop-blur-2xl border-r border-white/[0.04] p-4 z-40 transition-all" />
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-[#06070e]/80 backdrop-blur-3xl border-r border-white/[0.04] p-4 z-40 group/sidebar"
    >
      {/* ───── Logo ───── */}
      <div className="flex items-center gap-3 mb-10 mt-2 px-2 overflow-hidden h-10 w-full whitespace-nowrap">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]">
          <IndianRupee className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10, display: "none" }}
              animate={{ opacity: 1, x: 0, display: "block" }}
              exit={{ opacity: 0, x: -10, display: "none" }}
              transition={{ duration: 0.2 }}
              className="text-xl font-display font-bold bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent transform-gpu"
            >
              ExpenseAI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ───── Navigation Links ───── */}
      <nav className="flex-1 space-y-1.5 overflow-x-hidden">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.name} href={item.href} className="block relative">
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ease-out group/item',
                  active
                    ? 'text-white translate-x-1'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] hover:translate-x-1'
                )}
              >
                {/* Active Indicator Background */}
                {active && (
                  <motion.div
                    layoutId="sidebarActiveBg"
                    className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent rounded-xl border border-violet-500/20 shadow-[inset_0_0_20px_rgba(124,58,237,0.05)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                
                {/* Active Left Pill */}
                {active && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-r-full shadow-[0_0_10px_rgba(124,58,237,0.8)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <div className={cn(
                  "relative z-10 p-1.5 rounded-lg transition-transform duration-300",
                  active ? "text-violet-400 drop-shadow-[0_0_8px_rgba(124,58,237,0.5)] scale-110" : "group-hover/item:scale-110 group-hover/item:text-gray-300"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10, display: "none" }}
                      animate={{ opacity: 1, x: 0, display: "block" }}
                      exit={{ opacity: 0, x: -10, display: "none" }}
                      transition={{ duration: 0.2 }}
                      className="relative z-10 text-sm font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ───── Footer Actions ───── */}
      <div className="mt-auto space-y-2 relative">
        <button
          onClick={() => signOut({ sessionId: undefined })}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group/logout hover:translate-x-1"
        >
          <div className="relative z-10 p-1.5 rounded-lg group-hover/logout:scale-110 transition-transform">
            <LogOut className="h-5 w-5" />
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10, display: "none" }}
                animate={{ opacity: 1, x: 0, display: "block" }}
                exit={{ opacity: 0, x: -10, display: "none" }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-12 bg-white/[0.05] border border-white/[0.08] rounded-r-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] backdrop-blur-xl transition-colors z-50 opacity-0 group-hover/sidebar:opacity-100"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
