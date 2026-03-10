import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/dashboard/DashboardNav';
import Sidebar from '@/components/dashboard/Sidebar';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen bg-[#06070e] relative z-0">
      {/* Global Scroll Parallax Background */}
      <AnimatedBackground />

      {/* Desktop Sidebar (Left locked) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Top Navigation (only visible < md) */}
        <div className="md:hidden sticky top-0 z-40">
          <DashboardNav />
        </div>

        {/* Page Content */}
        <main className="flex-1 pb-24 md:pb-8 relative z-10 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
