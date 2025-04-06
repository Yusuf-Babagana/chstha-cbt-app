import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const scores = await prisma.score.findMany({
      include: {
        student: true,
        exam: true,
      },
    });

    return NextResponse.json(scores, { status: 200 });
  } catch (error: any) {
    console.error('Fetch scores error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error fetching scores' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const { examId, studentId, sessionId, answers } = await request.json();

    if (!examId || !studentId || !sessionId || !answers) {
      return NextResponse.json(
        { error: 'Exam ID, student ID, session ID, and answers are required' },
        { status: 400 }
      );
    }

    // Fetch the exam session to get the shuffled order
    const session = await prisma.studentExamSession.findUnique({
      where: { id: sessionId },
      include: { exam: { include: { questions: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Exam session not found' },
        { status: 404 }
      );
    }

    if (session.studentId !== studentId || session.examId !== examId) {
      return NextResponse.json(
        { error: 'Invalid session for this student or exam' },
        { status: 400 }
      );
    }

    if (session.completedAt) {
      return NextResponse.json(
        { error: 'This exam has already been submitted' },
        { status: 400 }
      );
    }

    // Map the answers back to the original question IDs
    const shuffledOrder = session.shuffledOrder as number[];
    const originalQuestions = session.exam.questions;
    const correctAnswers = originalQuestions.map((q) => ({
      questionId: q.id,
      correct: q.correct,
    }));

    let score = 0;
    const totalQuestions = originalQuestions.length;

    // Answers are in the shuffled order, so we need to map them back
    const mappedAnswers = shuffledOrder.map((questionId, index) => ({
      questionId,
      selectedOption: answers[index], // answers[index] corresponds to the shuffled position
    }));

    for (const answer of mappedAnswers) {
      const correctAnswer = correctAnswers.find((ca) => ca.questionId === answer.questionId);
      if (correctAnswer && answer.selectedOption === correctAnswer.correct) {
        score += 1;
      }
    }

    const finalScore = (score / totalQuestions) * 100; // Percentage score

    // Save the score
    const newScore = await prisma.score.create({
      data: {
        examId,
        studentId,
        score: finalScore,
        createdAt: new Date(),
      },
    });

    // Mark the session as completed
    await prisma.studentExamSession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Score saved successfully', score: newScore },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Submit score error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error submitting score' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}