'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DownloadAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running as a standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      // Log install to analytics if tracking is needed
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
  };

  if (!isInstallable || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:bottom-10 md:right-10 md:left-auto md:translate-x-0"
      >
        <Button 
          onClick={handleInstallClick}
          className="gradient-primary text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all rounded-full px-6 py-6 border border-white/10 group flex items-center gap-3"
        >
          <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-start pr-2">
            <span className="font-bold text-sm tracking-wide">Install App</span>
            <span className="text-[10px] text-white/80">Get the full experience</span>
          </div>
          <Download className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
