"use client";

import { useState } from "react";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Runs when user selects a file
  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  // Runs when user clicks upload
  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Uploaded: ${data.filename}`);
      } else {
        setMessage(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="file"
        onChange={handleFileChange}
        className="block"
      />

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}