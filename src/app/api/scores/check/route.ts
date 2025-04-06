import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = parseInt(searchParams.get('examId') || '0');
    const studentId = parseInt(searchParams.get('studentId') || '0');

    if (!examId || !studentId) {
      return NextResponse.json(
        { error: 'Exam ID and student ID are required' },
        { status: 400 }
      );
    }

    const score = await prisma.score.findFirst({
      where: {
        examId,
        studentId,
      },
    });

    return NextResponse.json(
      { hasTaken: !!score },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Check exam status error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error checking exam status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}