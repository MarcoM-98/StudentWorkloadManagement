import { NextResponse } from "next/server";
import { connectDB } from "../../../../mongodb-mongoose/db.js"; 
import UserSetting from "../../../../mongodb-mongoose/model/UserSetting.js";
import { requireFirebaseUserId } from "@/lib/requestUser";

export async function GET(req: Request) {
try{
    const { userId, errorResponse } = requireFirebaseUserId(req);

    if (errorResponse) {
      return errorResponse;
    }

    await connectDB();
    // Fetch the first settings document found in the DB
   const settings = await UserSetting.findOne({ userId }) || { university: "Texas State University", major: "Undeclared" };
   return NextResponse.json(settings);
   } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, errorResponse } = requireFirebaseUserId(req);

    if (errorResponse) {
      return errorResponse;
    }

    await connectDB();
    const { major } = await req.json();

    // Updates the settings or creates them if they don't exist yet on the student setting
    await UserSetting.findOneAndUpdate(
      { userId },
      { userId, major }, 
      { new: true, upsert: true } 
    );
    
    return NextResponse.json({ success: true, major });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
