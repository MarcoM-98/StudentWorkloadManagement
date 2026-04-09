"use client";

import UploadForm from "../../components/UploadForm";
import DashboardLayout from "@/components/DashboardLayout";

export default function AssignmentsPage() {
  return (
    <DashboardLayout>
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Assignments</h1>

        <UploadForm />
      </main>
    </DashboardLayout>
  );
}