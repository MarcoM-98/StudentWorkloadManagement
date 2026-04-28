import { NextResponse } from "next/server"; // Lets us send JSON responses back from a Next.js API route
import fs from "fs"; // read files from disk
import path from "path"; // build safe file paths for diff OS
import OpenAI from "openai";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

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
    const { filename } = await req.json(); // Expected format: { "filename": "somefile.txt" }

    if (!filename) {
      return NextResponse.json(
        { error: "No filename provided" },
        { status: 400 }
      );
    }

    const safeFilename = path.basename(filename);

    // process.cwd() = root of your Next.js project
    const filePath = path.join(process.cwd(), "uploads", safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const lowerName = safeFilename.toLowerCase();

    if (
      !lowerName.endsWith(".txt") &&
      !lowerName.endsWith(".pdf") &&
      !lowerName.endsWith(".docx")
    ) {
      return NextResponse.json(
        { error: "Only TXT, PDF, and DOCX files are currently supported for analysis." },
        { status: 400 }
      );
    }

    let content = "";

    if (lowerName.endsWith(".txt")) {
      content = fs.readFileSync(filePath, "utf-8");
    } else if (lowerName.endsWith(".pdf")) {
      const fileBuffer = fs.readFileSync(filePath);
      const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
      const pdfData = await extractText(pdf, { mergePages: true });
      content = pdfData.text || "";
    } else if (lowerName.endsWith(".docx")) {
      const fileBuffer = fs.readFileSync(filePath);
      const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
      content = docxData.value || "";
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: "The uploaded file is empty or unreadable." },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a strict JSON generator. You ONLY return valid JSON. No text. No markdown. No explanation.",
        },
        {
          role: "user",
          content: `Read the following academic document and extract the required data:

Respond EXACTLY in this format:
{
  "minutes": number,
  "due_date": "string", 
  "is_actionable_assignment": boolean,
  "keywords": ["string", "string", "string", "string"]
}

Rules
1. is_actionable_assignment: Set TRUE if this is an assignment, a homework, a project, a quiz, a exam, 
a study guide, practice, proposal, lab, or an essay. Set FALSE if this is a syllabus, course schedule, lecture, or policy document.
2. If FALSE, set "minutes" to 0, "due_date" to "", and "keywords" to [].
3. If TRUE, extract the minutes, due date, and 2 to 3 highly specific study keywords.
- Use YYYY-MM-DD format for dates, if no due date is found, return "". Do not return formats like 01JAN26, 4/4/26, or "today"
4. keywords: ALWAYS extract 3 to 4 highly specific technical study topics from the document (e.g., "Single-Cycle Datapath", "Pipelining", "Direct-Mapped Cache"). NEVER leave this array empty.



Example:
{
  "minutes": 120,
  "due_date": "2026-04-04",
  "is_actionable_assignment": true,
  "keywords": ["Abstract Syntax Trees", "Compiler Construction"]
}

Assignment Text:${content}`,
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

      return NextResponse.json(
        { error: "Analysis returned invalid data." },
        { status: 500 }
      );
    }

    parsed = {
      minutes: Number(parsed.minutes) || 0,
      due_date: normalizeDueDate(parsed.due_date),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      isActionable: parsed.is_actionable_assignment !== false, 
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