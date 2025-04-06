import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET handler to fetch an exam by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  try {
    // Convert examId from string to integer
    const examId = parseInt(params.examId);

    // Validate examId
    if (isNaN(examId)) {
      return NextResponse.json(
        { error: 'Invalid exam ID' },
        { status: 400 }
      );
    }

    // Fetch the exam with its questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    // Check if exam exists
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
  }
}

// DELETE handler to delete an exam by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  try {
    // Convert examId from string to integer
    const examId = parseInt(params.examId);

    // Validate examId
    if (isNaN(examId)) {
      return NextResponse.json(
        { error: 'Invalid exam ID' },
        { status: 400 }
      );
    }

    // Delete the exam (associated scores and questions will be deleted via cascade)
    await prisma.exam.delete({
      where: { id: examId },
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
  }
}