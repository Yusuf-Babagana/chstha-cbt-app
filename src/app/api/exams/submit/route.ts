import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { examId, studentUsername, answers } = await request.json();

    if (!examId || !studentUsername || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the student
    const student = await prisma.student.findUnique({
      where: { username: studentUsername },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch questions for the exam
    const questions = await prisma.question.findMany({
      where: { examId },
    });

    if (questions.length !== answers.length) {
      return NextResponse.json({ error: 'Answer count does not match question count' }, { status: 400 });
    }

    // Calculate score
    let score = 0;
    questions.forEach((question, index) => {
      if (question.correct === answers[index]) {
        score += 1;
      }
    });

    // Save the score
    await prisma.score.create({
      data: {
        studentId: student.id,
        examId,
        score,
      },
    });

    return NextResponse.json({ message: 'Exam submitted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Submit exam error:', error);
    return NextResponse.json({ error: 'Error submitting exam' }, { status: 500 });
  }
}