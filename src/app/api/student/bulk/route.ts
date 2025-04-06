import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'csv-parse/sync';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('students') as File;

    // Log the received file for debugging
    console.log('Received File:', file?.name);

    if (!file) {
      return NextResponse.json(
        { error: 'Students CSV file is required' },
        { status: 400 }
      );
    }

    // Read and parse the CSV file
    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    // Validate CSV headers
    const requiredHeaders = ['username', 'password']; // fullName is optional
    const headers = Object.keys(records[0]);
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required CSV headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse students from CSV
    const students = records.map((record: any) => {
      if (!record.username || !record.password) {
        throw new Error('Username and password must be provided for each student');
      }

      return {
        username: record.username,
        password: record.password,
        fullName: record.fullName || null, // fullName is optional
      };
    });

    // Create or update students in the database
    const createdStudents = [];
    for (const student of students) {
      const newStudent = await prisma.student.upsert({
        where: { username: student.username },
        update: {
          password: student.password,
          fullName: student.fullName,
        },
        create: {
          username: student.username,
          password: student.password,
          fullName: student.fullName,
        },
      });
      createdStudents.push(newStudent);
    }

    return NextResponse.json(
      { message: 'Students registered successfully', count: createdStudents.length },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Bulk register students error:', error.message);
    return NextResponse.json({ error: error.message || 'Error registering students' }, { status: 500 });
  }
}