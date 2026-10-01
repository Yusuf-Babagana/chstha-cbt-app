import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStudentId, serverError, unauthorized } from '@/lib/auth';

/** Exams available to the logged-in student, with their status for each. */
export async function GET() {
  const studentId = await getStudentId();
  if (!studentId) return unauthorized();
  try {
    const [exams, scores, sessions] = await Promise.all([
      prisma.exam.findMany({
        select: { id: true, title: true, duration: true, _count: { select: { questions: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.score.findMany({ where: { studentId } }),
      prisma.studentExamSession.findMany({ where: { studentId, completedAt: null }, select: { examId: true } }),
    ]);
    const scoreByExam = new Map(scores.map((s) => [s.examId, s]));
    const inProgress = new Set(sessions.map((s) => s.examId));

    return NextResponse.json(
      exams.map((e) => {
        const s = scoreByExam.get(e.id);
        return {
          id: e.id,
          title: e.title,
          duration: e.duration,
          questionCount: e._count.questions,
          status: s ? 'completed' : inProgress.has(e.id) ? 'in-progress' : 'available',
          result: s ? { score: s.score, correct: s.correct, total: s.total } : null,
        };
      })
    );
  } catch (e) {
    return serverError('Fetch student exams error', e, 'Error fetching exams');
  }
}
