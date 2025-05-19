
// src/app/api/students/[id]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface Student {
  _id?: ObjectId;
  id?: string; 
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  selectedSubjects: string[];
  classTiming: 'morning' | 'afternoon';
  registrationDate: string;
  amountDue: number;
  senderName?: string | null; // Changed from paymentReceiptUrl
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    // Ensure you're only extracting fields you intend to update from the body
    const { paymentStatus, senderName, amountDue } = await request.json();

    console.log(`[API Students PATCH /${studentId}] Received update request. New status: ${paymentStatus}, Sender: ${senderName}, Amount: ${amountDue}`);

    if (!ObjectId.isValid(studentId)) {
      console.error(`[API Students PATCH /${studentId}] Invalid student ID format.`);
      return NextResponse.json({ error: 'Invalid student ID format' }, { status: 400 });
    }

    const updateFields: Partial<Pick<Student, 'paymentStatus' | 'senderName' | 'amountDue'>> = {};

    if (paymentStatus) {
      if (!['pending_payment', 'pending_verification', 'approved', 'rejected'].includes(paymentStatus)) {
        console.error(`[API Students PATCH /${studentId}] Invalid payment status provided: ${paymentStatus}`);
        return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
      }
      updateFields.paymentStatus = paymentStatus as Student['paymentStatus'];
    }
    
    // Allow updating senderName and amountDue if provided, typically when marking as 'pending_verification' by student,
    // or by admin if they need to correct it.
    if (senderName !== undefined) { // Check for undefined to allow setting to null or empty string
        updateFields.senderName = senderName;
    }
    if (amountDue !== undefined && typeof amountDue === 'number') {
        updateFields.amountDue = amountDue;
    }
    
    if (Object.keys(updateFields).length === 0) {
        console.log(`[API Students PATCH /${studentId}] No valid fields provided for update.`);
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }


    console.log(`[API Students PATCH /${studentId}] Attempting to connect to DB...`);
    const client = await clientPromise;
    console.log(`[API Students PATCH /${studentId}] Successfully connected to DB client.`);
    const db = client.db("firstClassTutorials");
    const studentsCollection = db.collection<Student>("students");

    console.log(`[API Students PATCH /${studentId}] Attempting to update student with fields:`, updateFields);
    const result = await studentsCollection.updateOne(
      { _id: new ObjectId(studentId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      console.warn(`[API Students PATCH /${studentId}] Student not found for update.`);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    if (result.modifiedCount === 0 && result.matchedCount > 0) {
        console.warn(`[API Students PATCH /${studentId}] Student found, but no fields were modified (possibly same values).`);
        return NextResponse.json({ message: `Student found, but no new changes applied.`, studentId }, { status: 200 });
    }
    
    console.log(`[API Students PATCH /${studentId}] Student record updated successfully.`);
    return NextResponse.json({ message: 'Student record updated successfully', studentId }, { status: 200 });

  } catch (e) {
    console.error(`[API Students PATCH /${params.id}] Error updating student record:`, e);
    const error = e as Error & { code?: string };
    return NextResponse.json({
      error: 'Failed to update student record',
      details: error.message || 'Unknown server error',
      code: error.code,
    }, { status: 500 });
  }
}

