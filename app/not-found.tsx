'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06070e] flex items-center justify-center px-4">
      <div className="gradient-mesh fixed inset-0" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center max-w-md"
      >
        {/* Big 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <span className="text-8xl sm:text-9xl font-display font-black gradient-text">404</span>
        </motion.div>

        <h1 className="text-2xl font-display font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Button className="gradient-primary text-white rounded-xl px-5 shadow-lg shadow-violet-500/20" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Button variant="outline" className="rounded-xl border-white/10 text-gray-400" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
