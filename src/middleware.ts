import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, STUDENT_COOKIE, verifyToken } from '@/lib/session';

// Page-level gatekeeper. API route handlers perform their own checks as well.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value);
    if (session?.role !== 'admin') return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  if (pathname.startsWith('/student/exam')) {
    const session = await verifyToken(req.cookies.get(STUDENT_COOKIE)?.value);
    if (session?.role !== 'student') return NextResponse.redirect(new URL('/student/login', req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/student/exam/:path*', '/student/exam'] };
