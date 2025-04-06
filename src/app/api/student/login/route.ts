import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find the student
    const student = await prisma.student.findUnique({
      where: { username },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check password (in a real app, you should hash passwords and compare with bcrypt)
    if (student.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Login successful', student },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Student login error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error logging in' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}