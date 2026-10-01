import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStudentId, serverError, unauthorized } from '@/lib/auth';
import { finalizeSession, sanitizeAnswers } from '@/lib/exam';

export async function POST(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const studentId = await getStudentId();
  if (!studentId) return unauthorized();
  const examId = parseInt((await params).examId, 10);
  if (Number.isNaN(examId)) return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });

  try {
    const { answers } = await request.json();

    const existing = await prisma.score.findUnique({ where: { studentId_examId: { studentId, examId } } });
    if (existing) {
      return NextResponse.json({ result: { score: existing.score, correct: existing.correct, total: existing.total } });
    }

    const session = await prisma.studentExamSession.findFirst({ where: { studentId, examId, completedAt: null } });
    if (!session) return NextResponse.json({ error: 'No active exam session found' }, { status: 404 });

    const order = session.shuffledOrder as number[];
    const clean = sanitizeAnswers(answers, order.length);
    if (!clean) return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });

    const result = await finalizeSession(session.id, clean);
    return NextResponse.json({ message: 'Exam submitted successfully', result });
  } catch (e) {
    return serverError('Submit exam error', e, 'Error submitting the exam');
  }
}
