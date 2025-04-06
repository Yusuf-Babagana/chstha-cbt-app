import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'csv-parse/sync';

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        questions: true,
      },
    });

    return NextResponse.json(exams, { status: 200 });
  } catch (error: any) {
    console.error('Fetch exams error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error fetching exams' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const duration = parseInt(formData.get('duration') as string);
    const questionsFile = formData.get('questions') as File;

    if (!title || !duration || !questionsFile) {
      return NextResponse.json(
        { error: 'Title, duration, and questions file are required' },
        { status: 400 }
      );
    }

    const questionsText = await questionsFile.text();
    const questionsData = parse(questionsText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (questionsData.length === 0) {
      return NextResponse.json(
        { error: 'Questions CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    const questions = questionsData.map((row: any) => ({
      text: row.text,
      options: [row.option1, row.option2, row.option3, row.option4],
      correct: parseInt(row.correct),
    }));

    const exam = await prisma.exam.create({
      data: {
        title,
        duration,
        questions: {
          create: questions,
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(
      { message: 'Exam created successfully', exam },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Create exam error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error creating exam' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = parseInt(searchParams.get('examId') || '0');

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // Delete associated scores first
    await prisma.score.deleteMany({
      where: {
        examId,
      },
    });

    // Delete the exam (this will also delete associated questions due to cascade)
    await prisma.exam.delete({
      where: {
        id: examId,
      },
    });

    return NextResponse.json(
      { message: 'Exam deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete exam error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error deleting exam' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}