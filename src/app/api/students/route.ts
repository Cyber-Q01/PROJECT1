
// src/app/api/students/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define the Student interface based on your existing structure
// Ensure this matches the structure you intend to store in MongoDB
interface Student {
  _id?: ObjectId; // MongoDB typically uses _id
  id: string; // Your existing local storage ID, can be kept or migrated
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string; // Store as ISO string or Date
  selectedSubjects: string[];
  classTiming: 'morning' | 'afternoon';
  registrationDate: string; // Store as ISO string or Date
  amountDue: number; 
  paymentReceiptUrl?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("firstClassTutorials"); // Replace with your DB name

    const students = await db
      .collection<Student>("students") // Replace with your collection name
      .find({})
      .sort({ registrationDate: -1 }) // Example sort
      .toArray();

    return NextResponse.json({ students }, { status: 200 });
  } catch (e) {
    console.error("Error fetching students:", e);
    const error = e as Error;
    return NextResponse.json({ error: 'Failed to fetch students', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("firstClassTutorials"); // Replace with your DB name
    const studentData: Omit<Student, '_id'> = await request.json();

    // Basic validation (you'll want more robust validation)
    if (!studentData.email || !studentData.fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for existing email before inserting (example)
    const existingStudent = await db.collection<Student>("students").findOne({ email: studentData.email });
    if (existingStudent) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 }); // 409 Conflict
    }

    const result = await db.collection<Student>("students").insertOne(studentData as Student);

    return NextResponse.json({ message: "Student registered successfully", studentId: result.insertedId }, { status: 201 });
  } catch (e) {
    console.error("Error registering student:", e);
    const error = e as Error;
    return NextResponse.json({ error: 'Failed to register student', details: error.message }, { status: 500 });
  }
}
