
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
  console.log(`[API Students PATCH /${idFromParams}] Received update request.`);

  let body;
  try {
    body = await request.json();
    console.log(`[API Students PATCH /${idFromParams}] Request body:`, body);
  } catch (error) {
    console.error(`[API Students PATCH /${idFromParams}] Invalid JSON in request body:`, error);
    return NextResponse.json({ error: 'Invalid JSON in request body', details: (error as Error).message }, { status: 400 });
  }

  if (!ObjectId.isValid(idFromParams)) {
    console.error(`[API Students PATCH /${idFromParams}] Invalid student ID format: ${idFromParams}`);
    return NextResponse.json({
      error: 'Invalid student ID format',
      details: `The provided ID '${idFromParams}' is not a valid MongoDB ObjectId.`,
      receivedId: idFromParams
    }, { status: 400 });
  }

  let mongoObjectIdFromParams: ObjectId;
  try {
    mongoObjectIdFromParams = new ObjectId(idFromParams);
  } catch (e) {
    console.error(`[API Students PATCH /${idFromParams}] Error converting ID to ObjectId: ${idFromParams}`, e);
    return NextResponse.json({
      error: 'Failed to convert ID to a valid ObjectId',
      details: (e as Error).message,
      receivedId: idFromParams
    }, { status: 400 });
  }
  
  console.log(`[API Students PATCH /${idFromParams}] Original string ID: '${idFromParams}', Converted ObjectId: '${mongoObjectIdFromParams.toHexString()}'`);

  try {
    const client = await clientPromise;
    const db = client.db("firstClassTutorials");
    const studentsCollection = db.collection<Student>("students");

    console.log(`[API Students PATCH /${idFromParams}] Attempting to find student with query: `, { _id: mongoObjectIdFromParams });
    
    let existingStudent: Student | null = null;
    let findAttempt = 0;
    const MAX_FIND_ATTEMPTS = 3;
    const FIND_RETRY_DELAY_MS = 250; // Increased delay slightly

    while (findAttempt < MAX_FIND_ATTEMPTS && !existingStudent) {
      findAttempt++;
      if (findAttempt > 1) {
        console.log(`[API Students PATCH /${idFromParams}] Retrying findOne, attempt ${findAttempt} for ObjectId ${mongoObjectIdFromParams.toHexString()} after ${FIND_RETRY_DELAY_MS}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, FIND_RETRY_DELAY_MS));
      }
      existingStudent = await studentsCollection.findOne({ _id: mongoObjectIdFromParams });
      if (existingStudent) {
        console.log(`[API Students PATCH /${idFromParams}] findOne attempt ${findAttempt} successful. Student found.`);
        break;
      } else {
        console.warn(`[API Students PATCH /${idFromParams}] findOne attempt ${findAttempt} failed to find document with ObjectId ${mongoObjectIdFromParams.toHexString()}.`);
      }
    }

    if (!existingStudent) {
      console.warn(`[API Students PATCH /${idFromParams}] findOne pre-check: Student not found after ${MAX_FIND_ATTEMPTS} attempts for ObjectId: ${mongoObjectIdFromParams.toHexString()}.`);
      return NextResponse.json({
        error: `Student not found with ID: ${idFromParams}`,
        details: `findOne: No student record matches the query for ID (converted from '${idFromParams}' to ObjectId '${mongoObjectIdFromParams.toHexString()}') after ${MAX_FIND_ATTEMPTS} attempts.`,
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
        updateFields.paymentStatus = 'approved'; 
        updateFields.lastPaymentDate = formatISO(currentDate);
        const baseDateForRenewal = existingStudent.nextPaymentDueDate && new Date(existingStudent.nextPaymentDueDate) > currentDate
                                    ? new Date(existingStudent.nextPaymentDueDate)
                                    : currentDate;
        updateFields.nextPaymentDueDate = formatISO(addMonths(baseDateForRenewal, 1));
        // Retain existing amountDue if isMonthlyRenewal is true, unless explicitly provided for other reasons
        if (amountDue === undefined && existingStudent.amountDue) {
            updateFields.amountDue = existingStudent.amountDue;
        }


    } else if (paymentStatus === 'approved' && !isMonthlyRenewal) { 
        updateFields.lastPaymentDate = formatISO(currentDate);
        updateFields.nextPaymentDueDate = formatISO(addMonths(currentDate, 1));
    }


    if (Object.keys(updateFields).length === 0) {
        console.log(`[API Students PATCH /${idFromParams}] No valid fields provided for update.`);
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    console.log(`[API Students PATCH /${idFromParams}] Attempting to update student with ObjectId '${mongoObjectIdFromParams.toHexString()}' using fields:`, updateFields);

    let updateAttempt = 0;
    let updateResult: any = null; 
    const MAX_UPDATE_ATTEMPTS = 1; // We already retried findOne, findOneAndUpdate should be more robust now or fail.
    const UPDATE_RETRY_DELAY_MS = 200; 

    while (updateAttempt < MAX_UPDATE_ATTEMPTS) {
      updateAttempt++;
      if (updateAttempt > 1) {
        console.log(`[API Students PATCH /${idFromParams}] Retrying findOneAndUpdate, attempt ${updateAttempt} for ID ${mongoObjectIdFromParams.toHexString()} after ${UPDATE_RETRY_DELAY_MS}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, UPDATE_RETRY_DELAY_MS));
      }
      updateResult = await studentsCollection.findOneAndUpdate(
        { _id: mongoObjectIdFromParams },
        { $set: updateFields },
        { returnDocument: 'after' }
      );
      if (updateResult && updateResult.value) {
        console.log(`[API Students PATCH /${idFromParams}] findOneAndUpdate attempt ${updateAttempt} successful.`);
        break; 
      } else {
        console.warn(`[API Students PATCH /${idFromParams}] findOneAndUpdate attempt ${updateAttempt} failed to find/update document with ID ${mongoObjectIdFromParams.toHexString()}.`);
      }
    }


    if (!updateResult || !updateResult.value) {
      console.warn(`[API Students PATCH /${idFromParams}] findOneAndUpdate: All attempts failed. Student not found or update failed for ObjectId: ${mongoObjectIdFromParams.toHexString()}. This is unexpected if findOne succeeded.`);
      return NextResponse.json({
        error: `Student not found or update failed (findOneAndUpdate after ${MAX_UPDATE_ATTEMPTS} attempts)`,
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
      convertedObjectIdString: mongoObjectIdFromParams ? mongoObjectIdFromParams.toHexString() : 'N/A (conversion failed earlier)'
    }, { status: 500 });
  }
}

