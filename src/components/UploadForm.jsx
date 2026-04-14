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

<<<<<<< HEAD
  async function handleReviewSubmit(e) {
    e.preventDefault();

    const reviewedAssignment = {
      title: assignmentTitle,
      duration: Number(minutes),
      dueDate: normalizeDateForInput(dueDate),
      priorityPercentage: 0,
    };
=======
async function handleReviewSubmit(e) {
  e.preventDefault();

  const reviewedAssignment = {
    title: assignmentTitle,
    duration: Number(minutes),
    dueDate: normalizeDateForInput(dueDate),
    priorityPercentage: 0,
  };
>>>>>>> baea7f2 (SCRUM-78: save uploaded assignments to database)

  try {
    if (editingId !== null) {
      const updatedAssignments = savedAssignments.map((assignment) =>
        assignment.id === editingId
          ? {
              ...assignment,
              title: assignmentTitle,
              minutes: Number(minutes),
              dueDate: normalizeDateForInput(dueDate),
            }
          : assignment
      );

<<<<<<< HEAD
        setSavedAssignments(updatedAssignments);
      } else {
        const response = await fetch("/api/assignments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewedAssignment),
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Failed to save assignment.");
          return;
        }

        const newAssignment = mapAssignmentFromDb(data);
        setSavedAssignments((prev) => [...prev, newAssignment]);
      }

      setAssignmentTitle("");
      setMinutes("");
      setDueDate("");
      setShowReview(false);
      setEditingId(null);
      setFile(null);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Failed to save assignment.");
    }
=======
      setSavedAssignments(updatedAssignments);
    } else {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewedAssignment),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to save assignment.");
        return;
      }

      setSavedAssignments((prev) => [...prev, mapAssignmentFromDb(data)]);
    }

    setAssignmentTitle("");
    setMinutes("");
    setDueDate("");
    setShowReview(false);
    setEditingId(null);
    setFile(null);
    setMessage("");
  } catch (error) {
    console.error(error);
    setMessage("Failed to save assignment.");
>>>>>>> baea7f2 (SCRUM-78: save uploaded assignments to database)
  }
}

  async function handleSaveEdit(id, updatedFields) {
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: updatedFields.title,
          duration: Number(updatedFields.minutes),
          dueDate: normalizeDateForInput(updatedFields.dueDate),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to update assignment.");
        return;
      }

      const updatedAssignment = mapAssignmentFromDb(data);

      setSavedAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === id ? updatedAssignment : assignment
        )
      );

      setMessage("Assignment updated.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update assignment.");
    }
  }

  async function handleDeleteAssignment(id) {
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to delete assignment.");
        return;
      }

      setSavedAssignments((prev) =>
        prev.filter((assignment) => assignment.id !== id)
      );

      setMessage("Assignment deleted.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to delete assignment.");
    }
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
            Drag and drop a TXT, PDF, or DOCX file here
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