import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdmin, serverError, unauthorized } from '@/lib/auth';
import { parseQuestionsCsv } from '@/lib/csv';

export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  try {
    const exams = await prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        duration: true,
        createdAt: true,
        _count: { select: { questions: true, scores: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(exams);
  } catch (e) {
    return serverError('Fetch exams error', e, 'Error fetching exams');
  }
}

export async function POST(request: Request) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const form = await request.formData();
    const title = String(form.get('title') ?? '').trim();
    const duration = parseInt(String(form.get('duration') ?? ''), 10);
    const file = form.get('questions');

    if (!title || !Number.isInteger(duration) || duration < 1 || duration > 600 || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'A title, a duration (1-600 minutes) and a questions CSV file are required' },
        { status: 400 }
      );
    }

    let parsed;
    try {
      parsed = parseQuestionsCsv(await file.text());
    } catch {
      return NextResponse.json({ error: 'Could not read the CSV file. Check that it is a valid CSV.' }, { status: 400 });
    }
    if (parsed.errors.length > 0 || parsed.questions.length === 0) {
      const first = parsed.errors
        .slice(0, 5)
        .map((e) => `row ${e.row}: ${e.message}`)
        .join('; ');
      const more = parsed.errors.length > 5 ? ` (and ${parsed.errors.length - 5} more)` : '';
      return NextResponse.json(
        {
          error:
            parsed.errors.length === 0
              ? 'The CSV file has no questions.'
              : `Fix these CSV problems and upload again - ${first}${more}`,
        },
        { status: 400 }
      );
    }

    if (await prisma.exam.findUnique({ where: { title } })) {
      return NextResponse.json({ error: 'An exam with this title already exists' }, { status: 409 });
    }

    const exam = await prisma.exam.create({
      data: { title, duration, questions: { create: parsed.questions } },
      select: { id: true, title: true, duration: true, _count: { select: { questions: true } } },
    });
    return NextResponse.json({ message: 'Exam created successfully', exam });
  } catch (e) {
    return serverError('Create exam error', e, 'Error creating exam');
  }
}
