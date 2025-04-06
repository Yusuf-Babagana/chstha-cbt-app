import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stringify } from 'csv-stringify/sync';

export async function GET() {
  try {
    // Fetch all scores with student and exam details
    const scores = await prisma.score.findMany({
      include: {
        student: true,
        exam: true,
      },
    });

    // Prepare CSV data
    const csvData = scores.map((score) => ({
      student_username: score.student.username,
      student_fullName: score.student.fullName || 'N/A',
      exam_title: score.exam.title,
      score: score.score.toFixed(2),
      date_taken: new Date(score.createdAt).toISOString(),
    }));

    // Define CSV headers
    const headers = [
      'student_username',
      'student_fullName',
      'exam_title',
      'score',
      'date_taken',
    ];

    // Convert to CSV
    const csv = stringify(csvData, { header: true, columns: headers });

    // Return the CSV as a downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=scores.csv',
      },
    });
  } catch (error: any) {
    console.error('Download scores error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Error downloading scores' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}