import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStudentId, unauthorized } from '@/lib/auth';

export async function GET() {
  const id = await getStudentId();
  if (!id) return unauthorized();
  const student = await prisma.student.findUnique({
    where: { id },
    select: { id: true, username: true, fullName: true },
  });
  if (!student) return unauthorized();
  return NextResponse.json(student);
}
