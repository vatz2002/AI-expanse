'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IndianRupee, LayoutDashboard, Receipt, Target, UserCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
  { name: 'Budgets', href: '/dashboard/budgets', icon: Target },
  { name: 'Groups', href: '/dashboard/groups', icon: Users },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircle },
];

export default function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <>
      {/* ===== TOP NAVBAR ===== */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#06070e]/80 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all group-hover:scale-105">
                <IndianRupee className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent hidden sm:inline">
                ExpenseAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center bg-white/[0.03] rounded-2xl p-1 border border-white/[0.04]">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={cn(
                        'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                        active
                          ? 'text-white'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-violet-500/15 to-indigo-500/15 rounded-xl border border-violet-500/20"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <item.icon className={cn('h-4 w-4 relative z-10', active && 'text-violet-400')} />
                      <span className="relative z-10">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE BOTTOM TAB BAR ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="h-6 bg-gradient-to-t from-[#06070e] to-transparent pointer-events-none" />
        <div className="bg-[#06070e]/95 backdrop-blur-xl border-t border-white/[0.04] px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-16">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center justify-center w-16 h-full transition-all duration-300',
                    active ? 'text-violet-400' : 'text-gray-600'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="mobileTab"
                      className="absolute -top-[1px] inset-x-0 mx-auto w-10 h-[3px] rounded-b-full bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 shadow-[0_2px_8px_rgba(139,92,246,0.5)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className={cn(
                    'p-1.5 rounded-lg transition-all',
                    active && 'bg-violet-500/10'
                  )}>
                    <item.icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]')} />
                  </div>
                  <span className={cn(
                    'text-[10px] mt-0.5 font-medium',
                    active ? 'text-violet-500 font-semibold dark:text-violet-300' : 'text-gray-500 dark:text-gray-500'
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
