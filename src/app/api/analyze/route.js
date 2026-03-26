import { NextResponse } from "next/server"; // Lets us send JSON responses back from a Next.js API route
import fs from "fs"; // read files from disk
import path from "path"; // build safe file paths for diff OS
import OpenAI from "openai"; 

// Create one OpenAI client using the API key from your .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
                    2. Due date (if mentioned, otherwise "unknown")

                    Respond EXACTLY in this format:
                    {
                    "minutes": number,
                    "due_date": "string"
                    }

                    Example:
                    {
                    "minutes": 120,
                    "due_date": "01JAN26"
                    }

                    Assignment:${content}`,
        },
      ],
    });

// Raw AI response (string)
    const raw = response.choices[0].message.content;

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
        due_date: "unknown",
      };
    }

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