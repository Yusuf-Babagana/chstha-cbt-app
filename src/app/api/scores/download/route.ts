import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stringify } from 'csv-stringify/sync';
import { getAdmin, serverError, unauthorized } from '@/lib/auth';

// Neutralise cells that spreadsheet apps would interpret as formulas.
const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? "'" + v : v);

export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  try {
    const scores = await prisma.score.findMany({
      include: { student: true, exam: true },
      orderBy: [{ exam: { title: 'asc' } }, { student: { username: 'asc' } }],
    });
    const csv = stringify(
      scores.map((s) => ({
        student_username: safe(s.student.username),
        student_fullName: safe(s.student.fullName || ''),
        exam_title: safe(s.exam.title),
        correct: s.correct,
        total: s.total,
        score_percent: s.score.toFixed(2),
        date_taken: s.createdAt.toISOString(),
      })),
      { header: true, bom: true }
    );
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ches-funtua-cbt-scores.csv"',
      },
    });
  } catch (e) {
    return serverError('Download scores error', e, 'Error downloading scores');
  }
}
