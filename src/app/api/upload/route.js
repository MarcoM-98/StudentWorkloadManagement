// NextResponse lets us return JSON responses from a Next.js API route
import { NextResponse } from "next/server";

// Node.js modules used to store files on the server
import fs from "fs";
import path from "path";

/*
  POST handler for the upload API.

  When the frontend sends a file using:
  POST /api/upload

  this function receives the request and processes the file.
*/
export async function POST(req) {
  try {

    // Convert the request body into form data
    // This is required because file uploads use multipart/form-data
    const formData = await req.formData();

    // Retrieve the uploaded file from the form
    const file = formData.get("file");

    // If no file was included in the request, return an error
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    /*
      Define allowed file types.

      These correspond to MIME types used by browsers when uploading files.
      We only allow formats that are easy to extract text from.
    */
    const allowedTypes = [
      "application/pdf", // PDF documents
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "text/plain" // TXT
    ];

    // Reject file if the type is not in our allowed list
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    /*
      Enforce the file size limit.

      10MB = 10 * 1024 * 1024 bytes

      This protects the server from very large uploads.
    */
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit" },
        { status: 400 }
      );
    }

    /*
      Convert the uploaded file into a buffer so Node.js
      can write it to disk.
    */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /*
      Determine where uploaded files will be stored.

      process.cwd() = project root directory
    */
    const uploadDir = path.join(process.cwd(), "uploads");

    // If the uploads folder does not exist yet, create it
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    /*
      Create the full path where the file will be saved.

      Example result:
      /uploads/assignment1.pdf
    */
    const filePath = path.join(uploadDir, file.name);

    // Write the file to the uploads folder
    fs.writeFileSync(filePath, buffer);

    /*
      Send a success response back to the frontend.

      The frontend can use this response to display
      a confirmation message to the user.
    */
    return NextResponse.json({
      success: true,
      filename: file.name
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}