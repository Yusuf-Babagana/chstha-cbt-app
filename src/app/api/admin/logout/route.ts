import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/session';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
