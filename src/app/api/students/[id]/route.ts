
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
  dateOfBirth: string; // ISO string
  selectedSubjects: string[];
  classTiming: 'morning' | 'afternoon';
  registrationDate: string; // ISO string
  amountDue: number;
  senderName?: string | null;
  paymentStatus: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
  lastPaymentDate?: string | null; // ISO string
  nextPaymentDueDate?: string | null; // ISO string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const idFromParams = params.id;
  console.log(`[API Students PATCH /${idFromParams}] Received update request for ID: ${idFromParams}`);

  let body;
  try {
    body = await request.json();
    console.log(`[API Students PATCH /${idFromParams}] Request body:`, body);
  } catch (error) {
    console.error(`[API Students PATCH /${idFromParams}] Invalid JSON in request body:`, error);
    return NextResponse.json({ error: 'Invalid JSON in request body', details: (error as Error).message }, { status: 400 });
  }

  if (!ObjectId.isValid(idFromParams)) {
    console.error(`[API Students PATCH /${idFromParams}] Invalid student ID format.`);
    return NextResponse.json({
      error: 'Invalid student ID format',
      details: `The provided ID '${idFromParams}' is not a valid MongoDB ObjectId.`,
      receivedId: idFromParams
    }, { status: 400 });
  }

  const mongoObjectIdFromParams = new ObjectId(idFromParams);
  console.log(`[API Students PATCH /${idFromParams}] Original string ID: '${idFromParams}', Converted ObjectId: '${mongoObjectIdFromParams.toHexString()}'`);

  try {
    const client = await clientPromise;
    const db = client.db("firstClassTutorials");
    const studentsCollection = db.collection<Student>("students");

    console.log(`[API Students PATCH /${idFromParams}] Attempting to find student with ObjectId: ${mongoObjectIdFromParams.toHexString()}`);
    const existingStudent = await studentsCollection.findOne({ _id: mongoObjectIdFromParams });

    if (!existingStudent) {
      console.warn(`[API Students PATCH /${idFromParams}] findOne check: Student not found for ObjectId: ${mongoObjectIdFromParams.toHexString()}.`);
      return NextResponse.json({
        error: `Student not found during pre-check`,
        details: `findOne: No student record matches the query for ID (converted from '${idFromParams}' to ObjectId '${mongoObjectIdFromParams.toHexString()}').`,
        searchedObjectId: mongoObjectIdFromParams.toHexString(),
        originalIdParam: idFromParams
      }, { status: 404 });
    }
    console.log(`[API Students PATCH /${idFromParams}] findOne check: Student found. Proceeding with update.`);

    const { paymentStatus, senderName, amountDue, isMonthlyRenewal } = body;
    const updateFields: Partial<Omit<Student, '_id' | 'id'>> = {};

    if (paymentStatus) {
      if (!['pending_payment', 'pending_verification', 'approved', 'rejected'].includes(paymentStatus)) {
        console.error(`[API Students PATCH /${idFromParams}] Invalid payment status provided: ${paymentStatus}`);
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

    if (isMonthlyRenewal === true && existingStudent.paymentStatus === 'approved') {
        updateFields.paymentStatus = 'approved'; // Ensure it stays approved
        updateFields.lastPaymentDate = formatISO(currentDate);
        // If nextPaymentDueDate was already in the future, base renewal on that, otherwise current date
        const baseDateForRenewal = existingStudent.nextPaymentDueDate && new Date(existingStudent.nextPaymentDueDate) > currentDate
                                    ? new Date(existingStudent.nextPaymentDueDate)
                                    : currentDate;
        updateFields.nextPaymentDueDate = formatISO(addMonths(baseDateForRenewal, 1));

    } else if (paymentStatus === 'approved' && !isMonthlyRenewal) { // Initial approval
        updateFields.lastPaymentDate = formatISO(currentDate);
        updateFields.nextPaymentDueDate = formatISO(addMonths(currentDate, 1));
    }


    if (Object.keys(updateFields).length === 0) {
        console.log(`[API Students PATCH /${idFromParams}] No valid fields provided for update.`);
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    console.log(`[API Students PATCH /${idFromParams}] Attempting to update student with ObjectId '${mongoObjectIdFromParams.toHexString()}' using fields:`, updateFields);

    let attempt = 0;
    let updateResult: any = null; // Using 'any' for ModifyResult type from mongodb driver
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 200; // Increased delay slightly

    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      if (attempt > 1) {
        console.log(`[API Students PATCH /${idFromParams}] Retrying findOneAndUpdate, attempt ${attempt} for ID ${mongoObjectIdFromParams.toHexString()} after ${RETRY_DELAY_MS}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
      updateResult = await studentsCollection.findOneAndUpdate(
        { _id: mongoObjectIdFromParams },
        { $set: updateFields },
        { returnDocument: 'after' }
      );
      if (updateResult && updateResult.value) {
        console.log(`[API Students PATCH /${idFromParams}] findOneAndUpdate attempt ${attempt} successful.`);
        break; // Success
      } else {
        console.warn(`[API Students PATCH /${idFromParams}] findOneAndUpdate attempt ${attempt} failed to find/update document with ID ${mongoObjectIdFromParams.toHexString()}.`);
      }
    }


    if (!updateResult || !updateResult.value) {
      console.warn(`[API Students PATCH /${idFromParams}] findOneAndUpdate: All attempts failed. Student not found or update failed for ObjectId: ${mongoObjectIdFromParams.toHexString()}. This is unexpected if findOne succeeded.`);
      return NextResponse.json({
        error: `Student not found or update failed (findOneAndUpdate after ${MAX_ATTEMPTS} attempts)`,
        details: `findOneAndUpdate: No student record matches the query for ID (converted from '${idFromParams}' to ObjectId '${mongoObjectIdFromParams.toHexString()}'). This might occur if the document was deleted or there was a consistency issue.`,
        searchedObjectId: mongoObjectIdFromParams.toHexString(),
        originalIdParam: idFromParams
      }, { status: 404 });
    }

    const updatedStudentDoc = updateResult.value;
    const updatedStudentResponse = {
      ...updatedStudentDoc,
      id: updatedStudentDoc._id.toString(),
      dateOfBirth: updatedStudentDoc.dateOfBirth,
      registrationDate: updatedStudentDoc.registrationDate,
      lastPaymentDate: updatedStudentDoc.lastPaymentDate,
      nextPaymentDueDate: updatedStudentDoc.nextPaymentDueDate,
    };
    delete (updatedStudentResponse as Partial<Student>)._id;

    console.log(`[API Students PATCH /${idFromParams}] Student record updated successfully.`);
    return NextResponse.json({ message: 'Student record updated successfully', studentId: idFromParams, updatedStudent: updatedStudentResponse }, { status: 200 });

  } catch (e) {
    const error = e as Error & { code?: string };
    console.error(`[API Students PATCH /${idFromParams}] Error updating student record:`, error.message, error.stack, error);
    return NextResponse.json({
      error: 'Failed to update student record',
      details: error.message || 'Unknown server error',
      code: error.code,
      originalIdParam: idFromParams,
      convertedObjectId: mongoObjectIdFromParams ? mongoObjectIdFromParams.toHexString() : 'N/A (conversion failed earlier)'
    }, { status: 500 });
  }
}
