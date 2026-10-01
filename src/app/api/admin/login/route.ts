import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { ADMIN_COOKIE, cookieOptions, createToken } from '@/lib/session';
import { serverError } from '@/lib/auth';

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminUser || !adminPass) {
      return NextResponse.json(
        { error: 'Admin account is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.' },
        { status: 500 }
      );
    }
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !safeEqual(username, adminUser) ||
      !safeEqual(password, adminPass)
    ) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    const res = NextResponse.json({ message: 'Login successful' });
    res.cookies.set(ADMIN_COOKIE, await createToken('admin', adminUser), cookieOptions);
    return res;
  } catch (e) {
    return serverError('Admin login error', e, 'Error logging in');
  }
}
