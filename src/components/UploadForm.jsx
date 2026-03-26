"use client"; // Marks this as a client component so useState and browser events work

import { useRef, useState } from "react";

export default function UploadForm() {
  const fileInputRef = useRef(null); // Ref lets us open the hidden file input manually

  const [file, setFile] = useState(null); // Stores the file the user picked
  const [message, setMessage] = useState(""); // Stores status text shown on screen
  const [loading, setLoading] = useState(false); // Controls button disabled/loading text
  const [dragging, setDragging] = useState(false); // Tracks whether a file is being dragged over the box

  // extracted / editable fields
  const [assignmentTitle, setAssignmentTitle] = useState(""); // Editable assignment title after AI extraction
  const [minutes, setMinutes] = useState(""); // Editable estimated minutes
  const [dueDate, setDueDate] = useState(""); // Editable due date
  const [showReview, setShowReview] = useState(false); // Controls whether review form is shown

  // Save selected file into state
  function handleSelectedFile(selectedFile) {
    if (!selectedFile) return;
    setFile(selectedFile);
    setMessage(""); // Clear old message when a new file is chosen
    setShowReview(false); // Hide old review form when new file is chosen
  }

  // Runs when the user picks a file in the input
  function handleFileChange(e) {
    handleSelectedFile(e.target.files?.[0]); // Save the first selected file into state
  }

  // Prevent browser from opening the file and show drag state
  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  // Remove drag state when file leaves the drop zone
  function handleDragLeave(e) {
    e.preventDefault();
    setDragging(false);
  }

  // Runs when the user drops a file into the drop zone
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleSelectedFile(e.dataTransfer.files?.[0]);
  }

  // Opens the hidden file picker when the drop zone is clicked
  function openFilePicker() {
    fileInputRef.current?.click();
  }

  // Runs when the form is submitted
  async function handleSubmit(e) {
    e.preventDefault(); // Stops page refresh

    // Guard: do nothing if no file was selected
    if (!file) {
      setMessage("Please select or drop a file.");
      return;
    }

    setLoading(true); // Start loading state
    setMessage(""); // Clear old message
    setShowReview(false); // Hide review form while new analysis runs

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
      const extractedMinutes = analyzeData.data?.minutes ?? 0;
      const extractedDueDate = analyzeData.data?.due_date ?? "unknown";

      // Prefill editable review fields
      setAssignmentTitle(file.name);
      setMinutes(String(extractedMinutes));
      setDueDate(extractedDueDate);
      setShowReview(true);

      // Final status shown before user reviews extracted data
      setMessage("Review and edit the extracted assignment details below.");
    } catch (err) {
      // Catches network errors or unexpected failures
      console.error(err);
      setMessage("Something went wrong");
    }

    setLoading(false); // End loading state no matter what
  }

  // Runs when user confirms the extracted assignment details
  function handleReviewSubmit(e) {
    e.preventDefault();

    // Later this can save to DB / app state
    setMessage(
      `Reviewed assignment saved locally: ${assignmentTitle} | ${minutes} minutes | Due: ${dueDate}`
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden file picker input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.pdf,.docx"
        />

        {/* Drag and drop area; also opens file picker when clicked */}
        <div
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded border-2 border-dashed p-6 text-center ${
            dragging ? "border-blue-500 bg-gray-900" : "border-gray-500"
          }`}
        >
          <p className="font-medium">Drag and drop a file here</p>
          <p className="text-sm opacity-80">or click to choose a file</p>

          {/* Show selected file name */}
          {file && (
            <p className="mt-3 text-sm">
              Selected file: <span className="font-semibold">{file.name}</span>
            </p>
          )}
        </div>

        {/* Submit button; disabled while request is running */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {/* Status / result text appears here */}
      {message && <p>{message}</p>}

      {/* Review form appears after AI extracts details */}
      {showReview && (
        <form onSubmit={handleReviewSubmit} className="space-y-4 rounded border p-4">
          <h2 className="text-lg font-semibold">Review Extracted Assignment Details</h2>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Assignment Title</label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              className="w-full rounded border px-3 py-2 text-black"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Estimated Minutes</label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full rounded border px-3 py-2 text-black"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Due Date</label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded border px-3 py-2 text-black"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            Confirm Details
          </button>
        </form>
      )}
    </div>
  );
}