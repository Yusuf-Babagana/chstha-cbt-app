import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdmin, serverError, unauthorized } from '@/lib/auth';

type Ctx = { params: Promise<{ examId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await getAdmin())) return unauthorized();
  const examId = parseInt((await params).examId, 10);
  if (Number.isNaN(examId)) return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { id: 'asc' } } },
    });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    return NextResponse.json(exam);
  } catch (e) {
    return serverError('Fetch exam error', e, 'Error fetching exam');
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await getAdmin())) return unauthorized();
  const examId = parseInt((await params).examId, 10);
  if (Number.isNaN(examId)) return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });
  try {
    // Questions, scores and sessions are removed by cascade.
    const result = await prisma.exam.deleteMany({ where: { id: examId } });
    if (result.count === 0) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    return NextResponse.json({ message: 'Exam deleted successfully' });
  } catch (e) {
    return serverError('Delete exam error', e, 'Error deleting exam');
  }
}
