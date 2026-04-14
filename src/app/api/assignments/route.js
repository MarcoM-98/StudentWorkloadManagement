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

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    // Find the current highest numeric assignment id for this placeholder user
    const lastAssignment = await Assignment.findOne({ userId: "local-user" })
      .sort({ id: -1 })
      .lean();

    const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

    const newAssignment = await Assignment.create({
      id: nextId,
      userId: "local-user",
      title: body.title || "Untitled Assignment",
      description: "",
      dueDate: body.dueDate || "",
      course: "General",
      completed: false,
      priority: "medium",
      customPercentage: null,
      duration: Number(body.duration) || 0,
    });

    return NextResponse.json(newAssignment, { status: 201 });

  } catch (error) {
    console.error("MongoDB Create Error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    // Find the current highest numeric assignment id for this placeholder user
    const lastAssignment = await Assignment.findOne({ userId: "local-user" })
      .sort({ id: -1 })
      .lean();

    const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

    const newAssignment = await Assignment.create({
      id: nextId,
      userId: "local-user",
      title: body.title || "Untitled Assignment",
      description: "",
      dueDate: body.dueDate || "",
      course: "General",
      completed: false,
      priority: "medium",
      customPercentage: null,
      duration: Number(body.duration) || 0,
    });

    return NextResponse.json(newAssignment, { status: 201 });

  } catch (error) {
    console.error("MongoDB Create Error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}