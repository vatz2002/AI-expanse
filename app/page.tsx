'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  IndianRupee,
  BarChart3,
  Target,
  Brain,
  Users,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { SignedIn, SignedOut } from '@clerk/nextjs';

/* ═══════════════ Animated Counter ═══════════════ */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

/* ═══════════════ Feature Card ═══════════════ */
const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'AI Categorization',
    description: 'Automatically detects Swiggy, Zomato, Jio, Amazon and 100+ Indian merchants with smart AI.',
    gradient: 'from-violet-500 to-indigo-500',
    glow: 'group-hover:shadow-violet-500/20',
  },
  {
    icon: <IndianRupee className="h-6 w-6" />,
    title: 'Indian Format',
    description: 'See ₹1,25,000 not ₹125,000. Built natively for lakhs, crores, and Indian habits.',
    gradient: 'from-pink-500 to-rose-500',
    glow: 'group-hover:shadow-pink-500/20',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Smart Insights',
    description: 'Get AI-powered insights in simple language about your spending patterns and trends.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'group-hover:shadow-amber-500/20',
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: 'Budget Limits',
    description: 'Set monthly budgets by category with smart warnings at 80% and real-time tracking.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Trend Analysis',
    description: 'Compare month-over-month spending with beautiful interactive charts and breakdowns.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'group-hover:shadow-blue-500/20',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Group Splitting',
    description: 'Split expenses with friends, roommates, or travel buddies. Settle up with ease.',
    gradient: 'from-fuchsia-500 to-purple-500',
    glow: 'group-hover:shadow-fuchsia-500/20',
  },
];

/* ═══════════════ Main Component ═══════════════ */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const [stats, setStats] = useState([
    { value: 10000, suffix: '+', label: 'Active Users' },
    { value: 50, suffix: 'L+', label: 'Expenses Tracked' },
    { value: 25, suffix: '+', label: 'Categories' },
    { value: 99, suffix: '%', label: 'AI Accuracy' },
  ]);

  useEffect(() => {
    fetch('/api/stats/global')
      .then(res => res.json())
      .then(data => {
        setStats([
          { value: data.activeUsers, suffix: '+', label: 'Active Users' },
          { value: Math.floor(data.totalExpensesTracked / 100000), suffix: 'L+', label: 'Expenses Tracked' },
          { value: data.categories, suffix: '+', label: 'Categories' },
          { value: data.aiAccuracy, suffix: '%', label: 'AI Accuracy' },
        ]);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#06070e] relative z-0">
      <AnimatedBackground />
      {/* ═══════════════ Navigation ═══════════════ */}
      <nav className="fixed top-0 w-full z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-card mt-3 rounded-2xl px-4 sm:px-6">
            <div className="flex justify-between items-center h-14">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <IndianRupee className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold font-display bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  ExpenseAI
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-1.5"
                  >
                    Sign In
                  </Link>
                  <Link href="/sign-up">
                    <Button className="gradient-primary text-white rounded-xl text-sm px-4 py-2 h-auto shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all">
                      Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button className="bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm px-4 py-2 h-auto transition-all border border-white/10 flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
                    </Button>
                  </Link>
                </SignedIn>
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════ Hero Section ═══════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
          {/* Mesh gradient */}
          <div className="absolute inset-0 gradient-mesh" />
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] animate-float" />
          <div className="absolute top-1/3 right-1/6 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-fuchsia-600/8 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </motion.div>

        <motion.div style={{ scale }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 glass-card"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-violet-300/90">
                AI-Powered · Built for India
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-6 tracking-tight leading-[0.95]">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="block gradient-text"
              >
                Track Every Rupee
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="block text-white mt-2"
              >
                Master Your Money
              </motion.span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              India&apos;s smartest expense tracker with AI categorization.
              Built for INR, Indian habits, and your financial freedom.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <SignedOut>
                <Button size="lg" className="gradient-primary text-white text-base px-8 py-6 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5" asChild>
                  <Link href="/sign-up">
                    Start Tracking Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-2xl border-white/10 text-gray-300 hover:bg-white/[0.04] hover:border-white/20 transition-all" asChild>
                  <Link href="/sign-in">
                    Sign In
                  </Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button size="lg" className="gradient-primary text-white text-base px-8 py-6 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5" asChild>
                  <Link href="/dashboard">
                    Go to your Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </SignedIn>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-14 flex items-center justify-center gap-8 sm:gap-12 text-xs text-gray-500"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-400/50" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-400/50" />
                <span>AI categorization</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-violet-400/50" />
                <span>Made for India</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full border border-gray-600/50 flex justify-center">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1 h-2.5 bg-gray-500/50 rounded-full mt-1.5"
            />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ Stats Section ═══════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="glass-card rounded-3xl p-8 sm:p-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="text-3xl sm:text-4xl font-display font-bold text-white mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ Features Section ═══════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Built for Indian
              <span className="gradient-text"> Spending Habits</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Every feature designed with Indian users in mind — from smart AI to INR formatting.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="group"
              >
                <div className={`glass-card rounded-2xl p-6 sm:p-8 h-full card-hover-glow ${feature.glow} transition-all duration-500`}>
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} text-white mb-5 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-display font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA Section ═══════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-4xl mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl" />
          <div className="relative glass-card gradient-border rounded-3xl p-10 sm:p-14 text-center overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to Master
              <br />
              <span className="gradient-text">Your Money?</span>
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto">
              Join thousands of Indians tracking their expenses smarter with AI-powered insights.
            </p>
            <SignedOut>
              <Button size="lg" className="gradient-primary text-white text-base px-8 py-6 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5" asChild>
                <Link href="/sign-up">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button size="lg" className="gradient-primary text-white text-base px-8 py-6 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </SignedIn>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ Footer ═══════════════ */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <IndianRupee className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-display font-semibold text-gray-500">ExpenseAI</span>
          </div>
          <p className="text-sm text-gray-600">
            © 2026 ExpenseAI. Made with ❤️ for India.
          </p>
        </div>
      </footer>
    </div>
  );
}
