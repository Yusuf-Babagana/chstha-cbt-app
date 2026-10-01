import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdmin, serverError, unauthorized } from '@/lib/auth';

export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  try {
    const scores = await prisma.score.findMany({
      include: { student: { select: { username: true, fullName: true } }, exam: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(scores);
  } catch (e) {
    return serverError('Fetch scores error', e, 'Error fetching scores');
  }
}
