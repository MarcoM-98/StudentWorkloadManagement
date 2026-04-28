import { NextResponse } from "next/server";

export function getFirebaseUserId(request) {
  return request.headers.get("x-firebase-uid")?.trim() || "";
}

export function requireFirebaseUserId(request) {
  const userId = getFirebaseUserId(request);

  if (!userId) {
    return {
      errorResponse: NextResponse.json(
        { error: "Missing Firebase user id" },
        { status: 401 }
      ),
      userId: null,
    };
  }

  return { errorResponse: null, userId };
}
