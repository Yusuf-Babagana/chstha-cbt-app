import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdmin, serverError, unauthorized } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { parseStudentsCsv } from '@/lib/csv';

export async function POST(request: Request) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const file = (await request.formData()).get('students');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Students CSV file is required' }, { status: 400 });
    }

    let parsed;
    try {
      parsed = parseStudentsCsv(await file.text());
    } catch {
      return NextResponse.json({ error: 'Could not read the CSV file. Check that it is a valid CSV.' }, { status: 400 });
    }
    const { students, errors } = parsed;
    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No valid students found. Required columns: username, password (fullName optional).', details: errors },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;
    for (const s of students) {
      const password = await hashPassword(s.password);
      const existing = await prisma.student.findUnique({ where: { username: s.username }, select: { id: true } });
      if (existing) {
        await prisma.student.update({
          where: { id: existing.id },
          data: { password, ...(s.fullName ? { fullName: s.fullName } : {}) },
        });
        updated++;
      } else {
        await prisma.student.create({ data: { username: s.username, password, fullName: s.fullName } });
        created++;
      }
    }
    const skipped = errors.length ? `, ${errors.length} row(s) skipped` : '';
    return NextResponse.json({
      message: `${created} student(s) created, ${updated} updated${skipped}.`,
      created,
      updated,
      details: errors,
    });
  } catch (e) {
    return serverError('Bulk register error', e, 'Error registering students');
  }
}
