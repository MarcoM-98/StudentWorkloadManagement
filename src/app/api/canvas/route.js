import { NextResponse } from "next/server";

const CANVAS_BASE_URL = "https://canvas.txstate.edu";

function stripHtml(html) {
  if (!html) return "";

  return String(html)
    .replace(/<style[^>]*>.*?<\/style>/gis, " ")
    .replace(/<script[^>]*>.*?<\/script>/gis, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
async function fetchAllPages(url, token) {
  let results = [];
  let nextUrl = url;

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Canvas API error ${res.status}: ${text}`);
    }

    const data = text ? JSON.parse(text) : [];

    if (Array.isArray(data)) {
      results = results.concat(data);
    }

    const link = res.headers.get("link");
    const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);

    nextUrl = nextMatch ? nextMatch[1] : null;
  }

  return results;
}

export async function GET() {
  return NextResponse.json({
    message: "Canvas API route works",
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Canvas token is required." },
        { status: 400 }
      );
    }

    const courses = await fetchAllPages(
      `${CANVAS_BASE_URL}/api/v1/courses?enrollment_state=active&per_page=100`,
      token
    );

    console.log("COURSES FOUND:", courses.length);

    const assignmentsByDay = {};
    let totalAssignments = 0;

    for (const course of courses) {
      const courseId = course.id;
      const courseName = course.name || course.course_code || "Unknown Course";

      if (!courseId) continue;

      const assignments = await fetchAllPages(
        `${CANVAS_BASE_URL}/api/v1/courses/${courseId}/assignments?bucket=future&per_page=100`,
        token
      );

      console.log(`${courseName}:`, assignments.length);

      for (const assignment of assignments) {
        const dueDate = assignment.due_at;

        if (!dueDate) continue;

        const date = dueDate.split("T")[0];

        if (!assignmentsByDay[date]) {
          assignmentsByDay[date] = [];
        }

        assignmentsByDay[date].push({
          title: assignment.name || "Untitled Assignment",
          courseName,
          time: new Date(dueDate).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
         descriptionText: stripHtml(assignment.description || "") || "No description",
          assignmentId: assignment.id,
          courseId,
        });

        totalAssignments++;
      }
    }

    console.log("TOTAL ASSIGNMENTS:", totalAssignments);
    console.log("GROUPED:", assignmentsByDay);

    return NextResponse.json({
      finished: true,
      count: totalAssignments,
      assignmentsByDay,
      error: null,
    });
  } catch (err) {
    console.error("Canvas route error:", err);

    return NextResponse.json(
      {
        finished: true,
        count: 0,
        assignmentsByDay: {},
        error: err.message || "Failed to fetch Canvas assignments.",
      },
      { status: 500 }
    );
  }
}