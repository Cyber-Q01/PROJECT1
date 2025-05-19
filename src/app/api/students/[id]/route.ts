
// src/app/api/students/[id]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { addMonths, formatISO } from 'date-fns';

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
  lastPaymentDate?: string | null;
  nextPaymentDueDate?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const { paymentStatus, senderName, amountDue, isMonthlyRenewal } = await request.json();

    console.log(`[API Students PATCH /${studentId}] Received update request. Status: ${paymentStatus}, Sender: ${senderName}, Amount: ${amountDue}, MonthlyRenewal: ${isMonthlyRenewal}`);

    if (!ObjectId.isValid(studentId)) {
      console.error(`[API Students PATCH /${studentId}] Invalid student ID format.`);
      return NextResponse.json({ error: 'Invalid student ID format', details: `The provided ID '${studentId}' is not a valid MongoDB ObjectId.` }, { status: 400 });
    }

    const updateFields: Partial<Student> = {};

    if (paymentStatus) {
      if (!['pending_payment', 'pending_verification', 'approved', 'rejected'].includes(paymentStatus)) {
        console.error(`[API Students PATCH /${studentId}] Invalid payment status provided: ${paymentStatus}`);
        return NextResponse.json({ error: 'Invalid payment status.', details: `Status '${paymentStatus}' is not allowed.` }, { status: 400 });
      }
      updateFields.paymentStatus = paymentStatus as Student['paymentStatus'];
    }
    
    if (senderName !== undefined) { 
        updateFields.senderName = senderName;
    }
    if (amountDue !== undefined && typeof amountDue === 'number') {
        updateFields.amountDue = amountDue;
    }

    const currentDate = new Date();
    if (isMonthlyRenewal && amountDue === 8000) { // Admin recording a monthly payment
        updateFields.paymentStatus = 'approved';
        updateFields.lastPaymentDate = formatISO(currentDate);
        updateFields.nextPaymentDueDate = formatISO(addMonths(currentDate, 1));
        updateFields.amountDue = 8000; // Confirming the standard monthly amount
        updateFields.senderName = senderName || "Admin Recorded - Monthly"; // Or some other indicator
    } else if (paymentStatus === 'approved' && !isMonthlyRenewal) { // Initial payment approval
        updateFields.lastPaymentDate = formatISO(currentDate);
        updateFields.nextPaymentDueDate = formatISO(addMonths(currentDate, 1));
        // Keep student-submitted amountDue and senderName for the first payment
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

    console.log(`[API Students PATCH /${studentId}] Attempting to update student with ID '${studentId}' using fields:`, updateFields);
    const result = await studentsCollection.findOneAndUpdate(
      { _id: new ObjectId(studentId) },
      { $set: updateFields },
      { returnDocument: 'after' } 
    );

    if (!result || !result.value) { 
      console.warn(`[API Students PATCH /${studentId}] Student not found for ID: '${studentId}'. Update operation failed.`);
      return NextResponse.json({ error: `Student not found with ID: ${studentId}`, details: `No student record matches the ID '${studentId}'.` }, { status: 404 });
    }
    
    const updatedStudentDoc = result.value;
     const updatedStudentResponse = {
      ...updatedStudentDoc,
      id: updatedStudentDoc._id.toString(),
    };
    
    console.log(`[API Students PATCH /${studentId}] Student record updated successfully. New data:`, updatedStudentResponse);
    return NextResponse.json({ message: 'Student record updated successfully', studentId, updatedStudent: updatedStudentResponse }, { status: 200 });

  } catch (e) {
    const error = e as Error & { code?: string };
    console.error(`[API Students PATCH /${params.id}] Error updating student record:`, error.message, error.stack, error);
    return NextResponse.json({
      error: 'Failed to update student record',
      details: error.message || 'Unknown server error',
      code: error.code,
    }, { status: 500 });
  }
}
