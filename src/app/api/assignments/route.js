import { NextResponse } from "next/server";

// Import the DB connection and Model
import { connectDB } from "../../../../mongodb-mongoose/db.js"; 
import Assignment from "../../../../mongodb-mongoose/model/Assignment.js"; 
import { requireFirebaseUserId } from "@/lib/requestUser";

export async function GET(request) {
  try {
    const { userId, errorResponse } = requireFirebaseUserId(request);

    if (errorResponse) {
      return errorResponse;
    }

    // 1. Connects to the Atlas Database/ mongodb
    await connectDB();

    // 2. Fetches every assignment in the database for the logged in user
    const realAssignments = await Assignment.find({ userId }).sort({ dueDate: 1, id: 1 });
    
    // 3. Sends the real data to dashboard
    return NextResponse.json(realAssignments, { status: 200 });

  } catch (error) {
    console.error("MongoDB Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch from DB" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, errorResponse } = requireFirebaseUserId(req);

    if (errorResponse) {
      return errorResponse;
    }

    await connectDB();

    const body = await req.json();

    // Find the current highest numeric assignment id for this Firebase user
    const lastAssignment = await Assignment.findOne({ userId })
      .sort({ id: -1 })
      .lean();

    const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

    const newAssignment = await Assignment.create({
      id: nextId,
      userId,
      title: body.title || "Untitled Assignment",
      description: "",
      dueDate: body.dueDate || "",
      course: "General",
      completed: false,
      priority: "medium",
      customPercentage: null,
      duration: Number(body.duration) || 0,
      keywords: Array.isArray(body.keywords) ? body.keywords : [],
      isActionable: body.isActionable ?? true,
    });

    return NextResponse.json(newAssignment, { status: 201 });

  } catch (error) {
    console.error("MongoDB Create Error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
