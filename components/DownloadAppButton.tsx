'use client';

import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DownloadAppButton() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:bottom-10 md:right-10 md:left-auto md:translate-x-0"
      >
        {/* We use an anchor tag to trigger a raw file download from the /public folder */}
        <a href="/ExpenseAI.apk" download="ExpenseAI.apk">
          <Button 
            className="gradient-primary text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all rounded-full px-6 py-6 border border-white/10 group flex items-center gap-3"
          >
            <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start pr-2">
              <span className="font-bold text-sm tracking-wide">Download APK</span>
              <span className="text-[10px] text-white/80">Get the full Android App</span>
            </div>
            <Download className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
          </Button>
        </a>
      </motion.div>
    </AnimatePresence>
  );
}
