
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
    const body = await request.json();
    const { paymentStatus, senderName, amountDue, isMonthlyRenewal } = body;

    console.log(`[API Students PATCH /${studentId}] Received update request. Body:`, body);

    if (!ObjectId.isValid(studentId)) {
      console.error(`[API Students PATCH /${studentId}] Invalid student ID format.`);
      return NextResponse.json({ 
        error: 'Invalid student ID format', 
        details: `The provided ID '${studentId}' is not a valid MongoDB ObjectId.`,
        receivedId: studentId 
      }, { status: 400 });
    }

    const mongoObjectId = new ObjectId(studentId);
    // console.log(`[API Students PATCH /${studentId}] Original string ID: '${studentId}', Converted ObjectId: '${mongoObjectId.toHexString()}'`);

    const updateFields: Partial<Omit<Student, '_id' | 'id'>> = {};


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

    if (isMonthlyRenewal === true) { 
        updateFields.paymentStatus = 'approved'; 
        updateFields.lastPaymentDate = formatISO(currentDate);
        updateFields.nextPaymentDueDate = formatISO(addMonths(currentDate, 1));
        // DO NOT automatically update amountDue or senderName for a simple renewal
    } else if (paymentStatus === 'approved') { 
        updateFields.lastPaymentDate = formatISO(currentDate);
        updateFields.nextPaymentDueDate = formatISO(addMonths(currentDate, 1));
    }
    
    if (Object.keys(updateFields).length === 0) {
        console.log(`[API Students PATCH /${studentId}] No valid fields provided for update.`);
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    // console.log(`[API Students PATCH /${studentId}] Attempting to connect to DB...`);
    const client = await clientPromise;
    // console.log(`[API Students PATCH /${studentId}] Successfully connected to DB client.`);
    const db = client.db("firstClassTutorials");
    const studentsCollection = db.collection<Student>("students");

    // console.log(`[API Students PATCH /${studentId}] Attempting to update student with ID '${studentId}' (ObjectId: ${mongoObjectId.toHexString()}) using fields:`, updateFields);
    const result = await studentsCollection.findOneAndUpdate(
      { _id: mongoObjectId },
      { $set: updateFields },
      { returnDocument: 'after' } 
    );

    if (!result || !result.value) { 
      console.warn(`[API Students PATCH /${studentId}] Student not found for ID: '${studentId}'. Update operation failed.`);
      return NextResponse.json({ 
        error: `Student not found`, 
        details: `No student record matches the query for ID (converted from '${studentId}' to ObjectId '${mongoObjectId.toHexString()}').`,
        searchedObjectId: mongoObjectId.toHexString(),
        originalIdParam: studentId
      }, { status: 404 });
    }
    
    const updatedStudentDoc = result.value;
     const updatedStudentResponse = {
      ...updatedStudentDoc,
      id: updatedStudentDoc._id.toString(),
      dateOfBirth: updatedStudentDoc.dateOfBirth, 
      registrationDate: updatedStudentDoc.registrationDate, 
      lastPaymentDate: updatedStudentDoc.lastPaymentDate, 
      nextPaymentDueDate: updatedStudentDoc.nextPaymentDueDate, 
    };
    delete (updatedStudentResponse as any)._id; // Remove _id to avoid sending it if not needed
    
    console.log(`[API Students PATCH /${studentId}] Student record updated successfully.`);
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
