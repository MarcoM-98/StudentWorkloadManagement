"use client";
import { useState } from "react";

const [file, setFile] = useState(null);

function handleFileChange(e) {
  setFile(e.target.files[0]);
}

export default function UploadForm() {
  return (
    <div>
      <h2>Upload Assignment</h2>
      <input type="file" onChange={handleFileChange} />
    </div>
  );

}
