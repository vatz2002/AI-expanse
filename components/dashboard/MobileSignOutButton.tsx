'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

export default function MobileSignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ sessionId: undefined })}
      className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium text-sm"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
