'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    isLoading = false,
}: ConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-red-500/10 shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-8 flex items-center justify-end gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={onClose}
                                        disabled={isLoading}
                                        className="text-gray-400 hover:text-white hover:bg-white/10"
                                    >
                                        {cancelLabel}
                                    </Button>
                                    <Button
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                        className="bg-red-500 hover:bg-red-600 text-white border-0"
                                    >
                                        {isLoading ? 'Deleting...' : confirmLabel}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
