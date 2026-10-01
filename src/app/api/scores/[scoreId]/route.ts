import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdmin, serverError, unauthorized } from '@/lib/auth';

/** Removes a score (and the student's session for that exam) so the student can retake the exam. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ scoreId: string }> }) {
  if (!(await getAdmin())) return unauthorized();
  const scoreId = parseInt((await params).scoreId, 10);
  if (Number.isNaN(scoreId)) return NextResponse.json({ error: 'Invalid score ID' }, { status: 400 });
  try {
    const score = await prisma.score.findUnique({ where: { id: scoreId } });
    if (!score) return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    await prisma.$transaction([
      prisma.score.delete({ where: { id: scoreId } }),
      prisma.studentExamSession.deleteMany({ where: { studentId: score.studentId, examId: score.examId } }),
    ]);
    return NextResponse.json({ message: 'Score removed. The student can retake this exam.' });
  } catch (e) {
    return serverError('Delete score error', e, 'Error removing score');
  }
}
