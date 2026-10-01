import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdmin, serverError, unauthorized } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ questionId: string }> }) {
  if (!(await getAdmin())) return unauthorized();
  const questionId = parseInt((await params).questionId, 10);
  if (Number.isNaN(questionId)) return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
  try {
    const result = await prisma.question.deleteMany({ where: { id: questionId } });
    if (result.count === 0) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (e) {
    return serverError('Delete question error', e, 'Error deleting question');
  }
}
