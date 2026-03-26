"use client"; // Marks this as a client component so useState and browser events work

import { useState } from "react";

export default function UploadForm() {
  const [file, setFile] = useState(null); // Stores the file the user picked
  const [message, setMessage] = useState(""); // Stores status text shown on screen
  const [loading, setLoading] = useState(false); // Controls button disabled/loading text

  // Runs when the user picks a file in the input
  function handleFileChange(e) {
    setFile(e.target.files[0]); // Save the first selected file into state
  }

  // Runs when the form is submitted
  async function handleSubmit(e) {
    e.preventDefault(); // Stops page refresh

    // Guard: do nothing if no file was selected
    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    setLoading(true); // Start loading state
    setMessage(""); // Clear old message

    // FormData is used because file uploads are sent as multipart/form-data
    const formData = new FormData();
    formData.append("file", file); // Key "file" must match what backend expects

    try {
      // STEP 1: send actual file to upload API route
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      // Convert response body into JS object
      const uploadData = await uploadRes.json();

      // If upload failed, show backend error and stop
      if (!uploadRes.ok) {
        setMessage(uploadData.error || "Upload failed");
        setLoading(false);
        return;
      }

      // Show progress message after successful upload
      setMessage(`Uploaded: ${uploadData.filename}. Analyzing...`);

      // STEP 2: send uploaded filename to analyze route
      // This route does not need the whole file again, just the saved filename
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Tells backend we are sending JSON
        },
        body: JSON.stringify({
          filename: uploadData.filename,
        }),
      });

      const analyzeData = await analyzeRes.json();

      // If analysis failed, show backend error and stop
      if (!analyzeRes.ok) {
        setMessage(analyzeData.error || "Analysis failed");
        setLoading(false);
        return;
      }

      // Pull structured values out of returned JSON
      // ?. avoids crashing if data is missing
      // ?? gives fallback default values
      const minutes = analyzeData.data?.minutes ?? 0;
      const dueDate = analyzeData.data?.due_date ?? "unknown";

      // Final result shown to the user
      setMessage(`Estimated time: ${minutes} minutes | Due date: ${dueDate}`);
    } catch (err) {
      // Catches network errors or unexpected failures
      console.error(err);
      setMessage("Something went wrong");
    }

    setLoading(false); // End loading state no matter what
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File picker input */}
      <input
        type="file"
        onChange={handleFileChange}
        className="block"
      />

      {/* Submit button; disabled while request is running */}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Status / result text appears here */}
      {message && <p>{message}</p>}
    </form>
  );
}