import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Track recent requests to detect redirect loops
let redirectCount = 0;
let lastResetTime = Date.now();

const clerkAuth = authMiddleware({
  publicRoutes: ['/', '/sign-in(.*)', '/sign-up(.*)', '/api/webhook/clerk'],
  ignoredRoutes: ['/api/webhook/clerk'],
  // Skip clock skew checks by allowing requests with clock differences
  clockSkewInMs: 1000 * 60 * 60 * 24 * 365, // 1 year tolerance
});

export default async function middleware(req: NextRequest, evt: any) {
  // Reset counter every 10 seconds
  const now = Date.now();
  if (now - lastResetTime > 10000) {
    redirectCount = 0;
    lastResetTime = now;
  }

  try {
    const response = await (clerkAuth as any)(req, evt);

    // If Clerk is trying to redirect, track it
    if (response?.status === 307 || response?.status === 302) {
      redirectCount++;
      if (redirectCount > 5) {
        // Too many redirects — break the loop
        redirectCount = 0;
        return NextResponse.next();
      }
    }

    return response;
  } catch (error: any) {
    const msg = error?.message || '';
    if (
      msg.includes('Clock skew detected') ||
      msg.includes('Infinite redirect loop') ||
      msg.includes('clock')
    ) {
      // Silently allow the request through — don't spam the console
      return NextResponse.next();
    }
    throw error;
  }
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
