'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Users,
  ArrowLeft,
  Link as LinkIcon,
  ArrowRight,
  Info,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function JoinGroupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setInviteCode(code);
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push(`/dashboard/groups/${data.groupId}`), 600);
      } else {
        if (data.groupId) {
          router.push(`/dashboard/groups/${data.groupId}`);
        } else {
          setError(data.error || 'Failed to join group');
        }
      }
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/dashboard/groups">
            <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors mb-5">
              <ArrowLeft className="h-4 w-4" /> Groups
            </button>
          </Link>

          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/25">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Join a Group</h1>
            <p className="text-sm text-gray-500 mt-1.5">Enter the invite code shared with you</p>
          </div>
        </motion.div>

        {/* Join Form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <div className="bg-white/[0.03] border border-indigo-500/15 rounded-2xl p-6 backdrop-blur-sm shadow-xl shadow-black/20">
            <div className="flex flex-col items-center justify-center text-center gap-2 mb-6 text-indigo-400">
              <LinkIcon className="h-6 w-6" />
              <h3 className="text-sm font-medium">Enter Invite Code</h3>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="relative">
                <input
                  id="inviteCode"
                  placeholder="e.g., abc123def456"
                  value={inviteCode}
                  onChange={(e) => { setInviteCode(e.target.value); setError(''); }}
                  required
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-4 text-lg text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] font-mono text-center tracking-widest transition-all shadow-inner"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3"
                  >
                    <p className="text-xs text-rose-400 text-center">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full gradient-primary text-white rounded-xl py-3 text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow disabled:opacity-40 disabled:shadow-none"
                disabled={loading || !inviteCode.trim() || success}
              >
                {success ? (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Joined!</>
                ) : loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</>
                ) : (
                  <><ArrowRight className="mr-2 h-4 w-4" /> Join Group</>
                )}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Help */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
          <div className="mt-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs font-medium text-gray-500">How to get an invite code</span>
            </div>
            <div className="space-y-2">
              {[
                'Ask a group admin to share the invite link',
                'Click the link — the code fills in automatically',
                'Or paste the code above manually',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/[0.04] flex items-center justify-center text-[10px] text-gray-600 flex-shrink-0 mt-0.5 font-medium">
                    {i + 1}
                  </span>
                  <p className="text-xs text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <JoinGroupContent />
    </Suspense>
  );
}
