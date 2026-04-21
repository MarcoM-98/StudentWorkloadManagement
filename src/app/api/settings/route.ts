import { NextResponse } from "next/server";
import { connectDB } from "../../../../../mongodb-mongoose/db.js"; 
import Assignment from "../../../../../mongodb-mongoose/model/UserSetting.js";

export async function GET(req: Request) {

return NextResponse.json({ university: "General University", major: "Undeclared" });
}

export async function PATCH(req: Request) {
  try {
    const { major } = await req.json();
    
    return NextResponse.json({ success: true, major });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}