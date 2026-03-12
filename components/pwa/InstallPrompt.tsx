'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if the user hasn't seen it recently (optional check)
      const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt');
      if (!hasSeenPrompt) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      localStorage.setItem('hasSeenInstallPrompt', 'true');
    }
    
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
    // Don't show again for 24 hours
    localStorage.setItem('hasSeenInstallPrompt', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-[100] md:bottom-8 md:left-auto md:right-8 md:w-80"
      >
        <div className="bg-[#12131f] border border-white/[0.08] rounded-2xl p-4 shadow-2xl flex flex-col gap-3 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Install ExpenseAI</h4>
                <p className="text-xs text-gray-400">Add to home screen for quick access</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="p-1 hover:bg-white/5 rounded-lg text-gray-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <Button 
            onClick={handleInstallClick}
            className="w-full h-10 gradient-primary text-white rounded-xl text-sm font-medium shadow-lg shadow-violet-500/20"
          >
            Install App
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
