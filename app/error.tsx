'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#06070e] flex items-center justify-center px-4">
      <div className="gradient-mesh fixed inset-0" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center max-w-md"
      >
        {/* Animated icon */}
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-500/10 mb-6"
        >
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </motion.div>

        <h1 className="text-3xl font-display font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          An unexpected error occurred. Don&apos;t worry, your data is safe.
        </p>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="gradient-primary text-white rounded-xl px-5 shadow-lg shadow-violet-500/20"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
          <Button variant="outline" className="rounded-xl border-white/10 text-gray-400" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
