"use client";

import { useEffect, useRef, useState } from "react";
import AssignmentReviewForm from "./AssignmentReviewForm";
import SavedAssignmentsList from "./SavedAssignmentsList";

function normalizeDateForInput(dateString) {
  if (!dateString) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const lowered = String(dateString).trim().toLowerCase();

  if (lowered === "today") {
    return new Date().toISOString().split("T")[0];
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
}

function mapAssignmentFromDb(assignment) {
  return {
    id: assignment._id,
    title: assignment.title || "",
    minutes: assignment.duration ?? 0,
    dueDate: normalizeDateForInput(assignment.dueDate),
  };
}

export default function UploadForm() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [savedAssignments, setSavedAssignments] = useState([]);

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // animated dots
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!loading) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, [loading]);

  async function fetchSavedAssignments() {
    try {
      const response = await fetch("/api/assignments");

      if (!response.ok) {
        throw new Error("Failed to fetch assignments from database.");
      }

      const data = await response.json();
      const normalizedAssignments = Array.isArray(data)
        ? data.map(mapAssignmentFromDb)
        : [];

      setSavedAssignments(normalizedAssignments);
    } catch (error) {
      console.error("Failed to load assignments:", error);
      setMessage("Could not load saved assignments from database.");
    }
  }

  useEffect(() => {
    fetchSavedAssignments();
  }, []);

  function handleSelectedFile(selectedFile) {
    if (!selectedFile) return;
    setFile(selectedFile);
    setMessage("");
    setShowReview(false);
    setEditingId(null);
  }

  function handleFileChange(e) {
    handleSelectedFile(e.target.files?.[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleSelectedFile(e.dataTransfer.files?.[0]);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setMessage("Please select or drop a file.");
      return;
    }

    setLoading(true);
    setMessage("");
    setShowReview(false);
    setEditingId(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setMessage(uploadData.error || "Upload failed.");
        return;
      }

      setMessage(`Uploaded: ${uploadData.filename}. Analyzing...`);

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: uploadData.filename,
        }),
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok) {
        setMessage(analyzeData.error || "Analysis failed.");
        return;
      }

      if (!analyzeData.success || !analyzeData.data) {
        setMessage("Analysis returned invalid data.");
        return;
      }

      const extractedMinutes = analyzeData.data.minutes ?? 0;
      const extractedDueDate = normalizeDateForInput(
        analyzeData.data.due_date ?? ""
      );

      setAssignmentTitle(file.name);
      setMinutes(String(extractedMinutes));
      setDueDate(extractedDueDate);
      setShowReview(true);

      setMessage("Review and edit the extracted assignment details below.");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong while processing the file.");
    } finally {
      setLoading(false);
    }
  }

  function handleReviewSubmit(e) {
    e.preventDefault();

    const reviewedAssignment = {
      id: editingId ?? Date.now(),
      title: assignmentTitle,
      minutes: Number(minutes),
      dueDate: normalizeDateForInput(dueDate),
    };

    const updatedAssignments =
      editingId !== null
        ? savedAssignments.map((assignment) =>
            assignment.id === editingId ? reviewedAssignment : assignment
          )
        : [...savedAssignments, reviewedAssignment];

    setSavedAssignments(updatedAssignments);

    setAssignmentTitle("");
    setMinutes("");
    setDueDate("");
    setShowReview(false);
    setEditingId(null);
    setFile(null);
    setMessage("");
  }

  function handleSaveEdit(id, updatedFields) {
    const updatedAssignments = savedAssignments.map((assignment) =>
      assignment.id === id
        ? {
            ...assignment,
            ...updatedFields,
            dueDate: normalizeDateForInput(updatedFields.dueDate),
          }
        : assignment
    );

    setSavedAssignments(updatedAssignments);
  }

  function handleDeleteAssignment(id) {
    const updatedAssignments = savedAssignments.filter(
      (assignment) => assignment.id !== id
    );

    setSavedAssignments(updatedAssignments);
  }

  function handleCancelEdit() {
    setAssignmentTitle("");
    setMinutes("");
    setDueDate("");
    setShowReview(false);
    setEditingId(null);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".txt"
        />

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
          <p className="mb-2 text-3xl">📄</p>
          <p className="text-xl font-semibold text-white">
            Drag and drop a TXT file here
          </p>
          <p className="text-sm text-zinc-400">or click to choose a file</p>

          {file && (
            <p className="mt-4 text-sm text-zinc-300">
              Selected file:{" "}
              <span className="font-semibold text-white">{file.name}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? `Uploading${dots}` : "Upload"}
          </button>

          {loading && (
            <div className="spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          )}
        </div>
      </form>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.toLowerCase().includes("failed") ||
            message.toLowerCase().includes("wrong") ||
            message.toLowerCase().includes("invalid") ||
            message.toLowerCase().includes("could not")
              ? "border-red-500 bg-red-500/10 text-red-300"
              : "border-zinc-700 bg-zinc-900 text-zinc-200"
          }`}
        >
          {message}
        </div>
      )}

      {showReview && (
        <AssignmentReviewForm
          assignmentTitle={assignmentTitle}
          setAssignmentTitle={setAssignmentTitle}
          minutes={minutes}
          setMinutes={setMinutes}
          dueDate={dueDate}
          setDueDate={setDueDate}
          editingId={editingId}
          onSubmit={handleReviewSubmit}
          onCancel={handleCancelEdit}
        />
      )}

      <SavedAssignmentsList
        savedAssignments={savedAssignments}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDeleteAssignment}
      />
    </div>
  );
}