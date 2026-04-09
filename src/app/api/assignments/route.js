import { NextResponse } from "next/server";

// Import the DB connection and Model
import { connectDB } from "../../../../mongodb-mongoose/db.js"; 
import Assignment from "../../../../mongodb-mongoose/model/Assignment.js"; 

export async function GET(request) {
  try {
    // 1. Connects to the Atlas Database/ mongodb
    await connectDB();

    // 2. Fetches every assignment in the database
    const realAssignments = await Assignment.find({});
    
    // 3. Sends the real data to dashboard
    return NextResponse.json(realAssignments, { status: 200 });

  } catch (error) {
    console.error("MongoDB Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch from DB" }, { status: 500 });
  }
}