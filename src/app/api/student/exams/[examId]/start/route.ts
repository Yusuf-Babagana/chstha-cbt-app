import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStudentId, serverError, unauthorized } from '@/lib/auth';
import { finalizeSession, remainingSeconds, sanitizeAnswers } from '@/lib/exam';

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Starts (or resumes) the student's attempt. The correct answers are never sent
 * to the browser; the countdown is derived from the server-side start time.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ examId: string }> }) {
  const studentId = await getStudentId();
  if (!studentId) return unauthorized();
  const examId = parseInt((await params).examId, 10);
  if (Number.isNaN(examId)) return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, title: true, duration: true, questions: { select: { id: true, text: true, options: true } } },
    });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    if (exam.questions.length === 0) {
      return NextResponse.json({ error: 'This exam has no questions yet.' }, { status: 400 });
    }

    const score = await prisma.score.findUnique({ where: { studentId_examId: { studentId, examId } } });
    if (score) {
      return NextResponse.json(
        {
          error: 'You have already taken this exam.',
          alreadyTaken: true,
          result: { score: score.score, correct: score.correct, total: score.total },
        },
        { status: 409 }
      );
    }

    let session = await prisma.studentExamSession.findFirst({ where: { studentId, examId, completedAt: null } });

    if (session && remainingSeconds(session.startedAt, exam.duration) === 0) {
      // Time ran out while the student was away: grade what was saved.
      const order = session.shuffledOrder as number[];
      const result = await finalizeSession(
        session.id,
        sanitizeAnswers(session.answers, order.length) ?? order.map(() => -1)
      );
      return NextResponse.json({ finished: true, title: exam.title, result });
    }

    const byId = new Map(exam.questions.map((q) => [q.id, q]));
    let order: number[];
    let answers: number[];

    if (session) {
      // Resume. Drop any questions an admin removed in the meantime, keeping answers aligned.
      const stored = session.shuffledOrder as number[];
      const savedAnswers = sanitizeAnswers(session.answers, stored.length) ?? stored.map(() => -1);
      order = [];
      answers = [];
      stored.forEach((qid, i) => {
        if (byId.has(qid)) {
          order.push(qid);
          answers.push(savedAnswers[i]);
        }
      });
      if (order.length !== stored.length) {
        session = await prisma.studentExamSession.update({
          where: { id: session.id },
          data: { shuffledOrder: order, answers },
        });
      }
    } else {
      order = shuffle(exam.questions.map((q) => q.id));
      answers = order.map(() => -1);
      session = await prisma.studentExamSession.create({
        data: { studentId, examId, shuffledOrder: order, answers },
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      title: exam.title,
      remainingSeconds: remainingSeconds(session.startedAt, exam.duration),
      answers,
      questions: order.map((qid) => {
        const q = byId.get(qid)!;
        return { id: q.id, text: q.text, options: q.options };
      }),
    });
  } catch (e) {
    return serverError('Start exam error', e, 'Error starting the exam');
  }
}
