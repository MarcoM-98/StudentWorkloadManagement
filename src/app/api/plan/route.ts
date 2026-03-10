// Scrum-27 work should be here to connect to front end so it can conncet to the schedule logic

import { NextResponse } from 'next/server';
import { PlanGenerator } from '@/lib/scheduler'; // Import the logic
import { Assignments } from '@/lib/scheduler'; // Import the types

// SCRUM-27: handles the "POST" request from the frontend
export async function POST(request: Request) {
  try {
    // 1. DATA FORMATTING: Extract the data sent by the user
    const body = await request.json();
    const { assignments, availableTime }: { assignments: Assignments[], availableTime: number } = body;

    // 2. INTEGRATION: Run the logic
    const generatedPlan = PlanGenerator(assignments, availableTime);

    // 3. RETURN: Send the processed plan back to the frontend
    return NextResponse.json(generatedPlan);
  } catch (error) {
    // Basic error handling for the API
    return NextResponse.json(
      { error: 'Failed to generate plan. Please check your data format.' },
      { status: 500 }
    );
  }
}