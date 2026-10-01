import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, STUDENT_COOKIE, verifyToken } from './session';

/** Returns the logged-in admin's username, or null. */
export async function getAdmin(): Promise<string | null> {
  const store = await cookies();
  const session = await verifyToken(store.get(ADMIN_COOKIE)?.value);
  return session?.role === 'admin' ? session.sub : null;
}

/** Returns the logged-in student's id, or null. */
export async function getStudentId(): Promise<number | null> {
  const store = await cookies();
  const session = await verifyToken(store.get(STUDENT_COOKIE)?.value);
  if (session?.role !== 'student') return null;
  const id = parseInt(session.sub, 10);
  return Number.isNaN(id) ? null : id;
}

export const unauthorized = () => NextResponse.json({ error: 'Not authorised. Please log in.' }, { status: 401 });

export function serverError(label: string, error: unknown, message = 'Something went wrong. Please try again.') {
  console.error(`${label}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}
