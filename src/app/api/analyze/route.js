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
          content: "You estimate how long assignments take students.",
        },
        {
          role: "user",
          content: `Estimate how many minutes this assignment will take:\n\n${content}`,
        },
      ],
    });

    // Pull the model's text response out of the API result
    const result = response.choices[0].message.content;

    // Send the estimate back to the frontend as JSON
    return NextResponse.json({
      success: true,
      estimate: result,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json( //generic server error
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}