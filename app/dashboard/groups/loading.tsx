import { Users, Plus, Link as LinkIcon } from 'lucide-react';

export default function GroupsLoading() {
  return (
    <div className="page-bg-subtle min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <div className="h-8 w-32 bg-white/10 rounded-md animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-white/5 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-white/5 rounded-xl animate-pulse"></div>
            <div className="h-10 w-28 bg-violet-500/20 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-3.5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/5 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 w-16 bg-white/10 rounded-md animate-pulse"></div>
                <div className="h-3 w-12 bg-white/5 rounded-md animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Group Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded-md animate-pulse"></div>
                  <div className="h-3 w-20 bg-white/5 rounded-md animate-pulse"></div>
                </div>
              </div>

              {/* Avatars */}
              <div className="flex items-center mb-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((a) => (
                    <div key={a} className="w-8 h-8 rounded-full border-2 border-[#0a0b14] bg-white/10 animate-pulse"></div>
                  ))}
                </div>
                <div className="ml-3 h-3 w-20 bg-white/5 rounded-md animate-pulse"></div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <div className="h-4 w-24 bg-white/5 rounded-md animate-pulse"></div>
                <div className="h-6 w-16 bg-white/5 rounded-md animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
