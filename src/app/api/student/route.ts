import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdmin, serverError, unauthorized } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  try {
    const students = await prisma.student.findMany({
      select: { id: true, username: true, fullName: true, createdAt: true, _count: { select: { scores: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(students);
  } catch (e) {
    return serverError('Fetch students error', e, 'Error fetching students');
  }
}

export async function POST(request: Request) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { username, password, fullName } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    if (await prisma.student.findUnique({ where: { username: username.trim() } })) {
      return NextResponse.json({ error: 'A student with this username already exists' }, { status: 409 });
    }
    const student = await prisma.student.create({
      data: {
        username: username.trim(),
        password: await hashPassword(password),
        fullName: typeof fullName === 'string' && fullName.trim() ? fullName.trim() : null,
      },
      select: { id: true, username: true, fullName: true },
    });
    return NextResponse.json({ message: 'Student registered successfully', student });
  } catch (e) {
    return serverError('Register student error', e, 'Error registering student');
  }
}

/** Reset a student's password. */
export async function PATCH(request: Request) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { username, password } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json({ error: 'Username and new password are required' }, { status: 400 });
    }
    const result = await prisma.student.updateMany({
      where: { username },
      data: { password: await hashPassword(password) },
    });
    if (result.count === 0) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ message: 'Password updated' });
  } catch (e) {
    return serverError('Reset password error', e, 'Error updating password');
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { username } = await request.json();
    if (typeof username !== 'string' || !username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    const result = await prisma.student.deleteMany({ where: { username } });
    if (result.count === 0) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (e) {
    return serverError('Delete student error', e, 'Error deleting student');
  }
}
