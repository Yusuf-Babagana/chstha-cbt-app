import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: { questionId: string } }) {
  try {
    const questionId = parseInt(params.questionId);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json(
      { message: 'Question deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete question error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error deleting question' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}