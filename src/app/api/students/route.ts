
// src/app/api/students/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define the Student interface based on your existing structure
// Ensure this matches the structure you intend to store in MongoDB
interface Student {
  _id?: ObjectId; // MongoDB typically uses _id
  id?: string; // Retained for compatibility with potential localStorage logic, though _id is primary
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string; // Store as ISO string or Date
  selectedSubjects: string[];
  classTiming: 'morning' | 'afternoon';
  registrationDate: string; // Store as ISO string or Date
  amountDue: number;
  senderName?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
  lastPaymentDate?: string | null;
  nextPaymentDueDate?: string | null;
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

    // Map _id to id for frontend consistency if needed, but ensure _id is also available
    const studentsWithId = students.map(student => ({
      ...student,
      id: student._id ? student._id.toString() : student.id, // Prioritize _id
    }));

    return NextResponse.json({ students: studentsWithId }, { status: 200 });
  } catch (e) {
    console.error("[API Students GET] Error fetching students:", e); 
    const error = e as Error & { code?: string; address?: string; port?: number }; 
    return NextResponse.json({ 
      error: 'Failed to fetch students', 
      details: error.message || 'Unknown error',
      code: error.code, 
      address: error.address, 
      port: error.port 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentData: Omit<Student, '_id' | 'id' | 'lastPaymentDate' | 'nextPaymentDueDate'> & { dateOfBirth: string; registrationDate: string; senderName: null } = await request.json();
    console.log('[API Students POST] Received student data:', studentData);

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
      return NextResponse.json({ error: 'Email already registered', details: `The email address ${studentData.email} is already in use.` }, { status: 409 }); // 409 Conflict
    }

    const newStudentDocument: Omit<Student, '_id' | 'id'> = {
        ...studentData,
        amountDue: studentData.amountDue || 0, // Ensure amountDue is set, default to 0
        paymentStatus: 'pending_payment', // Initial payment status
        senderName: null, // Initialize senderName
        lastPaymentDate: null,
        nextPaymentDueDate: null,
    };


    console.log(`[API Students POST] Inserting new student: ${newStudentDocument.fullName}`);
    const result = await db.collection("students").insertOne(newStudentDocument as Student);
    const insertedIdString = result.insertedId.toString();
    console.log(`[API Students POST] Student registered successfully with ID: ${insertedIdString}`);

    // Return the newly created student object, matching the structure expected by the frontend
    const createdStudentForFrontend = {
        ...newStudentDocument,
        _id: result.insertedId,
        id: insertedIdString,
    };

    return NextResponse.json({ message: "Student registered successfully", student: createdStudentForFrontend }, { status: 201 });
  } catch (e) {
    console.error("[API Students POST] Error registering student:", e); 
    const error = e as Error & { code?: string; address?: string; port?: number }; 
    return NextResponse.json({ 
      error: 'Failed to register student', 
      details: error.message || 'Unknown server error',
      code: error.code, 
      address: error.address, 
      port: error.port 
    }, { status: 500 });
  }
}
