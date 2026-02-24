import { NextResponse } from "next/server";
import { computeOverload } from "@/lib/overload";
import { getAssignments, getAvailability } from "@/lib/store";

export async function GET() {
  const assignments = getAssignments();
  const availability = getAvailability();

  const result = computeOverload(assignments, availability);

  return NextResponse.json(result);
}
