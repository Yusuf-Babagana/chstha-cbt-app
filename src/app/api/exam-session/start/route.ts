import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Fisher-Yates shuffle algorithm
function shuffleArray(array: number[]): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: Request) {
  try {
    const { studentId, examId } = await request.json();

    if (!studentId || !examId) {
      return NextResponse.json(
        { error: 'Student ID and Exam ID are required' },
        { status: 400 }
      );
    }

    // Check if the student has already started this exam
    const existingSession = await prisma.studentExamSession.findFirst({
      where: {
        studentId,
        examId,
        completedAt: null, // Only consider active sessions
      },
    });

    if (existingSession) {
      // Session already exists, return the exam with the previously shuffled order
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          questions: {
            select: {
              id: true,
              text: true,
              options: true,
              correct: true,
              createdAt: true,
            },
          },
        },
      });

      if (!exam) {
        return NextResponse.json(
          { error: 'Exam not found' },
          { status: 404 }
        );
      }

      const shuffledOrder = existingSession.shuffledOrder as number[];
      const shuffledQuestions = shuffledOrder.map((questionId) =>
        exam.questions.find((q) => q.id === questionId)!
      );

      return NextResponse.json(
        {
          exam: {
            ...exam,
            questions: shuffledQuestions,
          },
          sessionId: existingSession.id,
        },
        { status: 200 }
      );
    }

    // Fetch the exam with its questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            correct: true,
            createdAt: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Shuffle the question IDs
    const questionIds = exam.questions.map((q) => q.id);
    const shuffledOrder = shuffleArray(questionIds);

    // Create a new exam session
    const session = await prisma.studentExamSession.create({
      data: {
        studentId,
        examId,
        shuffledOrder,
        startedAt: new Date(),
      },
    });

    // Reorder the questions based on the shuffled order
    const shuffledQuestions = shuffledOrder.map((questionId) =>
      exam.questions.find((q) => q.id === questionId)!
    );

    return NextResponse.json(
      {
        exam: {
          ...exam,
          questions: shuffledQuestions,
        },
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Start exam session error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error starting exam session' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}