import { currentUser } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { UserProfile } from '@clerk/nextjs';
import { formatIndianCurrency } from '@/lib/currency';
import { Receipt, Users, Wallet, TrendingUp } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

async function getProfileStats(userId: string) {
  const [expenseCount, groupCount, totalSpentResult] = await Promise.all([
    prisma.expense.count({ where: { userId } }),
    prisma.groupMember.count({ where: { userId } }),
    prisma.expense.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  return {
    expenseCount,
    groupCount,
    totalSpent: totalSpentResult._sum.amount?.toNumber() || 0,
  };
}

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) return null;

  const stats = await getProfileStats(user.id);

  const kpis = [
    {
      icon: Receipt,
      label: 'Total Expenses',
      value: stats.expenseCount.toString(),
      color: 'text-violet-400',
      bg: 'from-violet-500/20 to-indigo-500/20',
    },
    {
      icon: Users,
      label: 'Groups',
      value: stats.groupCount.toString(),
      color: 'text-sky-400',
      bg: 'from-sky-500/20 to-blue-500/20',
    },
    {
      icon: Wallet,
      label: 'Total Spent',
      value: formatIndianCurrency(stats.totalSpent),
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-orange-500/20',
    },
  ];

  return (
    <div className="page-bg-subtle">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-violet-400" />
              Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">Your account and statistics</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="relative overflow-hidden glass-card rounded-xl p-3.5 group card-hover-glow transition-all">
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
          ))}
        </div>

        {/* Clerk UserProfile */}
        <div className="glass-card rounded-2xl overflow-hidden w-full flex justify-center min-h-[500px]">
          <UserProfile
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none border-none w-full max-w-full',

                // Navigation/Sidebar
                navbar: 'border-r border-white/[0.06] bg-transparent',
                navbarButton: 'text-gray-400 hover:text-white hover:bg-white/[0.04]',
                navbarMobileMenuRow: 'hover:bg-white/[0.04]',
                navbarMobileMenuButton: 'text-gray-400 hover:text-white',

                // Headers & Text
                headerTitle: 'text-white font-display',
                headerSubtitle: 'text-gray-400',
                profileSectionTitle: 'text-gray-400 border-b border-white/[0.06]',
                profileSectionTitleText: 'text-gray-300',
                profileSectionContent: 'text-gray-300 w-full',
                profileSectionPrimaryButton: 'text-violet-400 hover:text-violet-300',

                // Forms
                formFieldLabel: 'text-gray-400',
                formFieldInput: 'bg-white/[0.04] border-white/[0.08] text-white focus:border-violet-500/40',
                formButtonPrimary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700',
                formButtonReset: 'text-gray-400 hover:text-gray-300',

                // Badges & Actions
                badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
                accordionTriggerButton: 'text-gray-300 hover:text-white',
                breadcrumbs: 'text-gray-400',
                menuButton: 'text-gray-400 hover:text-white',
                menuList: 'bg-[#0e0f1a] border border-white/[0.08]',
                menuItem: 'text-gray-300 hover:bg-white/[0.04]',

                // Layout constraints
                pageScrollBox: 'p-4 sm:p-6 w-full',
                scrollBox: 'w-full rounded-none',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
