
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
    console.log('[API Students GET] Attempting to connect to DB...');
    const client = await clientPromise;
    console.log('[API Students GET] Successfully connected to DB client.');
    const db = client.db("firstClassTutorials"); 

    console.log('[API Students GET] Fetching students from collection...');
    const students = await db
      .collection<Student>("students") 
      .find({})
      .sort({ registrationDate: -1 }) 
      .toArray();
    console.log(`[API Students GET] Successfully fetched ${students.length} students.`);

    return NextResponse.json({ students }, { status: 200 });
  } catch (e) {
    console.error("[API Students GET] Error fetching students:", e); // Log the full error object
    const error = e as Error & { code?: string; address?: string; port?: number }; // Extend type for potential network error props
    return NextResponse.json({ 
      error: 'Failed to fetch students', 
      details: error.message || 'Unknown error',
      code: error.code, // Include error code if available
      address: error.address, // Include address if available
      port: error.port // Include port if available
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentData: Omit<Student, '_id'> = await request.json();
    console.log('[API Students POST] Received student data:', studentData);

    // Basic validation
    if (!studentData.email || !studentData.fullName) {
      console.error('[API Students POST] Missing required fields.');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('[API Students POST] Attempting to connect to DB...');
    const client = await clientPromise;
    console.log('[API Students POST] Successfully connected to DB client.');
    const db = client.db("firstClassTutorials");

    console.log(`[API Students POST] Checking for existing student with email: ${studentData.email}`);
    const existingStudent = await db.collection<Student>("students").findOne({ email: studentData.email });
    if (existingStudent) {
      console.warn(`[API Students POST] Email already registered: ${studentData.email}`);
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 }); // 409 Conflict
    }

    console.log(`[API Students POST] Inserting new student: ${studentData.fullName}`);
    const result = await db.collection<Student>("students").insertOne(studentData as Student);
    const insertedIdString = result.insertedId.toString();
    console.log(`[API Students POST] Student registered successfully with ID: ${insertedIdString}`);

    return NextResponse.json({ message: "Student registered successfully", studentId: insertedIdString }, { status: 201 });
  } catch (e) {
    console.error("[API Students POST] Error registering student:", e); // Log the full error object
    const error = e as Error & { code?: string; address?: string; port?: number }; // Extend type for potential network error props
    return NextResponse.json({ 
      error: 'Failed to register student', 
      details: error.message || 'Unknown server error',
      code: error.code, // Include error code if available
      address: error.address, // Include address if available
      port: error.port // Include port if available
    }, { status: 500 });
  }
}
