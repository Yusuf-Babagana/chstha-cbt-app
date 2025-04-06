import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ examId: string }> }) {
  const params = await context.params; // Await the params Promise
  const examId = parseInt(params.examId, 10);

  if (isNaN(examId)) {
    return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });
  }

  try {
    const questions = await prisma.question.findMany({
      where: { examId },
    });
    return NextResponse.json(questions, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error fetching questions' }, { status: 500 });
  }
}