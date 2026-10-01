import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serverError } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { STUDENT_COOKIE, cookieOptions, createToken } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { username: username.trim() } });
    const check = student ? await verifyPassword(password, student.password) : { ok: false, needsRehash: false };
    if (!student || !check.ok) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    if (check.needsRehash) {
      await prisma.student.update({ where: { id: student.id }, data: { password: await hashPassword(password) } });
    }

    const res = NextResponse.json({
      message: 'Login successful',
      student: { id: student.id, username: student.username, fullName: student.fullName },
    });
    res.cookies.set(STUDENT_COOKIE, await createToken('student', String(student.id)), cookieOptions);
    return res;
  } catch (e) {
    return serverError('Student login error', e, 'Error logging in');
  }
}
