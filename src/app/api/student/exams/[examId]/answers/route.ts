import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStudentId, serverError, unauthorized } from '@/lib/auth';
import { sanitizeAnswers } from '@/lib/exam';

/** Autosaves the student's current answers so a refresh or dropped connection loses nothing. */
export async function PUT(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const studentId = await getStudentId();
  if (!studentId) return unauthorized();
  const examId = parseInt((await params).examId, 10);
  if (Number.isNaN(examId)) return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });

  try {
    const { answers } = await request.json();
    const session = await prisma.studentExamSession.findFirst({ where: { studentId, examId, completedAt: null } });
    if (!session) return NextResponse.json({ error: 'No active exam session' }, { status: 404 });

    const clean = sanitizeAnswers(answers, (session.shuffledOrder as number[]).length);
    if (!clean) return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });

    await prisma.studentExamSession.update({ where: { id: session.id }, data: { answers: clean } });
    return NextResponse.json({ saved: true });
  } catch (e) {
    return serverError('Save answers error', e, 'Could not save answers');
  }
}
