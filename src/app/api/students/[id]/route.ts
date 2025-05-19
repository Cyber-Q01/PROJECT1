
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
  paymentReceiptUrl?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const { paymentStatus } = await request.json();

    console.log(`[API Students PATCH /${studentId}] Received update request. New status: ${paymentStatus}`);

    if (!ObjectId.isValid(studentId)) {
      console.error(`[API Students PATCH /${studentId}] Invalid student ID format.`);
      return NextResponse.json({ error: 'Invalid student ID format' }, { status: 400 });
    }

    if (!paymentStatus || !['approved', 'rejected'].includes(paymentStatus)) {
      console.error(`[API Students PATCH /${studentId}] Invalid payment status provided: ${paymentStatus}`);
      return NextResponse.json({ error: 'Invalid payment status. Must be "approved" or "rejected".' }, { status: 400 });
    }

    console.log(`[API Students PATCH /${studentId}] Attempting to connect to DB...`);
    const client = await clientPromise;
    console.log(`[API Students PATCH /${studentId}] Successfully connected to DB client.`);
    const db = client.db("firstClassTutorials");
    const studentsCollection = db.collection<Student>("students");

    console.log(`[API Students PATCH /${studentId}] Attempting to update student payment status.`);
    const result = await studentsCollection.updateOne(
      { _id: new ObjectId(studentId) },
      { $set: { paymentStatus: paymentStatus as Student['paymentStatus'] } }
    );

    if (result.matchedCount === 0) {
      console.warn(`[API Students PATCH /${studentId}] Student not found for update.`);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    if (result.modifiedCount === 0 && result.matchedCount > 0) {
        console.warn(`[API Students PATCH /${studentId}] Student found, but payment status was already ${paymentStatus}. No modification made.`);
        // Still return success, as the desired state is achieved
        return NextResponse.json({ message: `Student payment status was already ${paymentStatus}. No changes made.`, studentId }, { status: 200 });
    }
    
    console.log(`[API Students PATCH /${studentId}] Payment status updated successfully for student.`);
    return NextResponse.json({ message: 'Payment status updated successfully', studentId }, { status: 200 });

  } catch (e) {
    console.error(`[API Students PATCH /${params.id}] Error updating payment status:`, e);
    const error = e as Error & { code?: string };
    return NextResponse.json({
      error: 'Failed to update payment status',
      details: error.message || 'Unknown server error',
      code: error.code,
    }, { status: 500 });
  }
}
