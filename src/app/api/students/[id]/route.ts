
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
  paymentReceiptUrl?: string | null; // Keep if legacy data might exist, or remove if fully migrated
  lastPaymentDate?: string | null;
  nextPaymentDueDate?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  console.log(`[API Students PATCH /${studentId}] Received update request for ID: ${studentId}`);

  let body;
  try {
    body = await request.json();
    console.log(`[API Students PATCH /${studentId}] Request body:`, body);
  } catch (error) {
    console.error(`[API Students PATCH /${studentId}] Invalid JSON in request body:`, error);
    return NextResponse.json({ error: 'Invalid JSON in request body', details: (error as Error).message }, { status: 400 });
  }
  
  const { paymentStatus, senderName, amountDue, isMonthlyRenewal } = body;

  if (!ObjectId.isValid(studentId)) {
    console.error(`[API Students PATCH /${studentId}] Invalid student ID format.`);
    return NextResponse.json({ 
      error: 'Invalid student ID format', 
      details: `The provided ID '${studentId}' is not a valid MongoDB ObjectId.`,
      receivedId: studentId 
    }, { status: 400 });
  }

  const mongoObjectId = new ObjectId(studentId);
  console.log(`[API Students PATCH /${studentId}] Original string ID: '${studentId}', Converted ObjectId: '${mongoObjectId.toHexString()}'`);

  try {
    const client = await clientPromise;
    const db = client.db("firstClassTutorials");
    const studentsCollection = db.collection<Student>("students");

    // Diagnostic: Try to find the student first
    console.log(`[API Students PATCH /${studentId}] Attempting to find student with ObjectId: ${mongoObjectId.toHexString()}`);
    const existingStudent = await studentsCollection.findOne({ _id: mongoObjectId });

    if (!existingStudent) {
      console.warn(`[API Students PATCH /${studentId}] findOne check: Student not found for ObjectId: ${mongoObjectId.toHexString()}.`);
      return NextResponse.json({ 
        error: `Student not found during pre-check`, 
        details: `findOne: No student record matches the query for ID (converted from '${studentId}' to ObjectId '${mongoObjectId.toHexString()}').`,
        searchedObjectId: mongoObjectId.toHexString(),
        originalIdParam: studentId
      }, { status: 404 });
    }
    console.log(`[API Students PATCH /${studentId}] findOne check: Student found. Proceeding with update.`);

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
    } else if (paymentStatus === 'approved') { 
        updateFields.lastPaymentDate = formatISO(currentDate);
        updateFields.nextPaymentDueDate = formatISO(addMonths(currentDate, 1));
    }
    
    if (Object.keys(updateFields).length === 0) {
        console.log(`[API Students PATCH /${studentId}] No valid fields provided for update.`);
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    console.log(`[API Students PATCH /${studentId}] Attempting to update student with ObjectId '${mongoObjectId.toHexString()}' using fields:`, updateFields);
    
    const result = await studentsCollection.findOneAndUpdate(
      { _id: mongoObjectId },
      { $set: updateFields },
      { returnDocument: 'after' } 
    );

    if (!result || !result.value) { 
      console.warn(`[API Students PATCH /${studentId}] findOneAndUpdate: Student not found or update failed for ObjectId: ${mongoObjectId.toHexString()}. This is unexpected if findOne succeeded.`);
      return NextResponse.json({ 
        error: `Student not found or update failed (findOneAndUpdate)`, 
        details: `findOneAndUpdate: No student record matches the query for ID (converted from '${studentId}' to ObjectId '${mongoObjectId.toHexString()}'). This might occur if the document was deleted between findOne and findOneAndUpdate.`,
        searchedObjectId: mongoObjectId.toHexString(),
        originalIdParam: studentId
      }, { status: 404 });
    }
    
    const updatedStudentDoc = result.value;
    const updatedStudentResponse = {
      ...updatedStudentDoc,
      id: updatedStudentDoc._id.toString(), // Ensure id is string
      dateOfBirth: updatedStudentDoc.dateOfBirth, 
      registrationDate: updatedStudentDoc.registrationDate, 
      lastPaymentDate: updatedStudentDoc.lastPaymentDate, 
      nextPaymentDueDate: updatedStudentDoc.nextPaymentDueDate, 
    };
    delete (updatedStudentResponse as Partial<Student>)._id; // Remove _id from response if 'id' is preferred
    
    console.log(`[API Students PATCH /${studentId}] Student record updated successfully.`);
    return NextResponse.json({ message: 'Student record updated successfully', studentId, updatedStudent: updatedStudentResponse }, { status: 200 });

  } catch (e) {
    const error = e as Error & { code?: string };
    console.error(`[API Students PATCH /${studentId}] Error updating student record:`, error.message, error.stack, error);
    return NextResponse.json({
      error: 'Failed to update student record',
      details: error.message || 'Unknown server error',
      code: error.code,
      originalIdParam: studentId, // Include original ID for context
      convertedObjectId: mongoObjectId.toHexString() // Include converted ID
    }, { status: 500 });
  }
}
