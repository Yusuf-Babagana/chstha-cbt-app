import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        createdAt: true,
      },
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error: any) {
    console.error('Fetch students error:', error);
    return NextResponse.json({ error: 'Error fetching students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, fullName } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Check if the student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { username },
    });

    if (existingStudent) {
      return NextResponse.json({ error: 'Student with this username already exists' }, { status: 400 });
    }

    // Create the new student
    const student = await prisma.student.create({
      data: {
        username,
        password, // In a real application, you should hash the password
        fullName,
      },
    });

    return NextResponse.json({ message: 'Student registered successfully', student }, { status: 200 });
  } catch (error: any) {
    console.error('Register student error:', error);
    return NextResponse.json({ error: 'Error registering student' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if the student exists
    const student = await prisma.student.findUnique({
      where: { username },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Delete the student
    await prisma.student.delete({
      where: { username },
    });

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete student error:', error);
    return NextResponse.json({ error: 'Error deleting student' }, { status: 500 });
  }
}