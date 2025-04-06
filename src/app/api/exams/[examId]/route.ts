import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { examId: string } }) {
  try {
    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: 'Invalid exam ID' },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exam, { status: 200 });
  } catch (error: any) {
    console.error('Fetch exam error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error fetching exam' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request, { params }: { params: { examId: string } }) {
  try {
    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: 'Invalid exam ID' },
        { status: 400 }
      );
    }

    // Delete the exam (associated scores and questions will be deleted via cascade)
    await prisma.exam.delete({
      where: {
        id: examId,
      },
    });

    return NextResponse.json(
      { message: 'Exam deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete exam error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error deleting exam' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}