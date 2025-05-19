
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
  senderName?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const { paymentStatus, senderName, amountDue } = await request.json();

    console.log(`[API Students PATCH /${studentId}] Received update request. Status: ${paymentStatus}, Sender: ${senderName}, Amount: ${amountDue}`);

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
    
    if (senderName !== undefined) { 
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
    const result = await studentsCollection.findOneAndUpdate(
      { _id: new ObjectId(studentId) },
      { $set: updateFields },
      { returnDocument: 'after' } 
    );

    if (!result || !result.value) { 
      console.warn(`[API Students PATCH /${studentId}] Student not found for update or update operation failed.`);
      return NextResponse.json({ error: 'Student not found or update failed' }, { status: 404 });
    }
    
    const updatedStudentDoc = result.value;
    // Ensure all fields are correctly mapped, especially if the document structure might vary
    const updatedStudentResponse = {
      id: updatedStudentDoc._id.toString(),
      fullName: updatedStudentDoc.fullName,
      email: updatedStudentDoc.email,
      phone: updatedStudentDoc.phone,
      address: updatedStudentDoc.address,
      dateOfBirth: updatedStudentDoc.dateOfBirth, // ensure this is a string if needed by frontend
      selectedSubjects: updatedStudentDoc.selectedSubjects,
      classTiming: updatedStudentDoc.classTiming,
      registrationDate: updatedStudentDoc.registrationDate, // ensure this is a string if needed
      amountDue: updatedStudentDoc.amountDue,
      senderName: updatedStudentDoc.senderName,
      paymentStatus: updatedStudentDoc.paymentStatus,
    };
    
    console.log(`[API Students PATCH /${studentId}] Student record updated successfully. New data:`, updatedStudentResponse);
    return NextResponse.json({ message: 'Student record updated successfully', studentId, updatedStudent: updatedStudentResponse }, { status: 200 });

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
