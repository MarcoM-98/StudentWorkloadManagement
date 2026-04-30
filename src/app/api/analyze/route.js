import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import { connectDB } from "../../../../mongodb-mongoose/db.js";
import UploadedDocument from "../../../../mongodb-mongoose/model/UploadedDocument.js";
import { requireFirebaseUserId } from "@/lib/requestUser";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeDueDate(dateString) {
  if (!dateString) return "";

  const trimmed = String(dateString).trim();
  const lowered = trimmed.toLowerCase();

  if (lowered === "unknown" || lowered === "none" || lowered === "n/a") return "";
  if (lowered === "today") return new Date().toISOString().split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().split("T")[0];
}

function getUploadedDocumentBuffer(savedDocument) {
  const rawData = savedDocument?.data;

  if (!rawData) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(rawData)) {
    return rawData;
  }

  // Handles MongoDB Binary data
  if (rawData.buffer) {
    return Buffer.from(rawData.buffer);
  }

  // Handles lean() returning { type: "Buffer", data: [...] }
  if (Array.isArray(rawData.data)) {
    return Buffer.from(rawData.data);
  }

  // Handles plain array
  if (Array.isArray(rawData)) {
    return Buffer.from(rawData);
  }

  return Buffer.from(rawData);
}

export async function POST(req) {
  try {
    const { userId, errorResponse } = requireFirebaseUserId(req);

    if (errorResponse) {
      return errorResponse;
    }

    await connectDB();

    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "No document id provided" },
        { status: 400 }
      );
    }

    const savedDocument = await UploadedDocument.findOne({
      _id: documentId,
      userId,
    }).lean();

    if (!savedDocument) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const lowerName = savedDocument.originalName.toLowerCase();

    if (
      !lowerName.endsWith(".txt") &&
      !lowerName.endsWith(".pdf") &&
      !lowerName.endsWith(".docx")
    ) {
      return NextResponse.json(
        {
          error:
            "Only TXT, PDF, and DOCX files are currently supported for analysis.",
        },
        { status: 400 }
      );
    }

    const fileBuffer = getUploadedDocumentBuffer(savedDocument);

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        {
          error:
            "Uploaded file data is empty. Please upload the file again.",
        },
        { status: 400 }
      );
    }

    let content = "";

    if (lowerName.endsWith(".txt")) {
      content = fileBuffer.toString("utf-8");
    } else if (lowerName.endsWith(".pdf")) {
      try {
        const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
        const pdfData = await extractText(pdf, { mergePages: true });
        content = pdfData.text || "";
      } catch (error) {
        console.error("PDF parse failed:", error);

        return NextResponse.json(
          {
            error:
              "Could not read this PDF. Please try a different PDF or export it again.",
          },
          { status: 400 }
        );
      }
    } else if (lowerName.endsWith(".docx")) {
      try {
        const docxData = await mammoth.extractRawText({
          buffer: fileBuffer,
        });

        content = docxData.value || "";
      } catch (error) {
        console.error("DOCX parse failed:", error);

        return NextResponse.json(
          {
            error:
              "Could not read this DOCX file. It may be empty, corrupted, or not a real Word document.",
          },
          { status: 400 }
        );
      }
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
1. is_actionable_assignment: Set TRUE if this is an assignment, a homework, a project, a quiz, a exam, a study guide, practice, proposal, lab, or an essay. Set FALSE if this is a syllabus, course schedule, lecture, or policy document.
2. If FALSE, set "minutes" to 0, "due_date" to "", and "keywords" to [].
3. If TRUE, extract the minutes, due date, and 2 to 3 highly specific study keywords.
- Use YYYY-MM-DD format for dates, if no due date is found, return "".
4. keywords: ALWAYS extract 3 to 4 highly specific technical study topics from the document. NEVER leave this array empty.

Assignment Text:
${content}`,
        },
      ],
    });

    const raw = response.choices[0].message.content || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
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

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}