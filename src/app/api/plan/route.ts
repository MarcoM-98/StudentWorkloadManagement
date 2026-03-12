// Scrum-27 work should be here to connect to front end so it can conncet to the schedule logic

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // Make sure it connects to mongoDB
import Assignment from '@/mongodb-mongoose/model/Assignment'; //
import { PlanGenerator } from '@/lib/scheduler'; // Import the logic

// SCRUM-27: 
export async function GET() {
  try {
    // 1. Connect to MongoDB Atlas
    await dbConnect();

    // 2. Fetch live data. 
    // .lean() makes the data look like your mock objects for easier processing
    const assignments = await Assignment.find({}).lean();

    // 3. Log the data to your terminal so you can see it working
    console.log(`Fetched ${assignments.length} assignments from MongoDB.`);

    // PlanGenerator logic
    // use 120 minutes as a default "AvailableTime" for the test
    const studyPlan = PlanGenerator(assignments as any, 120);

    // 5. Send the calculated plan back to the browser
    return NextResponse.json(studyPlan);

  } catch (error) {
    console.error("CRITICAL API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not process study plan." },
      { status: 500 }
    );
  }
}