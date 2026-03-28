"use client"; // Marks this as a client component so useState and browser events work

import { useEffect, useRef, useState } from "react"; // React hooks for managing state and refs

export default function UploadForm() {
  const fileInputRef = useRef(null); // Ref lets us open the hidden file input manually

  const [file, setFile] = useState(null); // Stores the file the user picked
  const [message, setMessage] = useState(""); // Stores status text shown on screen
  const [loading, setLoading] = useState(false); // Controls button disabled/loading text
  const [dragging, setDragging] = useState(false); // Tracks whether a file is being dragged over the box
  const [savedAssignments, setSavedAssignments] = useState([]); //local state to store saved assignments (can be expanded to use global state or DB later)

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

  // Load saved assignments from localStorage when component mounts
  useEffect(() => {
  const stored = localStorage.getItem("savedAssignments");
  if (stored) {
    setSavedAssignments(JSON.parse(stored));
  }
  }, []);

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

  // When the user submits the review form, save the details to localStorage (or could be sent to backend)
  function handleReviewSubmit(e) {
    e.preventDefault();

    const reviewedAssignment = {
      id: Date.now(),
      title: assignmentTitle,
      minutes: Number(minutes),
      dueDate,
    };

    const updatedAssignments = [...savedAssignments, reviewedAssignment];

    setSavedAssignments(updatedAssignments);
    localStorage.setItem("savedAssignments", JSON.stringify(updatedAssignments));

    setMessage(
      `Saved locally: ${assignmentTitle} | ${minutes} minutes | Due: ${dueDate}`
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
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
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
            dragging
              ? "border-blue-400 bg-zinc-900"
              : "border-zinc-600 bg-zinc-950 hover:border-zinc-400"
          }`}
        >
          <p className="text-3xl mb-2">📄</p>
          <p className="text-xl font-semibold text-white">Drag and drop a file here</p>
          <p className="text-sm text-zinc-400">or click to choose a file</p>

          {/* Show selected file name */}
          {file && (
            <p className="mt-4 text-sm text-zinc-300">
              Selected file: <span className="font-semibold text-white">{file.name}</span>
            </p>
          )}
        </div>

        {/* Submit button; disabled while request is running */}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {/* Status / result text appears here */}
      {message && <p className="text-zinc-200">{message}</p>}

      {/* Review form appears after AI extracts details */}
      {showReview && (
        <form
          onSubmit={handleReviewSubmit}
          className="space-y-5 rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-white">
            Review Extracted Assignment Details
          </h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-200">Assignment Title</label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-400 outline-none focus:border-blue-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-200">Estimated Minutes</label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-400 outline-none focus:border-blue-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-200">Due Date</label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-400 outline-none focus:border-blue-400"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-green-600 px-5 py-3 text-white font-medium hover:bg-green-500"
          >
            Confirm Details
          </button>
        </form>
      )}
      {savedAssignments.length > 0 && (
        <div className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-white">Saved Local Assignments</h2>

          <div className="space-y-3">
            {savedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
              >
                <p className="text-white font-semibold">{assignment.title}</p>
                <p className="text-zinc-300">
                  Estimated Minutes: {assignment.minutes}
                </p>
                <p className="text-zinc-300">Due Date: {assignment.dueDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}