import prisma from './prisma';

export type ExamResult = { score: number; correct: number; total: number };

/** Normalises client-supplied answers to an int array of exactly `length` entries (-1 = unanswered). */
export function sanitizeAnswers(input: unknown, length: number): number[] | null {
  if (!Array.isArray(input) || input.length !== length) return null;
  return input.map((v) => (Number.isInteger(v) && v >= 0 && v < 20 ? (v as number) : -1));
}

/**
 * Grades a session and stores the score. Safe to call twice: the unique
 * (studentId, examId) constraint guarantees a student is only scored once.
 */
export async function finalizeSession(sessionId: number, answers: number[]): Promise<ExamResult> {
  const session = await prisma.studentExamSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { exam: { include: { questions: true } } },
  });

  const existing = await prisma.score.findUnique({
    where: { studentId_examId: { studentId: session.studentId, examId: session.examId } },
  });
  if (existing) return { score: existing.score, correct: existing.correct, total: existing.total };

  const order = session.shuffledOrder as number[];
  const byId = new Map(session.exam.questions.map((q) => [q.id, q]));
  let correct = 0;
  order.forEach((qid, i) => {
    if (byId.get(qid)?.correct === answers[i]) correct += 1;
  });
  const total = order.length;
  const score = total === 0 ? 0 : Math.round((correct / total) * 10000) / 100;

  try {
    await prisma.$transaction([
      prisma.score.create({ data: { studentId: session.studentId, examId: session.examId, score, correct, total } }),
      prisma.studentExamSession.update({ where: { id: sessionId }, data: { completedAt: new Date(), answers } }),
    ]);
  } catch (e) {
    if ((e as { code?: string })?.code !== 'P2002') throw e; // lost a race with a parallel submit - score already stored
  }
  return { score, correct, total };
}

export const remainingSeconds = (startedAt: Date, durationMinutes: number) =>
  Math.max(0, Math.round((startedAt.getTime() + durationMinutes * 60_000 - Date.now()) / 1000));
