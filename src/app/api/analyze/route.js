import { NextResponse } from "next/server"; // Lets us send JSON responses back from a Next.js API route
import fs from "fs"; // read files from disk
import path from "path"; // build safe file paths for diff OS
import OpenAI from "openai";

// Create one OpenAI client using the API key from your .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeDueDate(dateString) {
  if (!dateString) return "";

  const trimmed = String(dateString).trim();
  const lowered = trimmed.toLowerCase();

  if (lowered === "unknown" || lowered === "none" || lowered === "n/a") {
    return "";
  }

  if (lowered === "today") {
    return new Date().toISOString().split("T")[0];
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
}

export async function POST(req) {
  try {
    const { filename } = await req.json();    // Expected format: { "filename": "somefile.txt" }

    if (!filename) {
      return NextResponse.json(
        { error: "No filename provided" },
        { status: 400 }
      );
    }

    // process.cwd() = root of your Next.js project
    const filePath = path.join(process.cwd(), "uploads", filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(filePath, "utf-8"); //will NOT properly parse PDFs, images, or Word docs, only txt 

    const response = await openai.chat.completions.create({ //sent to openai
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a strict JSON generator. You ONLY return valid JSON. No text. No markdown. No explanation.",
        },
        {
          role: "user",
          content: `Read the following assignment and extract:

1. Estimated time to complete (in MINUTES, just a number)
2. Due date (if mentioned, otherwise empty string)

Respond EXACTLY in this format:
{
  "minutes": number,
  "due_date": "string"
}

Rules for due_date:
- Use YYYY-MM-DD format
- If no due date is found, return ""
- Do not return formats like 01JAN26, 4/4/26, or "today"

Example:
{
  "minutes": 120,
  "due_date": "2026-04-04"
}

Assignment:${content}`,
        },
      ],
    });

    // Raw AI response (string)
    const raw = response.choices[0].message.content || "";

    // Clean potential markdown formatting
    const cleaned = raw.replace(/```json|```/g, "").trim();

    // Safely parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse failed:", cleaned);

      // Fallback in case AI messes up
      parsed = {
        minutes: 0,
        due_date: "",
      };
    }

    parsed = {
      minutes: Number(parsed.minutes) || 0,
      due_date: normalizeDueDate(parsed.due_date),
    };

    // Return structured response
    return NextResponse.json({
      success: true,
      data: parsed,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json( //generic server error
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}